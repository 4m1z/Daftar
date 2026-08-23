import type { ParentProps } from "solid-js";

import { NoteLayout } from "~/components/editor/note-editor-pane";
import { NotesRouteBoundary } from "~/components/feedback/notes-route-error";
import { useNotesWorkspaceContext } from "~/lib/context/notes-workspace";

export default function NoteLayoutRoute(props: ParentProps) {
    const { workspace, deviceLayout } = useNotesWorkspaceContext();

    return (
        <NotesRouteBoundary>
            <NoteLayout workspace={workspace} layout={deviceLayout()}>
                {props.children}
            </NoteLayout>
        </NotesRouteBoundary>
    );
}
