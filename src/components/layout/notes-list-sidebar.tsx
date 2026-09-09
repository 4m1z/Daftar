import { For, Show } from "solid-js";

import { NoteIcon, SmallPlusIcon, TrashIcon } from "~/components/ui/icons";
import type { NotesWorkspace } from "~/lib/hooks/use-notes-workspace";
import { noteSnippet, relativeTime } from "~/lib/utils/notes";

/** Middle rail: notebook name, note list, and per-note actions. */
export function NotesListSidebar(props: { workspace: NotesWorkspace }) {
    const ws = props.workspace;

    const handleBack = (event: MouseEvent) => {
        const viaKeyboard = event.detail === 0;
        const projectId = ws.selectedProject();
        ws.showRoot();
        if (!viaKeyboard || !projectId) return;
        window.setTimeout(() => {
            if (ws.selectedProject()) return;
            document.querySelector<HTMLElement>(`[data-notebook-row="${projectId}"] button`)?.focus();
        }, 0);
    };

    const handlePickNote = (event: MouseEvent, noteId: string) => {
        const viaKeyboard = event.detail === 0;
        ws.setSelectedNote(noteId);
        if (!viaKeyboard) return;
        window.setTimeout(() => {
            if (ws.selectedNote() !== noteId) return;
            // Focus the editor title once the note pane is current; the
            // editable CodeMirror surface stays pointer-activated on desktop
            // so browsing the list never yanks focus away from the keyboard.
            document.querySelector<HTMLElement>("[data-editor-title]")?.focus();
        }, 0);
    };

    return (
        <div class="flex h-full w-full flex-col" style={{ background: "var(--db-surface)" }}>
            <Show when={ws.selectedProject()} keyed>
                {(projectId) => (
                    <div class="notes-list-enter flex h-full min-h-0 w-full flex-col" data-project={projectId}>
                        <div
                            class="flex min-h-12 shrink-0 items-center gap-1 border-b px-2"
                            style={{ "border-color": "var(--db-border)" }}
                        >
                            <button
                                type="button"
                                onClick={handleBack}
                                title="Back to notebooks"
                                aria-label="Back to notebooks"
                                class="notes-compact-only notes-action flex h-8 w-8 shrink-0 items-center justify-center rounded transition-colors hover:bg-[var(--db-surface2)] focus-visible:outline-2 focus-visible:outline-offset-1"
                                style={{ color: "var(--db-text3)", "outline-color": "var(--db-accent)" }}
                            >
                                <svg
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                    class="h-4 w-4"
                                    aria-hidden="true"
                                >
                                    <path
                                        fill-rule="evenodd"
                                        d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                                        clip-rule="evenodd"
                                    />
                                </svg>
                            </button>
                            <Show
                                when={ws.activeProject()}
                                fallback={
                                    <span
                                        class="text-[12px]"
                                        style={{ color: "var(--db-text3)" }}
                                        data-notes-heading
                                        tabindex={-1}
                                    >
                                        No notebook
                                    </span>
                                }
                            >
                                <input
                                    value={ws.activeProject()?.name ?? ""}
                                    onInput={(event) =>
                                        ws.renameProject(ws.selectedProject(), event.currentTarget.value)
                                    }
                                    class="min-w-0 flex-1 truncate bg-transparent text-[13px] font-semibold outline-none"
                                    style={{ color: "var(--db-text)", "caret-color": "var(--db-accent)" }}
                                    placeholder="Notebook name"
                                    aria-label="Notebook name"
                                    data-notes-heading
                                />
                                <Show when={ws.activeProject()?.isArchived}>
                                    <span
                                        class="ml-1 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em]"
                                        style={{ background: "var(--db-accent-soft)", color: "var(--db-accent)" }}
                                    >
                                        Archived
                                    </span>
                                </Show>
                            </Show>
                            <button
                                type="button"
                                onClick={ws.addNote}
                                title="New note"
                                aria-label="New note"
                                data-new-note
                                class="notes-action flex h-8 w-8 shrink-0 items-center justify-center rounded transition-colors hover:bg-[var(--db-surface2)] focus-visible:outline-2 focus-visible:outline-offset-1"
                                style={{ color: "var(--db-text3)", "outline-color": "var(--db-accent)" }}
                            >
                                <SmallPlusIcon />
                            </button>
                        </div>

                        <div class="flex min-h-0 flex-1 flex-col overflow-y-auto" data-notes-list>
                            <Show when={ws.activeProject()?.notes.length === 0}>
                                <div class="flex flex-col items-center justify-center gap-2 py-10 text-center">
                                    <NoteIcon />
                                    <p class="text-[12px]" style={{ color: "var(--db-text3)" }}>
                                        No notes yet
                                    </p>
                                    <button
                                        type="button"
                                        onClick={ws.addNote}
                                        data-new-note
                                        class="flex min-h-8 items-center gap-1 rounded px-3 py-1 text-[12px] transition-colors hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2"
                                        style={{
                                            background: "var(--db-surface2)",
                                            color: "var(--db-text)",
                                            "outline-color": "var(--db-accent)",
                                        }}
                                    >
                                        <SmallPlusIcon />
                                        New note
                                    </button>
                                </div>
                            </Show>
                            <For each={ws.orderedActiveNotes()}>
                                {(note) => {
                                    const active = () => note.id === ws.selectedNote();
                                    return (
                                        <div
                                            data-note-row={note.id}
                                            class="group relative flex w-full items-stretch gap-1 border-b px-2 py-1.5 transition-colors"
                                            style={{
                                                background: active() ? "var(--db-accent-soft)" : "transparent",
                                                "border-color": "var(--db-border)",
                                            }}
                                        >
                                            <Show when={active()}>
                                                <span
                                                    class="absolute inset-y-0 left-0 w-0.5"
                                                    style={{ background: "var(--db-accent)" }}
                                                    aria-hidden="true"
                                                />
                                            </Show>
                                            <button
                                                type="button"
                                                onClick={(event) => handlePickNote(event, note.id)}
                                                aria-current={active() ? "true" : undefined}
                                                aria-label={`Open note: ${note.title || "Untitled"}`}
                                                class="flex min-w-0 flex-1 flex-col rounded px-1.5 py-1 text-left focus-visible:outline-2 focus-visible:outline-offset-1"
                                            >
                                                <span
                                                    class="w-full truncate text-[13px] font-semibold leading-snug"
                                                    style={{ color: active() ? "var(--db-text)" : "var(--db-text2)" }}
                                                >
                                                    {note.title || "Untitled"}
                                                </span>
                                                <span
                                                    class="mt-0.5 text-[11px] leading-[1.3]"
                                                    style={{ color: "var(--db-accent)" }}
                                                >
                                                    {relativeTime(note.updatedAt)}
                                                </span>
                                                <span
                                                    class="mt-0.5 line-clamp-1 w-full text-[12px] leading-[1.35]"
                                                    style={{ color: "var(--db-text3)" }}
                                                >
                                                    {noteSnippet(note.content)}
                                                </span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    ws.setPendingDelete({
                                                        kind: "note",
                                                        id: note.id,
                                                        title: note.title || "Untitled",
                                                    });
                                                }}
                                                class="invisible my-auto flex h-8 w-8 shrink-0 items-center justify-center rounded transition-colors hover:text-red-400 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:visible group-focus-within:visible group-hover:visible"
                                                style={{ color: "var(--db-text3)", "outline-color": "var(--db-accent)" }}
                                                title="Delete note"
                                                aria-label={`Delete note: ${note.title || "Untitled"}`}
                                            >
                                                <TrashIcon />
                                            </button>
                                        </div>
                                    );
                                }}
                            </For>
                        </div>
                    </div>
                )}
            </Show>
        </div>
    );
}
