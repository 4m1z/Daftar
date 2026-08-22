import { Title } from "@solidjs/meta";
import { Show } from "solid-js";

import { DeleteConfirmDialog } from "~/components/notes/delete-confirm-dialog";
import { MobileNotesNavigation } from "~/components/notes/mobile-notes-navigation";
import { NoteEditorPane } from "~/components/notes/note-editor-pane";
import { NotebookSidebar } from "~/components/notes/notebook-sidebar";
import { NotesListSidebar } from "~/components/notes/notes-list-sidebar";
import { NotesSearchDialog } from "~/components/notes/notes-search-dialog";
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
