import { Loading, type ParentProps } from "solid-js";

import { EmptyNotePane } from "~/components/editor/note-editor-pane";
import { NotesRouteBoundary } from "~/components/feedback/notes-route-error";
import { useNotesWorkspaceContext } from "~/lib/context/notes-workspace";

export default function NotebookLayoutRoute(props: ParentProps) {
    const { workspace } = useNotesWorkspaceContext();

    // The notes list lives in the persistent workspace frame (layout.tsx) so
    // opening/closing a notebook can animate without remounting the editor.
    // This route only owns the editor outlet and its loading boundary.
    return (
        <NotesRouteBoundary>
            <Loading fallback={<EmptyNotePane workspace={workspace} />}>{props.children}</Loading>
        </NotesRouteBoundary>
    );
}
