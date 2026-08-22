import { describe, expect, it, vi } from "vitest";

import {
    fuzzyMatch,
    nextColor,
    notebookColor,
    noteSnippet,
    orderNotes,
    pendingDeleteName,
    pendingDeleteTitle,
    relativeTime,
    searchNotes,
    serializeNote,
    serializeProject,
    sortNotesByUpdated,
    uid,
    wordCount,
} from "./notes";
import { MAX_SEARCH_RESULTS, NOTEBOOK_COLOR_COUNT } from "~/lib/constants/notes";
import type { NoteItem, Project } from "~/lib/types/notes";

function note(overrides: Partial<NoteItem> = {}): NoteItem {
    return { id: "n1", title: "Title", content: "Body", updatedAt: "2024-01-01T00:00:00.000Z", ...overrides };
}

function project(overrides: Partial<Project> = {}): Project {
    return { id: "p1", name: "Notebook", color: "#000", notes: [], ...overrides };
}

describe("uid", () => {
    it("produces unique values", () => {
        const values = new Set(Array.from({ length: 100 }, () => uid()));
        expect(values.size).toBe(100);
    });

    it("uses a timestamp-random shape", () => {
        expect(uid()).toMatch(/^[a-z0-9]+-[a-z0-9]{1,4}$/);
    });
});

describe("nextColor", () => {
    it("cycles through the palette by project count", () => {
        expect(nextColor([])).toBe("1");
        expect(nextColor(Array(1).fill(project()))).toBe("2");
        expect(nextColor(Array(NOTEBOOK_COLOR_COUNT).fill(project()))).toBe("1");
    });
});

describe("notebookColor", () => {
    it("resolves palette keys to theme-aware CSS tokens", () => {
        expect(notebookColor("3")).toBe("var(--notebook-color-3)");
        expect(notebookColor("unknown")).toBe("var(--notebook-color-1)");
    });
});

describe("relativeTime", () => {
    it("labels recent timestamps", () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2024-06-01T12:00:00.000Z"));

        expect(relativeTime(new Date("2024-06-01T11:59:30.000Z").toISOString())).toBe("just now");
        expect(relativeTime(new Date("2024-06-01T11:30:00.000Z").toISOString())).toBe("30 minutes ago");
        expect(relativeTime(new Date("2024-06-01T09:00:00.000Z").toISOString())).toBe("3 hours ago");
        expect(relativeTime(new Date("2024-05-29T12:00:00.000Z").toISOString())).toBe("3 days ago");

        vi.useRealTimers();
    });

    it("falls back to a formatted date for old timestamps", () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2024-06-01T12:00:00.000Z"));
        expect(relativeTime(new Date("2024-01-01T12:00:00.000Z").toISOString())).not.toBe("");
        vi.useRealTimers();
    });

    it("returns an empty string for invalid input", () => {
        expect(relativeTime("not-a-date")).toBe("");
    });
});

describe("noteSnippet", () => {
    it("returns the first meaningful line, stripped of heading markers", () => {
        expect(noteSnippet("\n\n# Heading\nrest")).toBe("Heading");
        expect(noteSnippet("   \nHello world")).toBe("Hello world");
    });

    it("truncates to 80 characters", () => {
        expect(noteSnippet("a".repeat(200))).toHaveLength(80);
    });

    it("provides a fallback for empty content", () => {
        expect(noteSnippet("")).toBe("No additional text");
        expect(noteSnippet("   \n   ")).toBe("No additional text");
    });
});

describe("fuzzyMatch", () => {
    it("returns 0 for an empty pattern", () => {
        expect(fuzzyMatch("anything", "")).toBe(0);
    });

    it("returns -1 when the pattern is not a subsequence", () => {
        expect(fuzzyMatch("abc", "xyz")).toBe(-1);
        expect(fuzzyMatch("abc", "abcd")).toBe(-1);
    });

    it("scores contiguous matches better (lower) than spread-out ones", () => {
        const contiguous = fuzzyMatch("abcdef", "abc");
        const spread = fuzzyMatch("axbxcx", "abc");
        expect(contiguous).toBeGreaterThanOrEqual(0);
        expect(contiguous).toBeLessThan(spread);
    });

    it("is case-insensitive", () => {
        expect(fuzzyMatch("HELLO", "hlo")).toBeGreaterThanOrEqual(0);
    });
});

describe("sortNotesByUpdated", () => {
    it("orders notes newest-first without mutating the input", () => {
        const older = note({ id: "old", updatedAt: "2024-01-01T00:00:00.000Z" });
        const newer = note({ id: "new", updatedAt: "2024-05-01T00:00:00.000Z" });
        const input = [older, newer];

        const sorted = sortNotesByUpdated(input);

        expect(sorted.map((n) => n.id)).toEqual(["new", "old"]);
        expect(input.map((n) => n.id)).toEqual(["old", "new"]);
    });
});

