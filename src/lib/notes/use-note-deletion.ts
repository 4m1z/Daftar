import { createEffect, createSignal } from "solid-js";

import type { PendingDelete } from "./types";

type DeletionDeps = {
    deleteProject: (id: string) => void;
    deleteNote: (id: string) => void;
};

/**
 * Manages the delete-confirmation dialog: the pending target, keyboard shortcuts
 * (Enter to confirm, Esc to cancel), and dispatching the confirmed deletion to
 * the store.
 */
export function useNoteDeletion(deps: DeletionDeps) {
    const [pendingDelete, setPendingDelete] = createSignal<PendingDelete | null>(null);

    const confirmPendingDelete = () => {
        const pending = pendingDelete();
        if (!pending) return;
        if (pending.kind === "project") deps.deleteProject(pending.id);
        else deps.deleteNote(pending.id);
        setPendingDelete(null);
    };

    createEffect(
        () => pendingDelete(),
        (pending) => {
            if (!pending) return;
            const handleKeyDown = (event: KeyboardEvent) => {
                if (event.key === "Escape") {
                    event.preventDefault();
                    setPendingDelete(null);
                } else if (event.key === "Enter") {
                    event.preventDefault();
                    confirmPendingDelete();
                }
            };
            window.addEventListener("keydown", handleKeyDown);
            return () => window.removeEventListener("keydown", handleKeyDown);
        },
    );

    return { pendingDelete, setPendingDelete, confirmPendingDelete };
}

export type NoteDeletion = ReturnType<typeof useNoteDeletion>;
