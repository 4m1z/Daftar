import { useAction } from "@solidjs/router";
import { createEffect, createMemo, createSignal, untrack } from "solid-js";

import { getNotesData, notesAction } from "./actions";
import { nextColor, orderNotes, serializeNote, serializeProject, sortNotesByUpdated, uid } from "./helpers";
import type { NoteItem, Project } from "./types";
import type { NotesRoute } from "./use-notes-route";

/**
 * The notes data model: server hydration, optimistic local state, note ordering,
 * selection persistence, and all CRUD mutations. It also tracks the "last saved"
 * baseline so autosave can tell user edits apart from programmatic changes; that
 * baseline is exposed for {@link useNotesAutosave} to consume.
 */
export function useNotesStore(route: NotesRoute) {
    const data = createMemo(() => getNotesData());
    const runNotesAction = useAction(notesAction);
    // Router 2 useSubmissions only retains SETTLED results, so the pending
    // "is saving" state is tracked around direct useAction invocations.
    const [inFlight, setInFlight] = createSignal(0);

    const [projects, setProjects] = createSignal<Project[]>([]);
    const [noteOrderByProject, setNoteOrderByProject] = createSignal<Record<string, string[]>>({});
    const selectedProject = route.selectedProject;
    const selectedNote = route.selectedNote;

    let initialized = false;
    let hasLoadedFlag = false;
    let savedNoteBaseline = "";
    let savedProjectBaseline = "";

    // Baseline accessors shared with the autosave hook.
    const hasLoaded = () => hasLoadedFlag;
    const getSavedNote = () => savedNoteBaseline;
    const markNoteSaved = (payload: string) => (savedNoteBaseline = payload);
    const getSavedProject = () => savedProjectBaseline;
    const markProjectSaved = (payload: string) => (savedProjectBaseline = payload);

    const activeProject = createMemo(() => projects().find((project) => project.id === selectedProject()) ?? null);
    const activeNote = createMemo(() => activeProject()?.notes.find((note) => note.id === selectedNote()) ?? null);
    const notePayload = createMemo(() => serializeNote(activeNote()));
    const projectPayload = createMemo(() => serializeProject(activeProject()));
    const isSaving = createMemo(() => inFlight() > 0);

    const orderedActiveNotes = createMemo(() => {
        const project = activeProject();
        if (!project) return [];
        return orderNotes(project.notes, noteOrderByProject()[project.id]);
    });

    const submit = (values: Record<string, string>) => {
        const formData = new FormData();
        for (const [key, value] of Object.entries(values)) formData.set(key, value);
        setInFlight((count) => count + 1);
        void runNotesAction(formData)
            .catch((error) => console.error("[notes] mutation failed", error))
            .finally(() => setInFlight((count) => Math.max(0, count - 1)));
    };

    // Hydrate local data. Selection is intentionally owned by the URL.
    createEffect(
        () => ({ loaded: data(), projectId: selectedProject(), noteId: selectedNote() }),
        ({ loaded, projectId, noteId }) => {
            if (!loaded || initialized) return;
            initialized = true;
            setProjects(loaded.projects);
            const project = loaded.projects.find((item) => item.id === projectId) ?? null;
            const note = project?.notes.find((item) => item.id === noteId) ?? null;
            markNoteSaved(serializeNote(note));
            markProjectSaved(serializeProject(project));
            hasLoadedFlag = true;
        },
    );

    // Freeze a stable note order per notebook when it becomes active.
    createEffect(
        () => selectedProject(),
        (projectId) => {
            const project = projects().find((item) => item.id === projectId);
            if (!project) return;
            const sortedIds = sortNotesByUpdated(project.notes).map((note) => note.id);
            setNoteOrderByProject((current) => ({ ...current, [project.id]: sortedIds }));
        },
        { defer: true },
    );

    // Switching URL selection establishes a fresh autosave baseline.
    createEffect(
        () => ({ projectId: selectedProject(), noteId: selectedNote() }),
        ({ projectId, noteId }) => {
            if (!hasLoadedFlag) return;
            const project = untrack(projects).find((item) => item.id === projectId) ?? null;
            const note = project?.notes.find((item) => item.id === noteId) ?? null;
            markProjectSaved(serializeProject(project));
            markNoteSaved(serializeNote(note));
        },
        { defer: true },
    );

    const pickProject = (id: string) => route.pickProject(id);

    const addProject = () => {
        const id = uid();
        const noteId = uid();
        const project: Project = {
            id,
            name: "New notebook",
            color: nextColor(projects()),
            notes: [{ id: noteId, title: "First note", content: "", updatedAt: new Date().toISOString() }],
        };
        setProjects((current) => [...current, project]);
        markProjectSaved(serializeProject(project));
        markNoteSaved(serializeNote(project.notes[0]));
        route.selectNote(id, noteId);
        submit({ intent: "createProject", projectId: id, noteId, name: project.name, color: project.color });
    };

    const deleteProject = (id: string) => {
        const next = projects().filter((project) => project.id !== id);
        const deletingActive = selectedProject() === id;
        setProjects(next);
        if (deletingActive) route.showRoot();
        submit({ intent: "deleteProject", projectId: id });
    };

    const renameProject = (id: string, name: string) => {
        setProjects((current) => current.map((project) => (project.id === id ? { ...project, name } : project)));
    };

    const addNote = () => {
        const project = activeProject();
        if (!project) return;
        const noteId = uid();
        const note: NoteItem = { id: noteId, title: "Untitled", content: "", updatedAt: new Date().toISOString() };
        setProjects((current) =>
            current.map((item) => (item.id === selectedProject() ? { ...item, notes: [note, ...item.notes] } : item)),
        );
        markNoteSaved(serializeNote(note));
        route.selectNote(selectedProject(), noteId);
        submit({ intent: "createNote", projectId: selectedProject(), noteId });
    };

    const deleteNote = (noteId: string) => {
        const next = projects().map((project) =>
            project.id === selectedProject()
                ? { ...project, notes: project.notes.filter((note) => note.id !== noteId) }
                : project,
        );
        const project = next.find((item) => item.id === selectedProject());
        setProjects(next);
        if (selectedNote() === noteId && project) route.pickProject(project.id);
        submit({ intent: "deleteNote", noteId });
    };

    const patchNote = (patch: Partial<NoteItem>) => {
        const projectId = selectedProject();
        const noteId = selectedNote();
        setProjects((current) =>
            current.map((project) =>
                project.id === projectId
                    ? {
                          ...project,
                          notes: project.notes.map((note) =>
                              note.id === noteId ? { ...note, ...patch, updatedAt: new Date().toISOString() } : note,
                          ),
                      }
                    : project,
            ),
        );
    };

    return {
        data,
        // collections + selection
        projects,
        selectedProject,
        selectedNote,
        setSelectedNote: route.pickNote,
        activeProject,
        activeNote,
        orderedActiveNotes,
        preview: () => route.splitMode() === "preview",
        setPreview: (preview: boolean) => route.setSplitMode(preview ? "preview" : "edit"),
        // save status + baseline (consumed by useNotesAutosave)
        isSaving,
        submit,
        hasLoaded,
        notePayload,
        projectPayload,
        getSavedNote,
        markNoteSaved,
        getSavedProject,
        markProjectSaved,
        // mutations
        pickProject,
        addProject,
        deleteProject,
        renameProject,
        addNote,
        deleteNote,
        patchNote,
    };
}

export type NotesStore = ReturnType<typeof useNotesStore>;
