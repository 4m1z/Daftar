import { useNavigate, useSearchParams } from "@solidjs/router";

import type { Project, SplitMode } from "~/lib/types/notes";

export type NotesViewMode = "view-mode" | "edit-mode" | "both";

const VIEW_MODES = new Set<NotesViewMode>(["view-mode", "edit-mode", "both"]);

const searchPath = (query: string | undefined) => query ? `&search=${encodeURIComponent(query)}` : "";

const notesRootPath = (query: string | undefined) => query ? `/?search=${encodeURIComponent(query)}` : "/";

export const notesNotebookPath = (notebookId: string, query?: string) =>
    `/?notebook=${encodeURIComponent(notebookId)}${searchPath(query)}`;

export const notesNotePath = (notebookId: string, noteId: string, mode: NotesViewMode = "edit-mode", query?: string) =>
    `/?notebook=${encodeURIComponent(notebookId)}&note=${encodeURIComponent(noteId)}&mode=${mode}${searchPath(query)}`;

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
    const [params, setParams] = useSearchParams<{ notebook?: string; note?: string; mode?: string; search?: string }>();
    const navigate = useNavigate();

    const selectedProject = () => params.notebook ?? "";
    const selectedNote = () => params.note ?? "";
    const splitMode = () => toSplitMode(params.mode);
    const searchQuery = () => params.search ?? "";
    const setSearchQuery = (query: string) => setParams({ search: query || undefined }, { replace: true });

    const showRoot = (replace = false) => navigate(notesRootPath(params.search), { replace });
    const pickProject = (projectId: string, replace = false) =>
        navigate(notesNotebookPath(projectId, params.search), { replace });
    const selectNote = (projectId: string, noteId: string, mode: NotesViewMode = "edit-mode", replace = false) =>
        navigate(notesNotePath(projectId, noteId, mode, params.search), { replace });
    const pickNote = (noteId: string) => {
        const projectId = selectedProject();
        if (projectId) selectNote(projectId, noteId);
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
        if (!project) return notesRootPath(params.search);

        const noteId = selectedNote();
        if (!noteId) return null;
        if (!project.notes.some((note) => note.id === noteId)) return notesNotebookPath(projectId, params.search);
        if (!VIEW_MODES.has(params.mode as NotesViewMode)) return notesNotePath(projectId, noteId, "edit-mode", params.search);
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
