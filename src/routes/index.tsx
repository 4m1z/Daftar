import { Title } from "@solidjs/meta";
import { Show } from "solid-js";

import { DeleteConfirmDialog } from "~/components/dialogs/delete-confirm-dialog";
import { NotesSearchDialog } from "~/components/dialogs/notes-search-dialog";
import { NoteEditorPane } from "~/components/editor/note-editor-pane";
import { MobileNotesNavigation } from "~/components/layout/mobile-notes-navigation";
import { NotebookSidebar } from "~/components/layout/notebook-sidebar";
import { NotesListSidebar } from "~/components/layout/notes-list-sidebar";
import { useNotesWorkspace } from "~/lib/hooks/use-notes-workspace";

export default function NotesPage() {
  const ws = useNotesWorkspace();

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
        <main class="notes-app db-page flex h-screen w-full flex-col overflow-hidden antialiased xl:flex-row">
          <MobileNotesNavigation workspace={ws} />
          <NotebookSidebar workspace={ws} />
          <NotesListSidebar workspace={ws} />
          <NoteEditorPane workspace={ws} />
        </main>
      </Show>
    </>
  );
}
