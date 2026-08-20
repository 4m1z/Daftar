import { Title } from "@solidjs/meta";
import { createSignal, onSettled, Show } from "solid-js";

import { DeleteConfirmDialog } from "~/components/notes/delete-confirm-dialog";
import { MobileNotesLayout } from "~/components/notes/mobile-notes-layout";
import { NoteEditorPane } from "~/components/notes/note-editor-pane";
import { NotebookSidebar } from "~/components/notes/notebook-sidebar";
import { NotesListSidebar } from "~/components/notes/notes-list-sidebar";
import { NotesSearchDialog } from "~/components/notes/notes-search-dialog";
import { useNotesWorkspace } from "~/lib/notes/use-notes-workspace";

export default function NotesPage() {
  const ws = useNotesWorkspace();
  const [desktop, setDesktop] = createSignal(false);

  onSettled(() => {
    const query = window.matchMedia("(min-width: 1280px)");
    const sync = () => setDesktop(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  });

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
        <main class="notes-app db-page flex h-screen w-full overflow-hidden antialiased">
          <Show when={desktop()} fallback={<MobileNotesLayout workspace={ws} />}>
            <NotebookSidebar workspace={ws} />
            <NotesListSidebar workspace={ws} />
            <NoteEditorPane workspace={ws} />
          </Show>
        </main>
      </Show>
    </>
  );
}
