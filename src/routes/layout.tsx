import { Title } from "@solidjs/meta";
import { createEffect, createMemo, createSignal, onSettled, Show, untrack, type ParentProps } from "solid-js";

import { DeleteConfirmDialog } from "~/components/dialogs/delete-confirm-dialog";
import { NotesSearchDialog } from "~/components/dialogs/notes-search-dialog";
import { TemplatesDialog } from "~/components/dialogs/templates-dialog";
import { NotesRouteBoundary } from "~/components/feedback/notes-route-error";
import { NotebookSidebar } from "~/components/layout/notebook-sidebar";
import { NotesListSidebar } from "~/components/layout/notes-list-sidebar";
import { NotesWorkspaceProvider, useNotesWorkspaceContext } from "~/lib/context/notes-workspace";

function NotesWorkspaceLayout(props: ParentProps) {
    const { workspace: ws, deviceLayout } = useNotesWorkspaceContext();

    // Navigation depth drives the single-view flow on compact layouts:
    // 0 = notebooks, 1 = notes list, 2 = editor.
    const depth = createMemo(() => (!ws.selectedProject() ? 0 : !ws.selectedNote() ? 1 : 2));
    const [prevDepth, setPrevDepth] = createSignal(0);
    const [direction, setDirection] = createSignal<"forward" | "back" | "none">("none");

    // NOTE: Solid 2 requires the two-argument createEffect(compute, effectFn) form.
    createEffect(
        () => depth(),
        (current) => {
            const previous = untrack(prevDepth);
            if (current !== previous) {
                setDirection(current > previous ? "forward" : "back");
                setPrevDepth(current);
            }
        },
    );

    const compact = createMemo(() => deviceLayout() === "mobile");
    const focused = () => ws.focusMode();

    // Capture before CodeMirror's Mod-/ comment binding.
    onSettled(() => {
        const handleSidebarToggle = (event: KeyboardEvent) => {
            if (compact() || !(event.ctrlKey || event.metaKey) || event.key !== "/") return;
            event.preventDefault();
            event.stopPropagation();
            ws.toggleSidebar();
        };
        document.addEventListener("keydown", handleSidebarToggle, true);
        return () => document.removeEventListener("keydown", handleSidebarToggle, true);
    });

    const notebooksActive = () => {
        if (focused()) return false;
        return compact() ? depth() === 0 : ws.sidebarVisible();
    };
    const notesActive = () => {
        if (focused()) return false;
        if (compact()) return depth() === 1;
        return depth() >= 1;
    };
    const editorActive = () => {
        if (compact()) return depth() === 2;
        return true;
    };

    return (
        <>
            <Title>Daftar</Title>
            <Show when={ws.data()}>
                <DeleteConfirmDialog
                    pending={ws.pendingDelete}
                    onCancel={() => ws.setPendingDelete(null)}
                    onConfirm={ws.confirmPendingDelete}
                />
                <NotesSearchDialog
                    open={ws.searchOpen}
                    query={ws.searchQuery}
                    setQuery={ws.setSearchQuery}
                    index={ws.searchIndex}
                    setIndex={ws.setSearchIndex}
                    results={ws.searchResults}
                    onSelect={ws.selectSearchResult}
                    onClose={() => ws.setSearchOpen(false)}
                    moveIndex={ws.moveSearchIndex}
                    registerInput={ws.registerSearchInput}
                />
                <Show when={ws.templatesDialog()}>
                    {(mode) => (
                        <TemplatesDialog
                            mode={mode()}
                            templates={ws.templates()}
                            activeNote={ws.activeNote()}
                            onClose={ws.closeTemplatesDialog}
                            onPick={(template) => {
                                ws.addNoteFromTemplate(template);
                                ws.closeTemplatesDialog();
                            }}
                            onCreate={ws.createTemplate}
                            onUpdate={ws.updateTemplate}
                            onDelete={ws.deleteTemplate}
                            onDuplicate={ws.duplicateTemplate}
                        />
                    )}
                </Show>
                <main
                    class="notes-app db-page notes-frame"
                    data-depth={depth()}
                    data-direction={direction()}
                    data-compact={compact() ? "true" : "false"}
                    data-focus={focused() ? "true" : "false"}
                    data-sidebar-hidden={!compact() && !ws.sidebarVisible() ? "true" : "false"}
                >
                    <div
                        class="notes-pane notes-pane-notebooks"
                        data-pane="notebooks"
                        aria-hidden={notebooksActive() ? undefined : "true"}
                        inert={notebooksActive() ? undefined : true}
                    >
                        <NotebookSidebar workspace={ws} />
                    </div>
                    <div
                        class="notes-pane notes-pane-notes"
                        data-pane="notes"
                        aria-hidden={notesActive() ? undefined : "true"}
                        inert={notesActive() ? undefined : true}
                    >
                        <NotesListSidebar workspace={ws} />
                    </div>
                    <div
                        class="notes-pane notes-pane-editor"
                        data-pane="editor"
                        aria-hidden={editorActive() ? undefined : "true"}
                        inert={editorActive() ? undefined : true}
                    >
                        {props.children}
                    </div>
                </main>
            </Show>
        </>
    );
}

export default function NotesLayoutRoute(props: ParentProps) {
    return (
        <NotesRouteBoundary>
            <NotesWorkspaceProvider>
                <NotesWorkspaceLayout>{props.children}</NotesWorkspaceLayout>
            </NotesWorkspaceProvider>
        </NotesRouteBoundary>
    );
}
