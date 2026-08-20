import { Show, type Accessor } from "solid-js";

import { pendingDeleteName, pendingDeleteTitle } from "~/lib/notes/helpers";
import type { PendingDelete } from "~/lib/notes/types";

/** Modal confirming deletion of a notebook or a note. */
export function DeleteConfirmDialog(props: {
    pending: Accessor<PendingDelete | null>;
    onCancel: () => void;
    onConfirm: () => void;
}) {
    return (
        <Show when={props.pending()}>
            {(pending) => (
                <div
                    class="fixed inset-0 z-50 flex items-center justify-center px-4"
                    style={{ background: "rgba(0, 0, 0, 0.5)" }}
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) props.onCancel();
                    }}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="delete-confirm-title"
                >
                    <div
                        class="flex w-full max-w-[420px] flex-col gap-3 rounded-lg border p-5 shadow-2xl"
                        style={{ background: "var(--db-surface)", "border-color": "var(--db-border)" }}
                    >
                        <h2
                            id="delete-confirm-title"
                            class="text-[14px] font-semibold"
                            style={{ color: "var(--db-text)" }}
                        >
                            {pending().kind === "project" ? "Delete notebook?" : "Delete note?"}
                        </h2>
                        <p class="text-[12px] leading-relaxed" style={{ color: "var(--db-text2)" }}>
                            <Show
                                when={pending().kind === "project"}
                                fallback={
                                    <>
                                        You are about to delete the note{" "}
                                        <span class="font-semibold" style={{ color: "var(--db-text)" }}>
                                            &quot;{pendingDeleteTitle(pending())}&quot;
                                        </span>
                                        . This action cannot be undone.
                                    </>
                                }
                            >
                                You are about to delete the notebook{" "}
                                <span class="font-semibold" style={{ color: "var(--db-text)" }}>
                                    &quot;{pendingDeleteName(pending())}&quot;
                                </span>{" "}
                                and all of its notes. This action cannot be undone.
                            </Show>
                        </p>
                        <div class="mt-1 flex items-center justify-end gap-2">
                            <button
                                type="button"
                                onClick={props.onCancel}
                                class="rounded px-3 py-1.5 text-[12px] font-semibold transition-colors"
                                style={{ background: "var(--db-surface2)", color: "var(--db-text2)" }}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={props.onConfirm}
                                ref={(element) => element.focus()}
                                class="rounded px-3 py-1.5 text-[12px] font-semibold text-white transition-colors"
                                style={{ background: "#dc2626" }}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Show>
    );
}
