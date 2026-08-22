import { Title } from "@solidjs/meta";
import { createMemo, Show } from "solid-js";

import { DeleteConfirmDialog } from "~/components/dialogs/delete-confirm-dialog";
import { NotesSearchDialog } from "~/components/dialogs/notes-search-dialog";
import { NoteEditorPane } from "~/components/editor/note-editor-pane";
import { MobileNotesNavigation } from "~/components/layout/mobile-notes-navigation";
import { NotebookSidebar } from "~/components/layout/notebook-sidebar";
import { NotesListSidebar } from "~/components/layout/notes-list-sidebar";
import { getDeviceLayout } from "~/lib/actions/device";
import { useNotesWorkspace } from "~/lib/hooks/use-notes-workspace";

export default function NotesPage() {
  const ws = useNotesWorkspace();
  const deviceLayout = createMemo(() => getDeviceLayout());

  return (
    <>
      <Title>Notes</Title>
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
              class={`notes-app db-page flex h-screen w-full overflow-hidden antialiased ${layout === "mobile" ? "flex-col" : "flex-row"}`}
            >
              <Show
                when={layout === "mobile"}
                fallback={
                  <>
                    <NotebookSidebar workspace={ws} />
                    <NotesListSidebar workspace={ws} />
                  </>
                }
              >
                <MobileNotesNavigation workspace={ws} />
              </Show>
              <NoteEditorPane workspace={ws} layout={layout} />
            </main>
          )}
        </Show>
      </Show>
    </>
  );
}
