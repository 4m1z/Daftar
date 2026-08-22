import { action, query } from "@solidjs/router";

import {
    createNotebook,
    createNote,
    deleteNotebook,
    deleteNote as deleteNoteRecord,
    listNotesProjects,
    renameNotebook,
    updateNote,
} from "~/models/notes-workspace.server";
import { DEFAULT_NOTEBOOK_COLOR } from "~/lib/constants/notes";
import type { NotesLoaderData } from "~/lib/types/notes";

export const getNotesData = query(async () => {
    "use server";
    const projects = await listNotesProjects();
    const selectedProjectId = projects[0]?.id ?? "";
    const selectedNoteId = projects[0]?.notes[0]?.id ?? "";
    return {
        projects,
        selectedProjectId,
        selectedNoteId,
        updatedAt: null,
    } satisfies NotesLoaderData;
}, "notes-workspace");

export const notesAction = action(async (formData: FormData) => {
    "use server";
    const intent = String(formData.get("intent") ?? "");
    let result: { updatedAt: Date };

    switch (intent) {
        case "createProject":
            result = await createNotebook({
                id: String(formData.get("projectId") ?? ""),
                name: String(formData.get("name") ?? "New notebook"),
                color: String(formData.get("color") ?? DEFAULT_NOTEBOOK_COLOR),
                firstNoteId: String(formData.get("noteId") ?? ""),
            });
            break;
        case "renameProject":
            result = await renameNotebook(
                String(formData.get("projectId") ?? ""),
                String(formData.get("name") ?? "Untitled"),
            );
            break;
        case "deleteProject":
            result = await deleteNotebook(String(formData.get("projectId") ?? ""));
            break;
        case "createNote":
            result = await createNote({
                notebookId: String(formData.get("projectId") ?? ""),
                noteId: String(formData.get("noteId") ?? ""),
            });
            break;
        case "updateNote":
            result = await updateNote(String(formData.get("noteId") ?? ""), {
                title: String(formData.get("title") ?? "Untitled"),
                content: String(formData.get("content") ?? ""),
            });
            break;
        case "deleteNote":
            result = await deleteNoteRecord(String(formData.get("noteId") ?? ""));
            break;
        default:
            throw new Response("Unknown notes action", { status: 400 });
    }

    return { ok: true, updatedAt: result.updatedAt.toISOString() };
}, "notes-workspace-action");
