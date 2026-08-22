import { createEffect } from "solid-js";

import { useDashboardTheme } from "~/components/ui/dashboard-theme";

import { useEditorMode } from "./use-editor-mode";
import { useNoteDeletion } from "./use-note-deletion";
import { useNotesAutosave } from "./use-notes-autosave";
import { useNotesSearch } from "./use-notes-search";
import { useNotesRoute } from "./use-notes-route";
import { useNotesStore } from "./use-notes-store";
import { useSplitLayout } from "./use-split-layout";

export function useNotesWorkspace() {
    const { theme, setTheme } = useDashboardTheme();

    const route = useNotesRoute();
    const store = useNotesStore(route);
    useNotesAutosave(store);

    createEffect(
        () => {
            const loaded = store.data();
            return loaded ? route.canonicalPath(loaded.projects) : null;
        },
        (path) => {
            if (path) queueMicrotask(() => route.replacePath(path));
        },
    );

    const layout = useSplitLayout();
    const editorMode = useEditorMode();

    const search = useNotesSearch({
        projects: store.projects,
        selectNote: route.selectNote,
        query: route.searchQuery,
        setQuery: route.setSearchQuery,
    });

    const deletion = useNoteDeletion({
        deleteProject: store.deleteProject,
        deleteNote: store.deleteNote,
    });

    return {
        // theme
        theme,
        setTheme,
        // data store
        data: store.data,
        projects: store.projects,
        selectedProject: store.selectedProject,
        selectedNote: store.selectedNote,
        setSelectedNote: store.setSelectedNote,
        activeProject: store.activeProject,
        activeNote: store.activeNote,
        orderedActiveNotes: store.orderedActiveNotes,
        preview: store.preview,
        setPreview: store.setPreview,
        isSaving: store.isSaving,
        pickProject: store.pickProject,
        addProject: store.addProject,
        renameProject: store.renameProject,
        addNote: store.addNote,
        patchNote: store.patchNote,
        // editor layout
        ...layout,
        ...editorMode,
        splitMode: route.splitMode,
        setSplitMode: route.setSplitMode,
        // search palette
        ...search,
        // delete confirmation
        ...deletion,
    };
}

export type NotesWorkspace = ReturnType<typeof useNotesWorkspace>;
