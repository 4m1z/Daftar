import { createContext, createMemo, createSignal, onSettled, useContext, type Accessor, type ParentProps } from "solid-js";

import { getDeviceLayout } from "~/lib/actions/device";
import { useNotesWorkspace, type NotesWorkspace } from "~/lib/hooks/use-notes-workspace";
import type { DeviceLayout } from "~/lib/utils/device";

type NotesWorkspaceContextValue = {
    workspace: NotesWorkspace;
    deviceLayout: Accessor<DeviceLayout>;
};

const NotesWorkspaceContext = createContext<NotesWorkspaceContextValue>();

const COMPACT_MEDIA = "(max-width: 1023px)";

export function NotesWorkspaceProvider(props: ParentProps) {
    const workspace = useNotesWorkspace();
    const serverLayout = createMemo(() => getDeviceLayout());
    // Viewport-responsive layout: SSR uses the server classification for first
    // paint, then the client tracks the 1024px breakpoint so narrow desktop
    // windows get the single-view flow without remounting workspace data.
    const [viewport, setViewport] = createSignal<DeviceLayout | null>(null);

    onSettled(() => {
        if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
        const query = window.matchMedia(COMPACT_MEDIA);
        const update = () => setViewport(query.matches ? "mobile" : "desktop");
        update();
        query.addEventListener("change", update);
        return () => query.removeEventListener("change", update);
    });

    const deviceLayout = createMemo(() => viewport() ?? serverLayout());

    return <NotesWorkspaceContext value={{ workspace, deviceLayout }}>{props.children}</NotesWorkspaceContext>;
}

export function useNotesWorkspaceContext() {
    return useContext(NotesWorkspaceContext);
}
