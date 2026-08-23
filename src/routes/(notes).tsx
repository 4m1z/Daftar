import { Title } from "@solidjs/meta";
import { Show, type ParentProps } from "solid-js";

import { DeleteConfirmDialog } from "~/components/dialogs/delete-confirm-dialog";
import { NotesSearchDialog } from "~/components/dialogs/notes-search-dialog";
import { NotesRouteBoundary } from "~/components/feedback/notes-route-error";
import { MobileNotesNavigation } from "~/components/layout/mobile-notes-navigation";
import { NotebookSidebar } from "~/components/layout/notebook-sidebar";
import { NotesWorkspaceProvider, useNotesWorkspaceContext } from "~/lib/context/notes-workspace";

function NotesWorkspaceLayout(props: ParentProps) {
    const { workspace: ws, deviceLayout } = useNotesWorkspaceContext();

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
                <Show when={deviceLayout()} keyed>
                    {(layout) => (
                        <main
                            class={`notes-app db-page flex h-screen
                                w-full overflow-hidden antialiased
                                ${layout === "mobile" ? "flex-col" : "flex-row"}`}
                        >
                            <Show
                                when={layout === "mobile"}
                                fallback={<NotebookSidebar workspace={ws} />}
                            >
                                <MobileNotesNavigation workspace={ws} />
                            </Show>
                            {props.children}
                        </main>
                    )}
                </Show>
            </Show>
        </>
    );
}

export default function NotesRouteLayout(props: ParentProps) {
    return (
        <NotesRouteBoundary>
            <NotesWorkspaceProvider>
                <NotesWorkspaceLayout>{props.children}</NotesWorkspaceLayout>
            </NotesWorkspaceProvider>
        </NotesRouteBoundary>
    );
}
