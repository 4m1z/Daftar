import { For, Loading, Show, type ParentProps } from "solid-js";

import {
    CompressIcon,
    EditIcon,
    ExpandIcon,
    EyeIcon,
    NoteIcon,
    SmallPlusIcon,
    SplitViewIcon,
} from "~/components/ui/icons";
import { EditorModeToggle } from "~/components/editor/editor-mode-toggle";
import { NoteEditorPanel, NotePreviewPanel } from "~/components/editor/note-content-panels";
import type { NotesWorkspace } from "~/lib/hooks/use-notes-workspace";
import type { SplitMode } from "~/lib/types/notes";
import type { DeviceLayout } from "~/lib/utils/device";
import { wordCount } from "~/lib/utils/notes";

const SPLIT_MODES: SplitMode[] = ["edit", "split", "preview"];

const SPLIT_MODE_LABEL: Record<SplitMode, string> = {
    edit: "Edit only",
    split: "Edit & preview",
    preview: "Preview only",
};

function SplitModeIcon(props: { mode: SplitMode }) {
    return (
        <Show when={props.mode === "edit"} fallback={props.mode === "split" ? <SplitViewIcon /> : <EyeIcon />}>
            <EditIcon />
        </Show>
    );
}

export function NoteLayout(props: ParentProps<{ workspace: NotesWorkspace; layout: DeviceLayout }>) {
    const ws = props.workspace;

    const handleBack = (event: MouseEvent) => {
        const viaKeyboard = event.detail === 0;
        const projectId = ws.selectedProject();
        const noteId = ws.selectedNote();
        if (projectId) ws.pickProject(projectId);
        if (!viaKeyboard || !noteId) return;
        window.setTimeout(() => {
            if (ws.selectedNote()) return;
            document.querySelector<HTMLElement>(`[data-note-row="${noteId}"] button`)?.focus() ??
                document.querySelector<HTMLElement>("[data-notes-heading]")?.focus();
        }, 0);
    };

    // Identity for the reveal animation: notebook + note + mode. Content,
    // title, and timestamps are intentionally excluded so typing never
    // replays navigation motion.
    const transitionKey = () =>
        ws.selectedNote() ? `${ws.selectedProject()}:${ws.selectedNote()}:${ws.splitMode()}` : "empty";

    return (
        <div
            ref={ws.registerEditorColumn}
            class="flex h-full min-h-0 min-w-0 w-full flex-1 flex-col overflow-hidden"
            style={{ background: "var(--db-surface2)" }}
        >
            <Show
                when={ws.activeNote()}
                fallback={
                    <div
                        class="flex min-h-0 flex-1 flex-col gap-3 p-6"
                        aria-busy="true"
                        aria-label="Loading note"
                    >
                        <span class="sr-only" role="status">
                            Loading note
                        </span>
                        <div class="notes-skeleton h-5 w-48 rounded" aria-hidden="true" />
                        <div class="notes-skeleton h-4 w-full rounded" aria-hidden="true" />
                        <div class="notes-skeleton h-4 w-11/12 rounded" aria-hidden="true" />
                        <div class="notes-skeleton h-4 w-4/5 rounded" aria-hidden="true" />
                    </div>
                }
            >
                <div
                    class="flex min-h-12 shrink-0 flex-wrap items-center justify-between gap-x-2 gap-y-1 border-b px-2 py-1 sm:px-3"
                    style={{ "border-color": "var(--db-border)" }}
                >
                    <div class="flex min-w-0 flex-1 items-center gap-1">
                        <button
                            type="button"
                            onClick={handleBack}
                            title="Back to notes"
                            aria-label="Back to notes"
                            class="notes-compact-only notes-action flex h-8 w-8 shrink-0 items-center justify-center rounded transition-colors hover:bg-[var(--db-surface)] focus-visible:outline-2 focus-visible:outline-offset-1"
                            style={{ color: "var(--db-text3)", "outline-color": "var(--db-accent)" }}
                        >
                            <svg viewBox="0 0 20 20" fill="currentColor" class="h-4 w-4" aria-hidden="true">
                                <path
                                    fill-rule="evenodd"
                                    d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                                    clip-rule="evenodd"
                                />
                            </svg>
                        </button>
                        <input
                            value={ws.activeNote()?.title ?? ""}
                            onInput={(event) => ws.patchNote({ title: event.currentTarget.value })}
                            placeholder="Untitled"
                            aria-label="Note title"
                            data-editor-title
                            class="min-w-0 flex-1 bg-transparent text-[14px] font-semibold outline-none"
                            style={{ color: "var(--db-text)", "caret-color": "var(--db-accent)" }}
                        />
                    </div>
                    <div class="flex shrink-0 items-center gap-1">
                        <Show when={props.layout === "desktop"}>
                            <span
                                class="mr-2 text-[12px] tabular-nums"
                                style={{ color: "var(--db-text3)" }}
                                aria-label={`${wordCount(ws.activeNote()?.content)} words`}
                            >
                                {wordCount(ws.activeNote()?.content)}w
                            </span>
                        </Show>
                        <EditorModeToggle enabled={ws.vimMode()} onChange={ws.setVimMode} />
                        <div role="group" aria-label="Editor layout" class="flex items-center gap-1">
                            <For each={SPLIT_MODES}>
                                {(mode) => (
                                    <button
                                        type="button"
                                        onClick={() => ws.setSplitMode(mode)}
                                        title={SPLIT_MODE_LABEL[mode]}
                                        aria-label={SPLIT_MODE_LABEL[mode]}
                                        aria-pressed={ws.splitMode() === mode ? "true" : "false"}
                                        class="flex h-8 w-8 items-center justify-center rounded transition-colors focus-visible:outline-2 focus-visible:outline-offset-1"
                                        style={{
                                            background:
                                                ws.splitMode() === mode ? "var(--db-surface)" : "transparent",
                                            color: ws.splitMode() === mode ? "var(--db-text)" : "var(--db-text3)",
                                            "outline-color": "var(--db-accent)",
                                        }}
                                    >
                                        <SplitModeIcon mode={mode} />
                                    </button>
                                )}
                            </For>
                        </div>
                        <Show when={props.layout === "desktop"}>
                            <span
                                class="mx-1 inline-block h-4 w-px"
                                style={{ background: "var(--db-border)" }}
                                aria-hidden="true"
                            />
                            <button
                                type="button"
                                onClick={() => ws.setFocusMode((value) => !value)}
                                title={ws.focusMode() ? "Exit focus mode" : "Focus mode (hide panels)"}
                                aria-label={ws.focusMode() ? "Exit focus mode" : "Enter focus mode"}
                                aria-pressed={ws.focusMode() ? "true" : "false"}
                                class="flex h-8 w-8 items-center justify-center rounded transition-colors focus-visible:outline-2 focus-visible:outline-offset-1"
                                style={{
                                    background: ws.focusMode() ? "var(--db-surface)" : "transparent",
                                    color: ws.focusMode() ? "var(--db-text)" : "var(--db-text3)",
                                    "outline-color": "var(--db-accent)",
                                }}
                            >
                                {ws.focusMode() ? <CompressIcon /> : <ExpandIcon />}
                            </button>
                        </Show>
                    </div>
                </div>

                <div
                    class={`flex min-h-0 flex-1 overflow-hidden ${props.layout === "mobile" ? "flex-col" : "flex-row"}`}
                >
                    <Loading
                        fallback={
                            <div
                                class="flex min-h-0 flex-1 flex-col gap-3 p-6"
                                aria-busy="true"
                                aria-label="Loading note"
                            >
                                <span class="sr-only" role="status">
                                    Loading note
                                </span>
                                <div class="notes-skeleton h-5 w-48 rounded" aria-hidden="true" />
                                <div class="notes-skeleton h-4 w-full rounded" aria-hidden="true" />
                                <div class="notes-skeleton h-4 w-5/6 rounded" aria-hidden="true" />
                            </div>
                        }
                    >
                        <Show when={transitionKey()} keyed>
                            {(key) => (
                                <div class="notes-editor-enter flex min-h-0 min-w-0 flex-1" data-transition={key}>
                                    {props.children}
                                </div>
                            )}
                        </Show>
                    </Loading>
                </div>
            </Show>
        </div>
    );
}

