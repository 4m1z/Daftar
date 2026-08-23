import { For, Show } from "solid-js";

import { NoteIcon, SmallPlusIcon, TrashIcon } from "~/components/ui/icons";
import type { NotesWorkspace } from "~/lib/hooks/use-notes-workspace";
import { noteSnippet, relativeTime } from "~/lib/utils/notes";

/** Desktop middle rail: notebook name, note list, and per-note actions. */
export function NotesListSidebar(props: { workspace: NotesWorkspace }) {
    const ws = props.workspace;
    return (
        <div
            class={`w-[320px] shrink-0 flex-col border-r 2xl:w-[340px]
                ${ws.focusMode() ? "hidden" : "flex"}`}
            style={{ background: "var(--db-surface)", "border-color": "var(--db-border)" }}
        >
            <div
                class="flex h-9 shrink-0 items-center justify-between border-b px-2"
                style={{ "border-color": "var(--db-border)" }}
            >
                <Show
                    when={ws.activeProject()}
                    fallback={
                        <span class="text-[12px]" style={{ color: "var(--db-text3)" }}>
                            No notebook
                        </span>
                    }
                >
                    <input
                        value={ws.activeProject()?.name ?? ""}
                        onInput={(event) => ws.renameProject(ws.selectedProject(), event.currentTarget.value)}
                        class="min-w-0 flex-1 truncate bg-transparent text-[12px] font-semibold outline-none"
                        style={{ color: "var(--db-text)", "caret-color": "var(--db-accent)" }}
                        placeholder="Notebook name"
                    />
                </Show>
                <button
                    type="button"
                    onClick={ws.addNote}
                    title="New note"
                    class={`flex h-5 w-5 shrink-0 items-center
                        justify-center rounded transition-colors`}
                    style={{ color: "var(--db-text3)" }}
                >
                    <SmallPlusIcon />
                </button>
            </div>

            <div class="flex min-h-0 flex-1 flex-col overflow-y-auto">
                <Show when={ws.activeProject()?.notes.length === 0}>
                    <div class="flex flex-col items-center justify-center gap-2 py-10 text-center">
                        <NoteIcon />
                        <p class="text-[11px]" style={{ color: "var(--db-text3)" }}>
                            No notes yet
                        </p>
                        <button
                            type="button"
                            onClick={ws.addNote}
                            class={`flex items-center gap-1 rounded px-2 py-1
                                text-[11px] transition-colors`}
                            style={{ background: "var(--db-surface2)", color: "var(--db-text)" }}
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
                                role="button"
                                tabindex={0}
                                onClick={() => ws.setSelectedNote(note.id)}
                                onKeyDown={(event) => {
                                    if (event.key === "Enter" || event.key === " ") {
                                        event.preventDefault();
                                        ws.setSelectedNote(note.id);
                                    }
                                }}
                                class={`group relative w-full border-b px-2.5 py-2
                                    text-left transition-colors
                                    hover:bg-[var(--db-accent-soft)]`}
                                style={{
                                    background: active() ? "var(--db-accent-soft)" : "transparent",
                                    "border-color": "var(--db-border)",
                                }}
                            >
                                <Show when={active()}>
                                    <span
                                        class="absolute inset-y-0 left-0 w-0.5"
                                        style={{ background: "var(--db-accent)" }}
                                    />
                                </Show>
                                <div class="flex items-start justify-between gap-1">
                                    <p
                                        class="truncate text-[12px] font-semibold leading-snug"
                                        style={{ color: active() ? "var(--db-text)" : "var(--db-text2)" }}
                                    >
                                        {note.title || "Untitled"}
                                    </p>
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
                                        class="invisible shrink-0 transition-colors hover:text-red-400 group-hover:visible"
                                        style={{ color: "var(--db-text3)" }}
                                        title="Delete note"
                                    >
                                        <TrashIcon />
                                    </button>
                                </div>
                                <p class="mt-0.5 text-[10px] leading-[1.3]" style={{ color: "var(--db-accent)" }}>
                                    {relativeTime(note.updatedAt)}
                                </p>
                                <p
                                    class="mt-0.5 line-clamp-1 text-[10px] leading-[1.35]"
                                    style={{ color: "var(--db-text3)" }}
                                >
                                    {noteSnippet(note.content)}
                                </p>
                            </div>
                        );
                    }}
                </For>
            </div>
        </div>
    );
}
