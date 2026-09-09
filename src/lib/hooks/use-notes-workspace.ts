import { createEffect, createMemo, createSignal } from "solid-js";

import { useTheme } from "~/components/ui/theme";

import { useEditorMode } from "./use-editor-mode";
import { useNoteDeletion } from "./use-note-deletion";
import { useNotesAutosave } from "./use-notes-autosave";
import { useNotesSearch } from "./use-notes-search";
import { useNotesRoute } from "./use-notes-route";
import { useNotesStore } from "./use-notes-store";
import { useSplitLayout } from "./use-split-layout";

export type NotebookFilter = "active" | "archived";

export function useNotesWorkspace() {
    const { theme } = useTheme();

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

    // Notebook list visibility. Filtering never removes records from the
    // underlying collection: selection, search, and route validation keep
    // using the full list so archived deep links stay valid.
    const [notebookFilter, setNotebookFilter] = createSignal<NotebookFilter>("active");

    const visibleProjects = createMemo(() => {
        const filter = notebookFilter();
        return store.projects().filter((project) => (filter === "archived" ? project.isArchived : !project.isArchived));
    });
    const activeNotebookCount = createMemo(() => store.projects().filter((project) => !project.isArchived).length);
    const archivedNotebookCount = createMemo(
        () => store.projects().filter((project) => Boolean(project.isArchived)).length,
    );

    // Reveal the selected notebook's group when navigation changes the
    // selection (deep links, search results, archived direct links). Manual
    // tab switches never change the selection, so they are never overridden.
    // NOTE: Solid 2 requires the two-argument createEffect(compute,
    // effectFn) form; the single-argument form throws at runtime.
    let previousSelectedProject: string | undefined;
    createEffect(
        () => {
            const selectedId = route.selectedProject();
            const project = store.projects().find((item) => item.id === selectedId);
            return {
                selectedId,
                group: (project ? (project.isArchived ? "archived" : "active") : null) as NotebookFilter | null,
            };
        },
        (current) => {
            const selectionChanged = current.selectedId !== previousSelectedProject;
            previousSelectedProject = current.selectedId;
            if (!selectionChanged || !current.group) return;
            if (current.group !== notebookFilter()) setNotebookFilter(current.group);
        },
    );

    // Leaving the active note clears focus mode so navigation never strands
    // the user with both rails hidden and no visible exit control.
    createEffect(
        () => route.selectedNote(),
        (noteId) => {
            if (!noteId && layout.focusMode()) layout.setFocusMode(false);
        },
    );

    const addProject = () => {
        // New notebooks are always active; reveal them when viewing Archived.
        // Selection behavior is unchanged (the new notebook is not selected).
        setNotebookFilter("active");
        store.addProject();
    };

    const archiveProject = async (id: string): Promise<boolean> => {
        const archived = await store.setProjectArchived(id, true);
        // Keep the open editor visible and reveal its new group.
        if (archived && route.selectedProject() === id) setNotebookFilter("archived");
        return archived;
    };

    const restoreProject = async (id: string): Promise<boolean> => {
        const restored = await store.setProjectArchived(id, false);
        if (restored && route.selectedProject() === id) setNotebookFilter("active");
        return restored;
    };

    return {
        // theme
        theme,
        // data store
        data: store.data,
        projects: store.projects,
        visibleProjects,
        notebookFilter,
        setNotebookFilter,
        activeNotebookCount,
        archivedNotebookCount,
        archiveProject,
        restoreProject,
        isProjectBusy: store.isProjectBusy,
        archiveError: store.archiveError,
        clearArchiveError: store.clearArchiveError,
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
        showRoot: store.showRoot,
        addProject,
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
