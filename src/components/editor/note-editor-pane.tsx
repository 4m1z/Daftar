import { For, Show } from "solid-js";

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

/** Shared editor column: title bar, view-mode controls, and responsive edit/preview panes. */
export function NoteEditorPane(props: { workspace: NotesWorkspace }) {
    const ws = props.workspace;
    return (
        <div
            ref={ws.registerEditorColumn}
            class="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
            style={{ background: "var(--db-surface2)" }}
        >
            <Show
                when={ws.activeNote()}
                fallback={
                    <div class="flex min-h-0 flex-1 flex-col items-center justify-center gap-4">
                        <NoteIcon />
                        <p class="text-[13px]" style={{ color: "var(--db-text3)" }}>
                            Select a note or create a new one
                        </p>
                        <button
                            type="button"
                            onClick={ws.activeProject() ? ws.addNote : ws.addProject}
                            class="flex items-center gap-2 rounded px-4 py-2 text-[13px] transition-colors"
                            style={{ background: "var(--db-surface)", color: "var(--db-text)" }}
                        >
                            <SmallPlusIcon />
                            {ws.activeProject() ? "New note" : "New notebook"}
                        </button>
                    </div>
                }
            >
                <div
                    class="flex h-11 shrink-0 items-center justify-between border-b px-3 xl:px-4"
                    style={{ "border-color": "var(--db-border)" }}
                >
                    <input
                        value={ws.activeNote()?.title ?? ""}
                        onInput={(event) => ws.patchNote({ title: event.currentTarget.value })}
                        placeholder="Untitled"
                        class="min-w-0 flex-1 bg-transparent text-[14px] font-semibold outline-none"
                        style={{ color: "var(--db-text)", "caret-color": "var(--db-accent)" }}
                    />
                    <div class="flex shrink-0 items-center gap-1 pl-2 xl:pl-4">
                        <span class="mr-3 hidden text-[11px] tabular-nums sm:inline" style={{ color: "var(--db-text3)" }}>
                            {wordCount(ws.activeNote()?.content)}w
                        </span>
                        <EditorModeToggle enabled={ws.vimMode()} onChange={ws.setVimMode} />
                        <For each={SPLIT_MODES}>
                            {(mode) => (
                                <button
                                    type="button"
                                    onClick={() => ws.setSplitMode(mode)}
                                    title={SPLIT_MODE_LABEL[mode]}
                                    class="flex h-6 w-6 items-center justify-center rounded transition-colors"
                                    style={{
                                        background: ws.splitMode() === mode ? "var(--db-surface)" : "transparent",
                                        color: ws.splitMode() === mode ? "var(--db-text)" : "var(--db-text3)",
                                    }}
                                >
                                    <SplitModeIcon mode={mode} />
                                </button>
                            )}
                        </For>
                        <span class="mx-1 hidden h-4 w-px xl:inline-block" style={{ background: "var(--db-border)" }} />
                        <button
                            type="button"
                            onClick={() => ws.setFocusMode((value) => !value)}
                            title={ws.focusMode() ? "Exit focus mode" : "Focus mode (hide panels)"}
                            class="hidden h-6 w-6 items-center justify-center rounded transition-colors xl:flex"
                            style={{
                                background: ws.focusMode() ? "var(--db-surface)" : "transparent",
                                color: ws.focusMode() ? "var(--db-text)" : "var(--db-text3)",
                            }}
                        >
                            {ws.focusMode() ? <CompressIcon /> : <ExpandIcon />}
                        </button>
                    </div>
                </div>

                <div class="flex min-h-0 flex-1 flex-col overflow-hidden xl:flex-row">
                    <Show when={ws.splitMode() === "edit"}>
                        <div class="notes-editor min-h-0 flex-1 overflow-hidden">
                            <NoteEditorPanel
                                note={ws.activeNote}
                                onChange={(value) => ws.patchNote({ content: value })}
                                theme={ws.theme}
                                vimMode={ws.vimMode}
                            />
                        </div>
                    </Show>
                    <Show when={ws.splitMode() === "preview"}>
                        <div class="min-h-0 w-full flex-1 overflow-auto">
                            <NotePreviewPanel note={ws.activeNote} onChange={(content) => ws.patchNote({ content })} />
                        </div>
                    </Show>
                    <Show when={ws.splitMode() === "split"}>
                        <div
                            class="notes-editor h-1/2 min-h-0 w-full shrink-0 overflow-hidden border-b xl:h-full xl:w-[var(--split-pct)] xl:border-b-0"
                            style={{ "--split-pct": `${ws.splitPct()}%`, "border-color": "var(--db-border)" }}
                        >
                            <NoteEditorPanel
                                note={ws.activeNote}
                                onChange={(value) => ws.patchNote({ content: value })}
                                theme={ws.theme}
                                vimMode={ws.vimMode}
                            />
                        </div>
                        <button
                            type="button"
                            onMouseDown={ws.onDividerMouseDown}
                            onKeyDown={(event) => {
                                if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
                                event.preventDefault();
                                ws.nudgeSplit(event.key === "ArrowRight" ? 5 : -5);
                            }}
                            aria-label="Resize editor and preview panes"
                            class="relative z-10 hidden w-px shrink-0 cursor-col-resize bg-[var(--db-border)] transition-colors before:absolute before:-inset-x-2 before:inset-y-0 hover:bg-[var(--db-accent)] xl:block"
                            title="Drag to resize"
                        />
                        <div class="min-h-0 min-w-0 flex-1 overflow-auto">
                            <NotePreviewPanel note={ws.activeNote} onChange={(content) => ws.patchNote({ content })} />
                        </div>
                    </Show>
                </div>
            </Show>
        </div>
    );
}
