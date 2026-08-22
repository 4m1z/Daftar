import { createSignal } from "solid-js";
import { afterEach, describe, expect, it, vi } from "vitest";

import { NOTE_SAVE_DELAY, PROJECT_SAVE_DELAY } from "~/lib/constants/notes";
import { flushEffects, renderReactive } from "~/lib/test-utils";
import type { NoteItem, Project } from "~/lib/types/notes";
import { serializeNote, serializeProject } from "~/lib/utils/notes";
import { useNotesAutosave } from "./use-notes-autosave";
import type { NotesStore } from "./use-notes-store";

let cleanup: (() => void) | undefined;

afterEach(() => {
    cleanup?.();
    cleanup = undefined;
    vi.useRealTimers();
});

const flush = flushEffects;

function baseNote(overrides: Partial<NoteItem> = {}): NoteItem {
    return { id: "n1", title: "Title", content: "Body", updatedAt: "2024-01-01T00:00:00.000Z", ...overrides };
}

function setup(initial?: { note?: NoteItem | null; project?: Project | null }) {
    const submit = vi.fn();
    const initialNote = initial?.note === undefined ? baseNote() : initial.note;
    const initialProject = initial?.project ?? null;

    const [activeNote, setActiveNote] = createSignal<NoteItem | null>(initialNote);
    const [activeProject, setActiveProject] = createSignal<Project | null>(initialProject);
    const [isSaving, setIsSaving] = createSignal(false);

    let savedNote = serializeNote(initialNote);
    let savedProject = serializeProject(initialProject);

    const store = {
        activeNote,
        activeProject,
        isSaving,
        hasLoaded: () => true,
        notePayload: () => serializeNote(activeNote()),
        projectPayload: () => serializeProject(activeProject()),
        getSavedNote: () => savedNote,
        markNoteSaved: (value: string) => (savedNote = value),
        getSavedProject: () => savedProject,
        markProjectSaved: (value: string) => (savedProject = value),
        submit,
    } as unknown as NotesStore;

    const { dispose } = renderReactive(() => useNotesAutosave(store));
    cleanup = dispose;

    return { submit, setActiveNote, setActiveProject, setIsSaving, getSavedNote: () => savedNote };
}

describe("useNotesAutosave", () => {
    it("saves an edited note after the debounce elapses", async () => {
        vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
        const { submit, setActiveNote, getSavedNote } = setup();
        await flush();

        setActiveNote(baseNote({ title: "Updated", content: "New body" }));
        await flush();

        // Nothing fires until the debounce window passes.
        expect(submit).not.toHaveBeenCalled();
        vi.advanceTimersByTime(NOTE_SAVE_DELAY);

        expect(submit).toHaveBeenCalledTimes(1);
        expect(submit).toHaveBeenCalledWith({
            intent: "updateNote",
            noteId: "n1",
            title: "Updated",
            content: "New body",
        });
        expect(getSavedNote()).toBe(serializeNote(baseNote({ title: "Updated", content: "New body" })));
    });

    it("does not save when the payload matches the baseline", async () => {
        vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
        const { submit, setActiveNote } = setup();
        await flush();

        // Re-set an identical note (only updatedAt differs, which is ignored).
        setActiveNote(baseNote({ updatedAt: "2030-01-01T00:00:00.000Z" }));
        await flush();
        vi.advanceTimersByTime(NOTE_SAVE_DELAY);

        expect(submit).not.toHaveBeenCalled();
    });

    it("skips autosave while a save is already in flight", async () => {
        vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
        const { submit, setActiveNote, setIsSaving } = setup();
        setIsSaving(true);
        await flush();

        setActiveNote(baseNote({ content: "changed" }));
        await flush();
        vi.advanceTimersByTime(NOTE_SAVE_DELAY);

        expect(submit).not.toHaveBeenCalled();
    });

    it("debounces rapid edits into a single save", async () => {
        vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
        const { submit, setActiveNote } = setup();
        await flush();

        setActiveNote(baseNote({ content: "one" }));
        await flush();
        vi.advanceTimersByTime(NOTE_SAVE_DELAY - 100);

        setActiveNote(baseNote({ content: "two" }));
        await flush();
        vi.advanceTimersByTime(NOTE_SAVE_DELAY);

        expect(submit).toHaveBeenCalledTimes(1);
        expect(submit).toHaveBeenCalledWith({
            intent: "updateNote",
            noteId: "n1",
            title: "Title",
            content: "two",
        });
    });

    it("saves a renamed notebook after its debounce", async () => {
        vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
        const project: Project = { id: "p1", name: "Old", color: "#000", notes: [] };
        const { submit, setActiveProject } = setup({ note: null, project });
        await flush();

        setActiveProject({ ...project, name: "New name" });
        await flush();
        vi.advanceTimersByTime(PROJECT_SAVE_DELAY);

        expect(submit).toHaveBeenCalledWith({
            intent: "renameProject",
            projectId: "p1",
            name: "New name",
        });
    });
});
