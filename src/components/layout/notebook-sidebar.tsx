import { For, Show } from "solid-js";

import { ThemeToggle } from "~/components/ui/theme";
import { ArchiveIcon, FolderIcon, RestoreIcon, SmallPlusIcon, TrashIcon } from "~/components/ui/icons";
import type { NotesWorkspace } from "~/lib/hooks/use-notes-workspace";
import { NotebookFilterTabs } from "./notebook-filter-tabs";

/** Left rail: notebook list, archive filter, theme toggle, and save status. */
export function NotebookSidebar(props: { workspace: NotesWorkspace }) {
    const ws = props.workspace;

    // When archiving/restoring removes the focused row, move focus to the
    // filter tabs so keyboard users are not left without a focus target.
    const handleArchiveToggle = (event: Event, projectId: string, archived: boolean) => {
        const button = event.currentTarget as HTMLElement;
        const action = archived ? ws.restoreProject(projectId) : ws.archiveProject(projectId);
        void action.then((changed) => {
            if (changed && !button.isConnected) {
                document.querySelector<HTMLElement>("[data-notebook-tabs]")?.focus();
            }
        });
    };

    const handlePick = (event: MouseEvent, projectId: string) => {
        const viaKeyboard = event.detail === 0;
        ws.pickProject(projectId);
        if (!viaKeyboard) return;
        window.setTimeout(() => {
            if (ws.selectedProject() !== projectId) return;
            document
                .querySelector<HTMLElement>("[data-notes-list] [data-note-row], [data-notes-list] [data-new-note]")
                ?.focus() ?? document.querySelector<HTMLElement>("[data-notes-heading]")?.focus();
        }, 0);
    };

    return (
        <div
            class="flex h-full w-full flex-col"
            style={{ background: "var(--db-bg)", "border-color": "var(--db-border)" }}
        >
            <div
                class="flex h-auto shrink-0 flex-col gap-1.5 border-b px-2 py-1.5"
                style={{ "border-color": "var(--db-border)" }}
            >
                <div class="flex min-h-12 items-center justify-between gap-1">
                    <span
                        class="text-[11px] font-bold uppercase tracking-widest"
                        style={{ color: "var(--db-text2)" }}
                    >
                        Notebooks
                    </span>
                    <div class="flex shrink-0 items-center gap-1">
                        <button
                            type="button"
                            onClick={() => ws.setSearchOpen(true)}
                            title="Search notes (Ctrl/Cmd+F)"
                            aria-label="Search notes"
                            class="notes-action flex h-8 w-8 items-center justify-center rounded transition-colors hover:bg-[var(--db-surface2)] focus-visible:outline-2 focus-visible:outline-offset-2"
                            style={{ color: "var(--db-text3)", "outline-color": "var(--db-accent)" }}
                        >
                            <svg viewBox="0 0 16 16" fill="currentColor" class="h-3.5 w-3.5" aria-hidden="true">
                                <path d="M7 2a5 5 0 1 0 3.536 8.536l2.482 2.482a.75.75 0 1 0 1.06-1.06l-2.482-2.482A5 5 0 0 0 7 2Zm-3.5 5a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0Z" />
                            </svg>
                        </button>
                        <button
                            type="button"
                            onClick={ws.addProject}
                            title="New notebook"
                            aria-label="New notebook"
                            class="notes-action flex h-8 w-8 items-center justify-center rounded transition-colors hover:bg-[var(--db-surface2)] focus-visible:outline-2 focus-visible:outline-offset-2"
                            style={{ color: "var(--db-text3)", "outline-color": "var(--db-accent)" }}
                        >
                            <SmallPlusIcon />
                        </button>
                    </div>
                </div>
                <NotebookFilterTabs
                    filter={ws.notebookFilter}
                    onChange={ws.setNotebookFilter}
                    activeCount={ws.activeNotebookCount}
                    archivedCount={ws.archivedNotebookCount}
                />
                <Show when={ws.archiveError()}>
                    {(message) => (
                        <p role="alert" class="text-[11px] leading-snug text-red-400">
                            {message()}
                        </p>
                    )}
                </Show>
                <ThemeToggle />
            </div>

            <div class="flex min-h-0 flex-1 flex-col overflow-y-auto py-1" data-notebooks-list>
                <Show
                    when={ws.visibleProjects().length > 0}
                    fallback={
                        <p class="px-3 py-6 text-center text-[12px]" style={{ color: "var(--db-text3)" }}>
                            {ws.notebookFilter() === "archived" ? "No archived notebooks" : "No active notebooks"}
                        </p>
                    }
                >
                    <For each={ws.visibleProjects()}>
                        {(project) => {
                            const active = () => project.id === ws.selectedProject();
                            const busy = () => ws.isProjectBusy(project.id);
                            const label = () => (project.isArchived ? "Restore notebook" : "Archive notebook");
                            return (
                                <div
                                    data-notebook-row={project.id}
                                    class="group relative flex min-h-8 items-center gap-1 px-2 py-1 transition-colors"
                                    style={{ background: active() ? "var(--db-accent-soft)" : "transparent" }}
                                >
                                    <Show when={active()}>
                                        <span
                                            class="absolute inset-y-1 left-0 w-0.5"
                                            style={{ background: "var(--db-accent)" }}
                                            aria-hidden="true"
                                        />
                                    </Show>
                                    <button
                                        type="button"
                                        onClick={(event) => handlePick(event, project.id)}
                                        title={project.name}
                                        aria-current={active() ? "true" : undefined}
                                        aria-label={`Open notebook: ${project.name}, ${project.notes.length} notes`}
                                        class="notes-row-action flex min-h-8 min-w-0 flex-1 items-center gap-1.5 rounded text-left focus-visible:outline-2 focus-visible:outline-offset-1"
                                    >
                                        <span class="shrink-0" style={{ color: "var(--db-text3)" }} aria-hidden="true">
                                            <FolderIcon />
                                        </span>
                                        <span
                                            class="min-w-0 flex-1 truncate text-[13px] font-medium"
                                            style={{ color: active() ? "var(--db-text)" : "var(--db-text2)" }}
                                        >
                                            {project.name}
                                        </span>
                                        <span
                                            class="ml-auto shrink-0 text-[11px] tabular-nums"
                                            style={{ color: "var(--db-text3)" }}
                                        >
                                            {project.notes.length}
                                        </span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={(event) => handleArchiveToggle(event, project.id, project.isArchived)}
                                        disabled={busy()}
                                        class={`flex h-8 w-8 shrink-0 items-center justify-center rounded transition-colors hover:text-[var(--db-accent)] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:visible disabled:opacity-40 group-focus-within:visible ${busy() ? "visible" : "invisible group-hover:visible"}`}
                                        style={{ color: "var(--db-text3)", "outline-color": "var(--db-accent)" }}
                                        title={label()}
                                        aria-label={`${label()}: ${project.name}`}
                                    >
                                        <Show when={project.isArchived} fallback={<ArchiveIcon />}>
                                            <RestoreIcon />
                                        </Show>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            ws.setPendingDelete({
                                                kind: "project",
                                                id: project.id,
                                                name: project.name,
                                            })
                                        }
                                        disabled={busy()}
                                        class={`flex h-8 w-8 shrink-0 items-center justify-center rounded transition-colors hover:text-red-400 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:visible disabled:opacity-40 group-focus-within:visible ${busy() ? "visible" : "invisible group-hover:visible"}`}
                                        style={{ color: "var(--db-text3)", "outline-color": "var(--db-accent)" }}
                                        title="Delete notebook"
                                        aria-label={`Delete notebook: ${project.name}`}
                                    >
                                        <TrashIcon />
                                    </button>
                                </div>
                            );
                        }}
                    </For>
                </Show>
            </div>

            <div class="shrink-0 border-t px-3 py-2" style={{ "border-color": "var(--db-border)" }}>
                <p class="text-[11px]" style={{ color: "var(--db-text3)" }} role="status" aria-live="polite">
                    {ws.isSaving() ? "Saving…" : "Saved"}
                </p>
            </div>
        </div>
    );
}
