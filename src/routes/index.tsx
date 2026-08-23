import { EmptyNotePane } from "~/components/editor/note-editor-pane";
import { useNotesWorkspaceContext } from "~/lib/context/notes-workspace";

export default function NotesIndexRoute() {
    const { workspace } = useNotesWorkspaceContext();
    return <EmptyNotePane workspace={workspace} />;
}
