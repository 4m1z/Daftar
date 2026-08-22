import { For, Show } from "solid-js";

import { EditIcon, EyeIcon, SmallPlusIcon, SplitViewIcon } from "~/components/icons";
import { NoteEditorPanel, NotePreviewPanel } from "~/components/notes/note-content-panels";
import { EditorModeToggle } from "~/components/notes/editor-mode-toggle";
import { relativeTime } from "~/lib/notes/helpers";
import type { NotesWorkspace } from "~/lib/notes/use-notes-workspace";

/** Compact single-column layout with horizontal tab strips shown below the xl breakpoint. */
export function MobileNotesLayout(props: { workspace: NotesWorkspace }) {
    const ws = props.workspace;
    return (
        <div class="flex w-full flex-col overflow-hidden xl:hidden">
            <div
                class="flex shrink-0 items-center gap-1.5 overflow-x-auto border-b px-3 py-2"
                style={{ background: "var(--db-bg)", "border-color": "var(--db-border)" }}
            >
                <For each={ws.projects()}>
                    {(project) => (
                        <button
                            type="button"
                            onClick={() => ws.pickProject(project.id)}
                            title={project.name}
                            class="flex shrink-0 items-center gap-1.5 rounded px-2.5 py-1 text-[12px] transition-colors"
                            style={{
                                background: project.id === ws.selectedProject() ? "var(--db-surface2)" : "transparent",
                                color: project.id === ws.selectedProject() ? "var(--db-text)" : "var(--db-text3)",
                            }}
                        >
                            <span class="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: project.color }} />
                            {project.name}
                        </button>
                    )}
                </For>
                <button
                    type="button"
                    onClick={ws.addProject}
                    class="flex shrink-0 items-center gap-1 rounded px-2.5 py-1 text-[12px]"
                    style={{ color: "var(--db-text3)" }}
                >
                    <SmallPlusIcon /> New
                </button>
            </div>

            <div
                class="flex shrink-0 overflow-x-auto border-b"
                style={{ background: "var(--db-surface)", "border-color": "var(--db-border)" }}
            >
                <For each={ws.orderedActiveNotes()}>
                    {(note) => (
                        <button
                            type="button"
                            onClick={() => ws.setSelectedNote(note.id)}
                            class="shrink-0 border-r px-4 py-2.5 text-left transition-colors"
                            style={{
                                background: note.id === ws.selectedNote() ? "var(--db-surface2)" : "transparent",
                                "border-color": "var(--db-border)",
                            }}
                        >
                            <p class="text-[12px] font-semibold" style={{ color: "var(--db-text)" }}>
                                {note.title || "Untitled"}
                            </p>
                            <p class="mt-0.5 text-[10px]" style={{ color: "var(--db-accent)" }}>
                                {relativeTime(note.updatedAt)}
                            </p>
                        </button>
                    )}
                </For>
                <button
                    type="button"
                    onClick={ws.addNote}
                    class="flex shrink-0 items-center gap-1 px-4 py-2.5 text-[12px]"
                    style={{ color: "var(--db-text3)" }}
                >
                    <SmallPlusIcon /> Note
                </button>
            </div>

            <Show when={ws.activeNote()}>
                <div class="flex min-h-0 flex-1 flex-col overflow-hidden">
                    <div
                        class="flex h-10 shrink-0 items-center justify-between border-b px-3"
                        style={{ "border-color": "var(--db-border)" }}
                    >
                        <input
                            value={ws.activeNote()?.title ?? ""}
                            onInput={(event) => ws.patchNote({ title: event.currentTarget.value })}
                            class="min-w-0 flex-1 bg-transparent text-[13px] font-semibold outline-none"
                            style={{ color: "var(--db-text)" }}
                        />
                        <div class="flex items-center gap-1">
                            <EditorModeToggle enabled={ws.vimMode()} onChange={ws.setVimMode} />
                            <button
                                type="button"
                                onClick={() => ws.setSplitMode("edit")}
                                class="flex h-6 w-6 items-center justify-center rounded"
                                style={{
                                    background: ws.splitMode() === "edit" ? "var(--db-surface)" : "transparent",
                                    color: ws.splitMode() === "edit" ? "var(--db-text)" : "var(--db-text3)",
                                }}
                            >
                                <EditIcon />
                            </button>
                            <button
                                type="button"
                                onClick={() => ws.setSplitMode("split")}
                                title="Edit and preview"
                                class="flex h-6 w-6 items-center justify-center rounded"
                                style={{
                                    background: ws.splitMode() === "split" ? "var(--db-surface)" : "transparent",
                                    color: ws.splitMode() === "split" ? "var(--db-text)" : "var(--db-text3)",
                                }}
                            >
                                <SplitViewIcon />
                            </button>
                            <button
                                type="button"
                                onClick={() => ws.setSplitMode("preview")}
                                class="flex h-6 w-6 items-center justify-center rounded"
                                style={{
                                    background: ws.splitMode() === "preview" ? "var(--db-surface)" : "transparent",
                                    color: ws.splitMode() === "preview" ? "var(--db-text)" : "var(--db-text3)",
                                }}
                            >
                                <EyeIcon />
                            </button>
                        </div>
                    </div>
                    <div class="min-h-0 flex-1 overflow-hidden">
                        <Show when={ws.splitMode() === "edit"}>
                            <div class="notes-editor h-full">
                                <NoteEditorPanel
                                    note={ws.activeNote}
                                    onChange={(value) => ws.patchNote({ content: value })}
                                    theme={ws.theme}
                                    vimMode={ws.vimMode}
                                />
                            </div>
                        </Show>
                        <Show when={ws.splitMode() === "preview"}>
                            <div class="h-full w-full overflow-auto">
                                <NotePreviewPanel
                                    note={ws.activeNote}
                                    onChange={(content) => ws.patchNote({ content })}
                                    mobile
                                />
                            </div>
                        </Show>
                        <Show when={ws.splitMode() === "split"}>
                            <div class="flex h-full min-h-0 flex-col">
                                <div
                                    class="notes-editor min-h-0 flex-1 border-b"
                                    style={{ "border-color": "var(--db-border)" }}
                                >
                                    <NoteEditorPanel
                                        note={ws.activeNote}
                                        onChange={(value) => ws.patchNote({ content: value })}
                                        theme={ws.theme}
                                        vimMode={ws.vimMode}
                                    />
                                </div>
                                <div class="min-h-0 flex-1 overflow-auto">
                                    <NotePreviewPanel
                                        note={ws.activeNote}
                                        onChange={(content) => ws.patchNote({ content })}
                                        mobile
                                    />
                                </div>
                            </div>
                        </Show>
                    </div>
                </div>
            </Show>
        </div>
    );
}
