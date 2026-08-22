import { createEffect, onCleanup } from "solid-js";

import { NOTE_SAVE_DELAY, PROJECT_SAVE_DELAY } from "~/lib/constants/notes";
import type { NotesStore } from "./use-notes-store";

/**
 * Debounced autosave for the active note's content/title and for notebook
 * renames. It compares the current serialized payload against the store's saved
 * baseline so it only fires for genuine user edits (never for hydration or
 * freshly created records) and skips while a save is already in flight.
 */
export function useNotesAutosave(store: NotesStore) {
    let noteTimeout: number | undefined;
    let projectTimeout: number | undefined;
    let pendingNote: { payload: string; note: NonNullable<ReturnType<typeof store.activeNote>> } | undefined;
    let pendingProject: { payload: string; project: NonNullable<ReturnType<typeof store.activeProject>> } | undefined;

    const savePendingNote = () => {
        const pending = pendingNote;
        window.clearTimeout(noteTimeout);
        noteTimeout = undefined;
        pendingNote = undefined;
        if (!pending) return;

        void store
            .submit({
                intent: "updateNote",
                noteId: pending.note.id,
                title: pending.note.title,
                content: pending.note.content,
            })
            .then((saved) => {
                if (saved && store.activeNote()?.id === pending.note.id) store.markNoteSaved(pending.payload);
            });
    };

    const savePendingProject = () => {
        const pending = pendingProject;
        window.clearTimeout(projectTimeout);
        projectTimeout = undefined;
        pendingProject = undefined;
        if (!pending) return;

        void store
            .submit({ intent: "renameProject", projectId: pending.project.id, name: pending.project.name })
            .then((saved) => {
                if (saved && store.activeProject()?.id === pending.project.id) store.markProjectSaved(pending.payload);
            });
    };

    // Debounced autosave for note edits.
    createEffect(
        () => ({ payload: store.notePayload(), note: store.activeNote(), saving: store.isSaving() }),
        ({ payload, note, saving }) => {
            if (pendingNote && pendingNote.note.id !== note?.id) savePendingNote();
            window.clearTimeout(noteTimeout);
            noteTimeout = undefined;
            pendingNote = undefined;
            if (!store.hasLoaded() || !note || payload === store.getSavedNote() || saving) return;
            pendingNote = { payload, note };
            noteTimeout = window.setTimeout(savePendingNote, NOTE_SAVE_DELAY);
        },
    );

    // Debounced autosave for notebook renames.
    createEffect(
        () => ({ payload: store.projectPayload(), project: store.activeProject(), saving: store.isSaving() }),
        ({ payload, project, saving }) => {
            if (pendingProject && pendingProject.project.id !== project?.id) savePendingProject();
            window.clearTimeout(projectTimeout);
            projectTimeout = undefined;
            pendingProject = undefined;
            if (!store.hasLoaded() || !project || payload === store.getSavedProject() || saving) return;
            pendingProject = { payload, project };
            projectTimeout = window.setTimeout(savePendingProject, PROJECT_SAVE_DELAY);
        },
    );

    onCleanup(() => {
        if (typeof window === "undefined") return;
        savePendingNote();
        savePendingProject();
    });
}
