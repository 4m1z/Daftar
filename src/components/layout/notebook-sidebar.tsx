import { For, Show } from "solid-js";

import { ThemeToggle } from "~/components/ui/theme";
import { ChevronRightIcon, EditIcon, SmallPlusIcon, TemplateIcon } from "~/components/ui/icons";
import type { NotesWorkspace } from "~/lib/hooks/use-notes-workspace";
import { notebookColor } from "~/lib/utils/notes";
import { NotebookFilterTabs } from "./notebook-filter-tabs";

/** Left rail: notebook list, archive filter, theme toggle, and save status. */
export function NotebookSidebar(props: { workspace: NotesWorkspace }) {
    const ws = props.workspace;

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
                class="flex h-auto shrink-0 flex-col gap-2 border-b px-2.5 py-2"
                style={{ "border-color": "var(--db-border)" }}
            >
                <div class="flex min-h-10 items-center justify-between gap-1">
                    <span
                        class="text-[11px] font-bold uppercase tracking-widest"
                        style={{ color: "var(--db-text2)" }}
                    >
                        Notebooks
                    </span>
                    <div class="flex shrink-0 items-center gap-1">
                        <ThemeToggle />
                        <button
                            type="button"
                            onClick={ws.toggleSidebar}
                            title="Hide notebook sidebar (Ctrl/Cmd+/)"
                            aria-label="Hide notebook sidebar"
                            aria-expanded={ws.sidebarVisible() ? "true" : "false"}
                            class="notes-desktop-only notes-action flex h-8 w-8 items-center justify-center rounded transition-colors hover:bg-[var(--db-surface2)] focus-visible:outline-2 focus-visible:outline-offset-2"
                            style={{ color: "var(--db-text3)", "outline-color": "var(--db-accent)" }}
                        >
                            <ChevronRightIcon class="h-3.5 w-3.5 rotate-180" />
                        </button>
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
            </div>

            <div class="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-1.5 py-2" data-notebooks-list>
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
                            const count = () => project.notes.length;
                            return (
                                <div
                                    data-notebook-row={project.id}
                                    data-active={active() ? "true" : "false"}
                                    class="group relative rounded-lg transition-colors"
                                    style={{ background: active() ? "var(--db-accent-soft)" : undefined }}
                                >
                                    <Show when={active()}>
                                        <span
                                            class="absolute inset-y-2 left-0 w-0.5 rounded-full"
                                            style={{ background: "var(--db-accent)" }}
                                            aria-hidden="true"
                                        />
                                    </Show>
                                    <button
                                        type="button"
                                        onClick={(event) => handlePick(event, project.id)}
                                        title={project.name}
                                        aria-current={active() ? "true" : undefined}
                                        aria-label={`Open notebook: ${project.name}, ${count()} ${count() === 1 ? "note" : "notes"}`}
                                        class="notes-row-action flex min-h-11 w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-[var(--db-surface)] focus-visible:outline-2 focus-visible:outline-offset-1"
                                        style={{ "outline-color": "var(--db-accent)" }}
                                    >
                                        <span
                                            class="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                                            style={{ background: notebookColor(project.color) }}
                                            aria-hidden="true"
                                        />
                                        <span class="min-w-0 flex-1">
                                            <span
                                                class="block whitespace-normal break-words text-[13px] font-medium leading-snug"
                                                style={{ color: active() ? "var(--db-text)" : "var(--db-text2)" }}
                                            >
                                                {project.name}
                                            </span>
                                            <span
                                                class="mt-0.5 flex items-center gap-1.5 text-[10px] font-medium tabular-nums"
                                                style={{ color: "var(--db-text3)" }}
                                            >
                                                {count()} {count() === 1 ? "note" : "notes"}
                                                <Show when={project.isArchived}>
                                                    <span
                                                        class="rounded px-1 py-px text-[9px] font-semibold uppercase tracking-[0.08em]"
                                                        style={{
                                                            background: "var(--db-surface2)",
                                                            color: "var(--db-text3)",
                                                        }}
                                                    >
                                                        Archived
                                                    </span>
                                                </Show>
                                            </span>
                                        </span>
                                    </button>
                                </div>
                            );
                        }}
                    </For>
                </Show>
            </div>

            <div class="shrink-0 border-t px-2.5 py-2" style={{ "border-color": "var(--db-border)" }}>
                <div class="flex min-h-8 items-center justify-between gap-1">
                    <span class="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--db-text2)" }}>
                        Templates
                    </span>
                    <div class="flex items-center gap-0.5">
                        <button
                            type="button"
                            onClick={ws.openTemplatesPicker}
                            title="New note from template"
                            aria-label="New note from template"
                            class="flex h-7 w-7 items-center justify-center rounded hover:bg-[var(--db-surface2)]"
                            style={{ color: "var(--db-text3)" }}
                        >
                            <SmallPlusIcon class="h-3.5 w-3.5" />
                        </button>
                        <button
                            type="button"
                            onClick={ws.openTemplatesManager}
                            title="Manage templates"
                            aria-label="Manage templates"
                            class="flex h-7 w-7 items-center justify-center rounded hover:bg-[var(--db-surface2)]"
                            style={{ color: "var(--db-text3)" }}
                        >
                            <EditIcon class="h-3.5 w-3.5" />
                        </button>
                    </div>
                </div>
                <div class="flex max-h-32 flex-col gap-0.5 overflow-y-auto">
                    <For each={ws.templates()}>
                        {(template) => (
                            <button
                                type="button"
                                onClick={() => ws.addNoteFromTemplate(template)}
                                disabled={!ws.activeProject()}
                                title={ws.activeProject() ? `Create note from ${template.name}` : "Open a notebook first"}
                                class="flex items-center gap-2 rounded px-2 py-1.5 text-left text-[12px] hover:bg-[var(--db-surface)] disabled:opacity-40"
                                style={{ color: "var(--db-text2)" }}
                            >
                                <TemplateIcon class="h-3.5 w-3.5 shrink-0" />
                                <span class="truncate">{template.name}</span>
                            </button>
                        )}
                    </For>
                </div>
            </div>

            <div class="shrink-0 border-t px-3 py-2" style={{ "border-color": "var(--db-border)" }}>
                <p class="text-[11px]" style={{ color: "var(--db-text3)" }} role="status" aria-live="polite">
                    {ws.isSaving() ? "Saving…" : "Saved"}
                </p>
            </div>
        </div>
    );
}
