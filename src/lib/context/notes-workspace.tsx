import { createContext, createMemo, useContext, type Accessor, type ParentProps } from "solid-js";

import { getDeviceLayout } from "~/lib/actions/device";
import { useNotesWorkspace, type NotesWorkspace } from "~/lib/hooks/use-notes-workspace";
import type { DeviceLayout } from "~/lib/utils/device";

type NotesWorkspaceContextValue = {
    workspace: NotesWorkspace;
    deviceLayout: Accessor<DeviceLayout>;
};

const NotesWorkspaceContext = createContext<NotesWorkspaceContextValue>();

export function NotesWorkspaceProvider(props: ParentProps) {
    const workspace = useNotesWorkspace();
    const deviceLayout = createMemo(() => getDeviceLayout());

    return <NotesWorkspaceContext value={{ workspace, deviceLayout }}>{props.children}</NotesWorkspaceContext>;
}

export function useNotesWorkspaceContext() {
    return useContext(NotesWorkspaceContext);
}
