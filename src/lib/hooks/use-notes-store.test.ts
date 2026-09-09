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
            isArchived: false,
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

describe("useNotesStore archiving", () => {
    it("creates notebooks as active", async () => {
        const { store, dispose } = setup();
        await flushEffects();

        store.addProject();
        await flushEffects();

        const created = store.projects().find((project) => project.id !== "p1");
        expect(created?.isArchived).toBe(false);
        dispose();
    });

    it("archives a notebook and preserves its notes", async () => {
        const { store, dispose } = setup();
        await flushEffects();

        const archived = await store.setProjectArchived("p1", true);

        expect(archived).toBe(true);
        expect(mocks.runAction).toHaveBeenCalledOnce();
        const form = mocks.runAction.mock.calls[0][0] as FormData;
        expect(form.get("intent")).toBe("archiveProject");
        expect(form.get("projectId")).toBe("p1");
        expect(store.projects()[0].isArchived).toBe(true);
        expect(store.projects()[0].notes).toHaveLength(1);
        expect(store.projects()[0].notes[0].id).toBe("n1");
        expect(store.archiveError()).toBeNull();
        dispose();
    });

    it("restores an archived notebook", async () => {
        const { store, dispose } = setup();
        await flushEffects();

        expect(await store.setProjectArchived("p1", true)).toBe(true);
        expect(await store.setProjectArchived("p1", false)).toBe(true);

        expect(mocks.runAction).toHaveBeenCalledTimes(2);
        expect((mocks.runAction.mock.calls[1][0] as FormData).get("intent")).toBe("restoreProject");
        expect(store.projects()[0].isArchived).toBe(false);
        dispose();
    });

    it("does nothing when already in the requested state", async () => {
        const { store, dispose } = setup();
        await flushEffects();

        expect(await store.setProjectArchived("p1", false)).toBe(false);
        expect(mocks.runAction).not.toHaveBeenCalled();
        dispose();
    });

    it("does nothing for unknown notebooks", async () => {
        const { store, dispose } = setup();
        await flushEffects();

        expect(await store.setProjectArchived("missing", true)).toBe(false);
        expect(mocks.runAction).not.toHaveBeenCalled();
        dispose();
    });

    it("surfaces an error and keeps local state on failure", async () => {
        const { store, dispose } = setup();
        await flushEffects();
        mocks.runAction.mockRejectedValueOnce(new Error("offline"));

        const archived = await store.setProjectArchived("p1", true);

        expect(archived).toBe(false);
        expect(store.projects()[0].isArchived).toBe(false);
        expect(store.archiveError()).toMatch(/archive/i);
        expect(store.isProjectBusy("p1")).toBe(false);
        dispose();
    });

    it("ignores duplicate archive requests while one is pending", async () => {
        const { store, dispose } = setup();
        await flushEffects();
        let resolveAction!: (value: unknown) => void;
        mocks.runAction.mockImplementationOnce(() => new Promise((resolve) => (resolveAction = resolve)));

        const first = store.setProjectArchived("p1", true);
        await flushEffects();
        expect(store.isProjectBusy("p1")).toBe(true);
        expect(await store.setProjectArchived("p1", true)).toBe(false);

        resolveAction({ ok: true });
        await expect(first).resolves.toBe(true);
        await flushEffects();
        expect(mocks.runAction).toHaveBeenCalledTimes(1);
        expect(store.projects()[0].isArchived).toBe(true);
        expect(store.isProjectBusy("p1")).toBe(false);
        dispose();
    });

    it("refuses to archive a notebook that is still being created", async () => {
        const { store, dispose } = setup();
        await flushEffects();
        let resolveCreate!: (value: unknown) => void;
        mocks.runAction.mockImplementationOnce(() => new Promise((resolve) => (resolveCreate = resolve)));

        store.addProject();
        await flushEffects();
        const created = store.projects().find((project) => project.id !== "p1");
        expect(created).toBeDefined();
        expect(store.isProjectBusy(created!.id)).toBe(true);
        expect(await store.setProjectArchived(created!.id, true)).toBe(false);

        resolveCreate({ ok: true });
        await flushEffects();
        expect(store.projects().find((project) => project.id === created!.id)?.isArchived).toBe(false);
        dispose();
    });
});