export function EmptyNotePane(props: { workspace: NotesWorkspace }) {
    const ws = props.workspace;
    const project = () => ws.activeProject();
    const noteCount = () => project()?.notes.length ?? 0;

    return (
        <div class="notes-empty-enter flex h-full min-h-0 min-w-0 w-full flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
            <NoteIcon />
            <Show
                when={project()}
                fallback={
                    <>
                        <p class="text-[13px] font-medium" style={{ color: "var(--db-text2)" }}>
                            Choose a notebook
                        </p>
                        <p class="max-w-60 text-[12px]" style={{ color: "var(--db-text3)" }}>
                            Select a notebook on the left, or create your first one.
                        </p>
                        <button
                            type="button"
                            onClick={ws.addProject}
                            class="mt-1 flex min-h-8 items-center gap-2 rounded px-4 py-2 text-[13px] transition-colors hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2"
                            style={{
                                background: "var(--db-surface)",
                                color: "var(--db-text)",
                                "outline-color": "var(--db-accent)",
                            }}
                        >
                            <SmallPlusIcon />
                            New notebook
                        </button>
                    </>
                }
            >
                <Show
                    when={noteCount() === 0}
                    fallback={
                        <>
                            <p class="text-[13px] font-medium" style={{ color: "var(--db-text2)" }}>
                                Choose a note
                            </p>
                            <p class="max-w-60 text-[12px]" style={{ color: "var(--db-text3)" }}>
                                Select a note from the list to start writing.
                            </p>
                        </>
                    }
                >
                    <p class="text-[13px] font-medium" style={{ color: "var(--db-text2)" }}>
                        No notes yet
                    </p>
                    <p class="max-w-60 text-[12px]" style={{ color: "var(--db-text3)" }}>
                        Create your first note in this notebook.
                    </p>
                </Show>
            </Show>
        </div>
    );
}

