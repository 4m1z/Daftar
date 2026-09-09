import { Title } from "@solidjs/meta";
import { createEffect, createMemo, createSignal, Show, type ParentProps } from "solid-js";

import { DeleteConfirmDialog } from "~/components/dialogs/delete-confirm-dialog";
import { NotesSearchDialog } from "~/components/dialogs/notes-search-dialog";
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
            const previous = prevDepth();
            if (current !== previous) {
                setDirection(current > previous ? "forward" : "back");
                setPrevDepth(current);
            }
        },
    );

    const compact = createMemo(() => deviceLayout() === "mobile");
    const focused = () => ws.focusMode();

    const notebooksActive = () => {
        if (focused()) return false;
        return compact() ? depth() === 0 : true;
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
                <main
                    class="notes-app db-page notes-frame"
                    data-depth={depth()}
                    data-direction={direction()}
                    data-compact={compact() ? "true" : "false"}
                    data-focus={focused() ? "true" : "false"}
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
