import { For, Show } from "solid-js";

import { DashboardThemeToggle } from "~/components/ui/dashboard-theme";
import { FolderIcon, SmallPlusIcon, TrashIcon } from "~/components/ui/icons";
import type { NotesWorkspace } from "~/lib/hooks/use-notes-workspace";

/** Desktop left rail: notebook list, theme toggle, and save status. */
export function NotebookSidebar(props: { workspace: NotesWorkspace }) {
    const ws = props.workspace;
    return (
        <div
            class={`hidden w-[200px] shrink-0 flex-col border-r 2xl:w-[220px] ${ws.focusMode() ? "" : "xl:flex"}`}
            style={{ background: "var(--db-bg)", "border-color": "var(--db-border)" }}
        >
            <div
                class="flex h-auto shrink-0 flex-col gap-1.5 border-b px-2 py-1.5"
                style={{ "border-color": "var(--db-border)" }}
            >
                <div class="flex items-center justify-between">
                    <span class="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--db-text2)" }}>
                        Notebooks
                    </span>
                    <button
                        type="button"
                        onClick={ws.addProject}
                        title="New notebook"
                        class="flex h-5 w-5 items-center justify-center rounded transition-colors"
                        style={{ color: "var(--db-text3)" }}
                    >
                        <SmallPlusIcon />
                    </button>
                </div>
                <DashboardThemeToggle theme={ws.theme()} onChange={ws.setTheme} />
            </div>

            <div class="flex min-h-0 flex-1 flex-col overflow-y-auto py-0.5">
                <For each={ws.projects()}>
                    {(project) => {
                        const active = () => project.id === ws.selectedProject();
                        return (
                            <div
                                class="group relative flex items-center gap-1.5 px-2 py-[5px] transition-colors"
                                style={{ background: active() ? "var(--db-accent-soft)" : "transparent" }}
                            >
                                <Show when={active()}>
                                    <span
                                        class="absolute inset-y-1 left-0 w-0.5"
                                        style={{ background: "var(--db-accent)" }}
                                    />
                                </Show>
                                <button
                                    type="button"
                                    onClick={() => ws.pickProject(project.id)}
                                    title={project.name}
                                    class="flex min-w-0 flex-1 items-center gap-1.5 text-left"
                                >
                                    <FolderIcon />
                                    <span
                                        class="min-w-0 flex-1 truncate text-[12px]"
                                        style={{ color: active() ? "var(--db-text)" : "var(--db-text2)" }}
                                    >
                                        {project.name}
                                    </span>
                                    <span
                                        class="ml-auto shrink-0 text-[10px] tabular-nums"
                                        style={{ color: "var(--db-text3)" }}
                                    >
                                        {project.notes.length}
                                    </span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() =>
                                        ws.setPendingDelete({ kind: "project", id: project.id, name: project.name })
                                    }
                                    class="invisible flex h-4 w-4 shrink-0 items-center justify-center rounded transition-colors hover:text-red-400 group-hover:visible"
                                    style={{ color: "var(--db-text3)" }}
                                    title="Delete notebook"
                                >
                                    <TrashIcon />
                                </button>
                            </div>
                        );
                    }}
                </For>
            </div>

            <div class="shrink-0 border-t px-2 py-1.5" style={{ "border-color": "var(--db-border)" }}>
                <p class="text-[9px]" style={{ color: "var(--db-text3)" }}>
                    {ws.isSaving() ? "Saving…" : "Saved"}
                </p>
            </div>
        </div>
    );
}
