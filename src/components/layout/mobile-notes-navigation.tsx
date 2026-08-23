import { For } from "solid-js";

import { SmallPlusIcon } from "~/components/ui/icons";
import type { NotesWorkspace } from "~/lib/hooks/use-notes-workspace";
import { notebookColor, relativeTime } from "~/lib/utils/notes";

/** Compact navigation rendered only for requests classified as mobile. */
export function MobileNotesNavigation(props: { workspace: NotesWorkspace }) {
    const ws = props.workspace;
    return (
        <div class="flex w-full shrink-0 flex-col overflow-hidden">
            <div
                class={`flex shrink-0 items-center gap-1.5 overflow-x-auto
                    border-b px-3 py-2`}
                style={{ background: "var(--db-bg)", "border-color": "var(--db-border)" }}
            >
                <For each={ws.projects()}>
                    {(project) => (
                        <button
                            type="button"
                            onClick={() => ws.pickProject(project.id)}
                            title={project.name}
                            class={`flex shrink-0 items-center gap-1.5 rounded
                                px-2.5 py-1 text-[12px] transition-colors`}
                            style={{
                                background: project.id === ws.selectedProject() ? "var(--db-surface2)" : "transparent",
                                color: project.id === ws.selectedProject() ? "var(--db-text)" : "var(--db-text3)",
                            }}
                        >
                            <span
                                class="h-1.5 w-1.5 shrink-0 rounded-full"
                                style={{ background: notebookColor(project.color) }}
                            />
                            {project.name}
                        </button>
                    )}
                </For>
                <button
                    type="button"
                    onClick={ws.addProject}
                    class={`flex shrink-0 items-center gap-1 rounded
                        px-2.5 py-1 text-[12px]`}
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
        </div>
    );
}