export function NoteEditMode(props: { workspace: NotesWorkspace }) {
    const ws = props.workspace;
    return (
        <div class="notes-editor min-h-0 min-w-0 flex-1 overflow-hidden">
            <NoteEditorPanel
                note={ws.activeNote}
                onChange={(value) => ws.patchNote({ content: value })}
                theme={ws.theme}
                vimMode={ws.vimMode}
            />
        </div>
    );
}

export function NoteViewMode(props: { workspace: NotesWorkspace; layout: DeviceLayout }) {
    const ws = props.workspace;
    return (
        <div class="min-h-0 min-w-0 w-full flex-1 overflow-auto">
            <NotePreviewPanel
                note={ws.activeNote}
                onChange={(content) => ws.patchNote({ content })}
                mobile={props.layout === "mobile"}
            />
        </div>
    );
}

export function NoteSplitMode(props: { workspace: NotesWorkspace; layout: DeviceLayout }) {
    const ws = props.workspace;
    return (
        <>
            <div
                class={`notes-editor min-h-0 min-w-0 shrink-0 overflow-hidden ${
                    props.layout === "mobile" ? "h-1/2 w-full border-b" : "h-full w-[var(--split-pct)]"
                }`}
                style={{ "--split-pct": `${ws.splitPct()}%`, "border-color": "var(--db-border)" }}
            >
                <NoteEditorPanel
                    note={ws.activeNote}
                    onChange={(value) => ws.patchNote({ content: value })}
                    theme={ws.theme}
                    vimMode={ws.vimMode}
                />
            </div>
            <Show when={props.layout === "desktop"}>
                <button
                    type="button"
                    onMouseDown={ws.onDividerMouseDown}
                    onKeyDown={(event) => {
                        if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
                        event.preventDefault();
                        ws.nudgeSplit(event.key === "ArrowRight" ? 5 : -5);
                    }}
                    aria-label="Resize editor and preview panes"
                    title="Drag to resize"
                    class={`relative z-10 w-px shrink-0 cursor-col-resize
                        bg-[var(--db-border)] transition-colors
                        before:absolute before:-inset-x-2 before:inset-y-0
                        hover:bg-[var(--db-accent)]`}
                />
            </Show>
            <div class="min-h-0 min-w-0 flex-1 overflow-auto">
                <NotePreviewPanel
                    note={ws.activeNote}
                    onChange={(content) => ws.patchNote({ content })}
                    mobile={props.layout === "mobile"}
                />
            </div>
        </>
    );
}
