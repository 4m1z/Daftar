import { Match, Switch } from "solid-js";

import { NoteEditMode, NoteSplitMode, NoteViewMode } from "~/components/editor/note-editor-pane";
import { useNotesWorkspaceContext } from "~/lib/context/notes-workspace";

export default function NoteModeRoute() {
    const { workspace, deviceLayout } = useNotesWorkspaceContext();

    return (
        <Switch fallback={<NoteEditMode workspace={workspace} />}>
            <Match when={workspace.splitMode() === "preview"}>
                <NoteViewMode workspace={workspace} layout={deviceLayout()} />
            </Match>
            <Match when={workspace.splitMode() === "split"}>
                <NoteSplitMode workspace={workspace} layout={deviceLayout()} />
            </Match>
        </Switch>
    );
}
