import { createEffect } from "solid-js";

import { NOTE_SAVE_DELAY, PROJECT_SAVE_DELAY } from "~/lib/constants/notes";
import type { NotesStore } from "./use-notes-store";

/**
 * Debounced autosave for the active note's content/title and for notebook
 * renames. It compares the current serialized payload against the store's saved
 * baseline so it only fires for genuine user edits (never for hydration or
 * freshly created records) and skips while a save is already in flight.
 */
export function useNotesAutosave(store: NotesStore) {
    // Debounced autosave for note edits.
    createEffect(
        () => ({ payload: store.notePayload(), note: store.activeNote(), saving: store.isSaving() }),
        ({ payload, note, saving }) => {
            if (!store.hasLoaded() || !note || payload === store.getSavedNote() || saving) return;
            const timeout = window.setTimeout(() => {
                store.markNoteSaved(payload);
                store.submit({ intent: "updateNote", noteId: note.id, title: note.title, content: note.content });
            }, NOTE_SAVE_DELAY);
            return () => window.clearTimeout(timeout);
        },
    );

    // Debounced autosave for notebook renames.
    createEffect(
        () => ({ payload: store.projectPayload(), project: store.activeProject(), saving: store.isSaving() }),
        ({ payload, project, saving }) => {
            if (!store.hasLoaded() || !project || payload === store.getSavedProject() || saving) return;
            const timeout = window.setTimeout(() => {
                store.markProjectSaved(payload);
                store.submit({ intent: "renameProject", projectId: project.id, name: project.name });
            }, PROJECT_SAVE_DELAY);
            return () => window.clearTimeout(timeout);
        },
    );
}