describe("orderNotes", () => {
    const a = note({ id: "a", updatedAt: "2024-01-01T00:00:00.000Z" });
    const b = note({ id: "b", updatedAt: "2024-03-01T00:00:00.000Z" });
    const c = note({ id: "c", updatedAt: "2024-02-01T00:00:00.000Z" });

    it("falls back to updated-desc when no order is given", () => {
        expect(orderNotes([a, b, c], undefined).map((n) => n.id)).toEqual(["b", "c", "a"]);
    });

    it("applies the persisted order", () => {
        expect(orderNotes([a, b, c], ["c", "a", "b"]).map((n) => n.id)).toEqual(["c", "a", "b"]);
    });

    it("keeps notes missing from the order at the front", () => {
        // "b" is newly created and not part of the stored order.
        expect(orderNotes([a, b, c], ["c", "a"]).map((n) => n.id)).toEqual(["b", "c", "a"]);
    });

    it("ignores unknown ids in the order", () => {
        expect(orderNotes([a, c], ["c", "ghost", "a"]).map((n) => n.id)).toEqual(["c", "a"]);
    });
});

describe("searchNotes", () => {
    const projects: Project[] = [
        project({
            id: "p1",
            name: "Web Tech",
            color: "#111",
            notes: [
                note({ id: "n1", title: "Solid JS", content: "signals and effects" }),
                note({ id: "n2", title: "Routing", content: "file based routing" }),
            ],
        }),
        project({
            id: "p2",
            name: "Cooking",
            color: "#222",
            notes: [note({ id: "n3", title: "Pasta", content: "boil water" })],
        }),
    ];

    it("returns an empty array for a blank query", () => {
        expect(searchNotes(projects, "   ")).toEqual([]);
    });

    it("finds matches across notebooks and notes", () => {
        const results = searchNotes(projects, "solid");
        expect(results.length).toBeGreaterThan(0);
        expect(results[0].noteId).toBe("n1");
        expect(results[0].projectName).toBe("Web Tech");
        expect(results[0].snippet).toBe("signals and effects");
    });

    it("uses 'Untitled' for empty note titles", () => {
        const withUntitled = [project({ notes: [note({ id: "x", title: "", content: "zzz body" })] })];
        expect(searchNotes(withUntitled, "zzz")[0].noteTitle).toBe("Untitled");
    });

    it("caps the number of results", () => {
        const many = project({
            notes: Array.from({ length: MAX_SEARCH_RESULTS + 20 }, (_, i) =>
                note({ id: `k${i}`, title: `match ${i}`, content: "match" }),
            ),
        });
        expect(searchNotes([many], "match")).toHaveLength(MAX_SEARCH_RESULTS);
    });
});

describe("serialize helpers", () => {
    it("serializes note identity fields and ignores updatedAt", () => {
        const first = serializeNote(note({ updatedAt: "2024-01-01T00:00:00.000Z" }));
        const second = serializeNote(note({ updatedAt: "2025-01-01T00:00:00.000Z" }));
        expect(first).toBe(second);
    });

    it("detects title/content changes", () => {
        expect(serializeNote(note({ title: "A" }))).not.toBe(serializeNote(note({ title: "B" })));
    });

    it("handles null inputs", () => {
        expect(serializeNote(null)).toBe(JSON.stringify({ noteId: "", title: "", content: "" }));
        expect(serializeProject(null)).toBe(JSON.stringify({ projectId: "", name: "" }));
    });

    it("serializes project identity fields", () => {
        expect(serializeProject(project({ id: "p1", name: "N" }))).toBe(JSON.stringify({ projectId: "p1", name: "N" }));
    });
});

describe("wordCount", () => {
    it("counts whitespace-separated words", () => {
        expect(wordCount("hello   world\nfoo")).toBe(3);
    });

    it("returns 0 for empty or undefined content", () => {
        expect(wordCount("")).toBe(0);
        expect(wordCount("   ")).toBe(0);
        expect(wordCount(undefined)).toBe(0);
    });
});

describe("pendingDelete labels", () => {
    it("reads the note title", () => {
        expect(pendingDeleteTitle({ kind: "note", id: "n", title: "My note" })).toBe("My note");
        expect(pendingDeleteTitle({ kind: "project", id: "p", name: "My book" })).toBe("Untitled");
    });

    it("reads the project name with a fallback", () => {
        expect(pendingDeleteName({ kind: "project", id: "p", name: "My book" })).toBe("My book");
        expect(pendingDeleteName({ kind: "project", id: "p", name: "" })).toBe("Untitled");
        expect(pendingDeleteName({ kind: "note", id: "n", title: "x" })).toBe("Untitled");
    });
});
