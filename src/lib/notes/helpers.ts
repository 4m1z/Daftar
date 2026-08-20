import { COLORS, MAX_SEARCH_RESULTS } from "./constants";
import type { NoteItem, PendingDelete, Project, SearchResult } from "./types";

/** Generates a short, collision-resistant client-side id. */
export function uid() {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

/** Picks the next notebook accent color based on how many notebooks exist. */
export function nextColor(projects: Project[]) {
    return COLORS[projects.length % COLORS.length] ?? COLORS[0];
}

/** Humanizes an ISO timestamp into a short relative label. */
export function relativeTime(iso: string): string {
    try {
        const difference = Date.now() - new Date(iso).getTime();
        const minutes = Math.floor(difference / 60000);
        if (minutes < 1) return "just now";
        if (minutes < 60) return `${minutes} minutes ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours} hours ago`;
        const days = Math.floor(hours / 24);
        if (days < 30) return `${days} days ago`;
        return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(new Date(iso));
    } catch {
        return "";
    }
}

/** Extracts the first meaningful line of a note for list previews. */
export function noteSnippet(content: string): string {
    for (const rawLine of content.split("\n")) {
        const line = rawLine.replace(/^#+\s*/, "").trim();
        if (line) return line.slice(0, 80);
    }
    return "No additional text";
}

/** Subsequence fuzzy match. Returns a score (lower is better) or -1 when no match. */
export function fuzzyMatch(text: string, pattern: string): number {
    if (!pattern) return 0;
    const target = text.toLowerCase();
    const query = pattern.toLowerCase();
    let targetIndex = 0;
    let queryIndex = 0;
    let firstMatch = -1;
    let lastMatch = -1;
    while (targetIndex < target.length && queryIndex < query.length) {
        if (target[targetIndex] === query[queryIndex]) {
            if (firstMatch === -1) firstMatch = targetIndex;
            lastMatch = targetIndex;
            queryIndex += 1;
        }
        targetIndex += 1;
    }
    if (queryIndex < query.length) return -1;
    return lastMatch - firstMatch + firstMatch * 0.5;
}

export function pendingDeleteTitle(item: PendingDelete) {
    return item.kind === "note" ? item.title : "Untitled";
}

export function pendingDeleteName(item: PendingDelete) {
    return item.kind === "project" ? item.name || "Untitled" : "Untitled";
}

/** Sorts notes by most recently updated first. */
export function sortNotesByUpdated(notes: NoteItem[]): NoteItem[] {
    return [...notes].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

/**
 * Applies a persisted display order to a project's notes. Notes missing from the
 * order (e.g. freshly created) are kept at the front; unknown ids are ignored.
 */
export function orderNotes(notes: NoteItem[], order: string[] | undefined): NoteItem[] {
    if (!order) return sortNotesByUpdated(notes);

    const byId = new Map(notes.map((note) => [note.id, note]));
    const seen = new Set<string>();
    const result: NoteItem[] = [];

    for (const note of notes) {
        if (!order.includes(note.id)) {
            result.push(note);
            seen.add(note.id);
        }
    }
    for (const id of order) {
        if (seen.has(id)) continue;
        const note = byId.get(id);
        if (note) result.push(note);
    }
    return result;
}

/** Fuzzy-searches all notebooks/notes and returns ranked results. */
export function searchNotes(projects: Project[], rawQuery: string): SearchResult[] {
    const query = rawQuery.trim();
    if (!query) return [];

    const results: SearchResult[] = [];
    for (const project of projects) {
        for (const note of project.notes) {
            const score = fuzzyMatch(`${project.name} ${note.title} ${note.content}`, query);
            if (score < 0) continue;
            results.push({
                projectId: project.id,
                noteId: note.id,
                projectName: project.name,
                projectColor: project.color,
                noteTitle: note.title || "Untitled",
                snippet: noteSnippet(note.content),
                score,
            });
        }
    }
    results.sort((a, b) => a.score - b.score);
    return results.slice(0, MAX_SEARCH_RESULTS);
}

/** Stable serialization of a note used to detect unsaved changes. */
export function serializeNote(note: Pick<NoteItem, "id" | "title" | "content"> | null): string {
    return JSON.stringify({
        noteId: note?.id ?? "",
        title: note?.title ?? "",
        content: note?.content ?? "",
    });
}

/** Stable serialization of a notebook used to detect unsaved renames. */
export function serializeProject(project: Pick<Project, "id" | "name"> | null): string {
    return JSON.stringify({ projectId: project?.id ?? "", name: project?.name ?? "" });
}

/** Counts words in note content for the editor toolbar. */
export function wordCount(content: string | undefined): number {
    const trimmed = content?.trim();
    return trimmed ? trimmed.split(/\s+/).length : 0;
}
