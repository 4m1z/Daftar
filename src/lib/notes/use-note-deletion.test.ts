import { afterEach, describe, expect, it, vi } from "vitest";

import { flushEffects, renderReactive } from "./test-support";
import { useNoteDeletion } from "./use-note-deletion";

let cleanup: (() => void) | undefined;

afterEach(() => {
    cleanup?.();
    cleanup = undefined;
});

function setup() {
    const deleteProject = vi.fn();
    const deleteNote = vi.fn();
    const { result, dispose } = renderReactive(() => useNoteDeletion({ deleteProject, deleteNote }));
    cleanup = dispose;
    return { deletion: result, deleteProject, deleteNote };
}

describe("useNoteDeletion", () => {
    it("starts with nothing pending", () => {
        const { deletion } = setup();
        expect(deletion.pendingDelete()).toBeNull();
    });

    it("confirming a project deletion dispatches to deleteProject and clears state", async () => {
        const { deletion, deleteProject, deleteNote } = setup();
        deletion.setPendingDelete({ kind: "project", id: "p1", name: "Book" });
        await flushEffects();

        deletion.confirmPendingDelete();
        await flushEffects();

        expect(deleteProject).toHaveBeenCalledWith("p1");
        expect(deleteNote).not.toHaveBeenCalled();
        expect(deletion.pendingDelete()).toBeNull();
    });

    it("confirming a note deletion dispatches to deleteNote", async () => {
        const { deletion, deleteProject, deleteNote } = setup();
        deletion.setPendingDelete({ kind: "note", id: "n1", title: "Note" });
        await flushEffects();

        deletion.confirmPendingDelete();
        await flushEffects();

        expect(deleteNote).toHaveBeenCalledWith("n1");
        expect(deleteProject).not.toHaveBeenCalled();
        expect(deletion.pendingDelete()).toBeNull();
    });

    it("does nothing when confirming with no pending target", () => {
        const { deletion, deleteProject, deleteNote } = setup();
        deletion.confirmPendingDelete();
        expect(deleteProject).not.toHaveBeenCalled();
        expect(deleteNote).not.toHaveBeenCalled();
    });

    it("Escape cancels the pending deletion", async () => {
        const { deletion, deleteNote } = setup();
        deletion.setPendingDelete({ kind: "note", id: "n1", title: "Note" });
        await flushEffects();

        window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
        await flushEffects();

        expect(deletion.pendingDelete()).toBeNull();
        expect(deleteNote).not.toHaveBeenCalled();
    });

    it("Enter confirms the pending deletion", async () => {
        const { deletion, deleteProject } = setup();
        deletion.setPendingDelete({ kind: "project", id: "p9", name: "Book" });
        await flushEffects();

        window.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
        await flushEffects();

        expect(deleteProject).toHaveBeenCalledWith("p9");
        expect(deletion.pendingDelete()).toBeNull();
    });

    it("stops listening once the dialog closes", async () => {
        const { deletion, deleteProject } = setup();
        deletion.setPendingDelete({ kind: "project", id: "p1", name: "Book" });
        await flushEffects();

        deletion.setPendingDelete(null);
        await flushEffects();

        window.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
        expect(deleteProject).not.toHaveBeenCalled();
    });
});
