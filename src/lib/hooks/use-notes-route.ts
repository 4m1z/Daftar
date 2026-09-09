import { useLocation, useNavigate, useSearchParams } from "@solidjs/router";
import { createMemo } from "solid-js";

import type { Project, SplitMode } from "~/lib/types/notes";

export type NotesViewMode = "view-mode" | "edit-mode" | "both";

const VIEW_MODES = new Set<NotesViewMode>(["view-mode", "edit-mode", "both"]);

const searchPath = (query: string | undefined) => query ? `?search=${encodeURIComponent(query)}` : "";

const notesRootPath = (query: string | undefined) => query ? `/?search=${encodeURIComponent(query)}` : "/";

export const notesNotebookPath = (notebookId: string, query?: string) =>
    `/notes/${encodeURIComponent(notebookId)}${searchPath(query)}`;

export const notesNotePath = (notebookId: string, noteId: string, mode: NotesViewMode = "edit-mode", query?: string) =>
    `/notes/${encodeURIComponent(notebookId)}/note/${encodeURIComponent(noteId)}/${mode}${searchPath(query)}`;

const decodePathSegment = (value: string | undefined) => {
    if (!value) return "";
    try {
        return decodeURIComponent(value);
    } catch {
        return value;
    }
};

const parseNotesPath = (pathname: string) => {
    const match = /^\/notes\/([^/]+)(?:\/note\/([^/]+)\/([^/]+))?\/?$/.exec(pathname);
    return {
        notebookId: match?.[1],
        noteId: match?.[2],
        mode: match?.[3],
    };
};

const toSplitMode = (mode: string | undefined): SplitMode => {
    if (mode === "view-mode") return "preview";
    if (mode === "both") return "split";
    return "edit";
};

const toViewMode = (mode: SplitMode): NotesViewMode => {
    if (mode === "preview") return "view-mode";
    if (mode === "split") return "both";
    return "edit-mode";
};

/** URL-backed notebook, note, editor mode, and search state for the notes workspace. */
export function useNotesRoute() {
    const location = useLocation();
    const [searchParams, setSearchParams] = useSearchParams<{ search?: string }>();
    const navigate = useNavigate();
    // Descendant route params resolve incrementally while lazy route modules load.
    // The pathname changes atomically, so workspace selection never clears mid-navigation.
    const params = createMemo(() => parseNotesPath(location.pathname));

    const selectedProject = () => decodePathSegment(params().notebookId);
    const selectedNote = () => decodePathSegment(params().noteId);
    const splitMode = () => toSplitMode(params().mode);
    const searchQuery = () => searchParams.search ?? "";
    const setSearchQuery = (query: string) => setSearchParams({ search: query || undefined }, { replace: true });

    const showRoot = (replace = false) => navigate(notesRootPath(searchParams.search), { replace });
    const pickProject = (projectId: string, replace = false) =>
        navigate(notesNotebookPath(projectId, searchParams.search), { replace });
    const selectNote = (projectId: string, noteId: string, mode: NotesViewMode = "edit-mode", replace = false) =>
        navigate(notesNotePath(projectId, noteId, mode, searchParams.search), { replace });
    const pickNote = (noteId: string) => {
        const projectId = selectedProject();
        if (!projectId) return;
        // Clicking the already-open note is a no-op: it must not reset the
        // editor mode, restart the reveal, or disturb the cursor.
        if (selectedNote() === noteId) return;
        selectNote(projectId, noteId);
    };
    const setSplitMode = (mode: SplitMode) => {
        const projectId = selectedProject();
        const noteId = selectedNote();
        if (projectId && noteId) selectNote(projectId, noteId, toViewMode(mode));
    };

    const canonicalPath = (projects: Project[]) => {
        const projectId = selectedProject();
        if (!projectId) return null;
        const project = projects.find((item) => item.id === projectId);
        if (!project) return notesRootPath(searchParams.search);

        const noteId = selectedNote();
        if (!noteId) return null;
        if (!project.notes.some((note) => note.id === noteId)) return notesNotebookPath(projectId, searchParams.search);
        if (!VIEW_MODES.has(params().mode as NotesViewMode)) {
            return notesNotePath(projectId, noteId, "edit-mode", searchParams.search);
        }
        return null;
    };

    const replacePath = (path: string) => navigate(path, { replace: true });

    return {
        selectedProject,
        selectedNote,
        splitMode,
        searchQuery,
        setSearchQuery,
        showRoot,
        pickProject,
        pickNote,
        selectNote,
        setSplitMode,
        canonicalPath,
        replacePath,
    };
}

export type NotesRoute = ReturnType<typeof useNotesRoute>;
