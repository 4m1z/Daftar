import { createSignal } from "solid-js";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { flushEffects, renderReactive } from "~/lib/test-utils";
import type { NotesRoute } from "./use-notes-route";

const mocks = vi.hoisted(() => ({
    runAction: vi.fn().mockResolvedValue({ ok: true }),
    data: {
        projects: [{
            id: "p1",
            name: "Notebook",
            color: "1",
            notes: [{ id: "n1", title: "Selected note", content: "Body", updatedAt: "2026-08-23T00:00:00.000Z" }],
        }],
        selectedProjectId: "p1",
        selectedNoteId: "n1",
        updatedAt: null,
    },
}));

vi.mock("@solidjs/router", () => ({
    useAction: () => mocks.runAction,
}));

vi.mock("~/lib/actions/notes", () => ({
    getNotesData: () => mocks.data,
    notesAction: vi.fn(),
}));

import { useNotesStore } from "./use-notes-store";

function setup() {
    const [selectedProject] = createSignal("p1");
    const [selectedNote] = createSignal("n1");
    const route = {
        selectedProject,
        selectedNote,
        splitMode: () => "edit",
        pickProject: vi.fn(),
        pickNote: vi.fn(),
        selectNote: vi.fn(),
        showRoot: vi.fn(),
        setSplitMode: vi.fn(),
    } as unknown as NotesRoute;
    const { result, dispose } = renderReactive(() => useNotesStore(route));
    return { store: result, route, dispose };
}

beforeEach(() => {
    mocks.runAction.mockClear();
});

describe("useNotesStore creation", () => {
    it("creates a notebook without changing the current selection", async () => {
        const { store, route, dispose } = setup();
        await flushEffects();

        store.addProject();
        await flushEffects();

        expect(store.projects()).toHaveLength(2);
        expect(route.selectNote).not.toHaveBeenCalled();
        expect(store.selectedProject()).toBe("p1");
        expect(store.selectedNote()).toBe("n1");
        expect(mocks.runAction).toHaveBeenCalledOnce();
        expect((mocks.runAction.mock.calls[0][0] as FormData).get("intent")).toBe("createProject");
        dispose();
    });

    it("creates a note without changing the current selection", async () => {
        const { store, route, dispose } = setup();
        await flushEffects();

        store.addNote();
        await flushEffects();

        expect(store.activeProject()?.notes).toHaveLength(2);
        expect(route.selectNote).not.toHaveBeenCalled();
        expect(store.selectedNote()).toBe("n1");
        expect(mocks.runAction).toHaveBeenCalledOnce();
        expect((mocks.runAction.mock.calls[0][0] as FormData).get("intent")).toBe("createNote");
        dispose();
    });
});
