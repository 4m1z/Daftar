import { useNavigate, useSearchParams } from "@solidjs/router";

import type { Project, SplitMode } from "./types";

export type NotesViewMode = "view-mode" | "edit-mode" | "both";

const VIEW_MODES = new Set<NotesViewMode>(["view-mode", "edit-mode", "both"]);

export const notesNotebookPath = (notebookId: string) => `/?notebook=${encodeURIComponent(notebookId)}`;

export const notesNotePath = (notebookId: string, noteId: string, mode: NotesViewMode = "edit-mode") =>
    `/?notebook=${encodeURIComponent(notebookId)}&note=${encodeURIComponent(noteId)}&mode=${mode}`;

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

/** URL-backed notebook, note, and editor mode state for the notes workspace. */
export function useNotesRoute() {
    const [params] = useSearchParams<{ notebook?: string; note?: string; mode?: string }>();
    const navigate = useNavigate();

    const selectedProject = () => params.notebook ?? "";
    const selectedNote = () => params.note ?? "";
    const splitMode = () => toSplitMode(params.mode);

    const showRoot = (replace = false) => navigate("/", { replace });
    const pickProject = (projectId: string, replace = false) => navigate(notesNotebookPath(projectId), { replace });
    const selectNote = (projectId: string, noteId: string, mode: NotesViewMode = "edit-mode", replace = false) =>
        navigate(notesNotePath(projectId, noteId, mode), { replace });
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
        if (!project) return "/";

        const noteId = selectedNote();
        if (!noteId) return null;
        if (!project.notes.some((note) => note.id === noteId)) return notesNotebookPath(projectId);
        if (!VIEW_MODES.has(params.mode as NotesViewMode)) return notesNotePath(projectId, noteId);
        return null;
    };

    const replacePath = (path: string) => navigate(path, { replace: true });

    return {
        selectedProject,
        selectedNote,
        splitMode,
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
