import { Loading, Show, type ParentProps } from "solid-js";

import { EmptyNotePane } from "~/components/editor/note-editor-pane";
import { NotesRouteBoundary } from "~/components/feedback/notes-route-error";
import { NotesListSidebar } from "~/components/layout/notes-list-sidebar";
import { useNotesWorkspaceContext } from "~/lib/context/notes-workspace";

export default function NotebookLayoutRoute(props: ParentProps) {
    const { workspace, deviceLayout } = useNotesWorkspaceContext();

    return (
        <NotesRouteBoundary>
            <Show when={deviceLayout() === "desktop"}>
                <NotesListSidebar workspace={workspace} />
            </Show>
            <Loading fallback={<EmptyNotePane workspace={workspace} />}>
                {props.children}
            </Loading>
        </NotesRouteBoundary>
    );
}
