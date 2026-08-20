import { createEffect, createMemo, createSignal, onSettled, type Accessor } from "solid-js";

import { searchNotes } from "./helpers";
import type { Project, SearchResult } from "./types";

type SearchDeps = {
    projects: Accessor<Project[]>;
    selectNote: (projectId: string, noteId: string) => void;
};

/**
 * Command-palette style fuzzy search across every notebook and note. Owns the
 * dialog open/query/highlight state, the global Cmd/Ctrl+F shortcut, autofocus,
 * and result selection (which drives the store's selection setters).
 */
export function useNotesSearch(deps: SearchDeps) {
    const [searchOpen, setSearchOpen] = createSignal(false);
    const [searchQuery, setSearchQuery] = createSignal("");
    const [searchIndex, setSearchIndex] = createSignal(0);

    let searchInputRef: HTMLInputElement | undefined;
    const registerSearchInput = (element: HTMLInputElement) => (searchInputRef = element);

    const searchResults = createMemo<SearchResult[]>(() => searchNotes(deps.projects(), searchQuery()));

    // Keep the highlighted result within bounds as results change.
    createEffect(
        () => searchResults().length,
        (count) => {
            setSearchIndex((index) => (count === 0 ? 0 : Math.min(index, count - 1)));
        },
    );

    const openSearch = () => {
        setSearchQuery("");
        setSearchIndex(0);
        setSearchOpen(true);
    };

    const moveSearchIndex = (delta: number) => {
        setSearchIndex((index) => Math.min(Math.max(index + delta, 0), Math.max(0, searchResults().length - 1)));
    };

    const selectSearchResult = (result: SearchResult) => {
        deps.selectNote(result.projectId, result.noteId);
        setSearchOpen(false);
    };

    // Global Cmd/Ctrl+F to open search, Esc to close it.
    onSettled(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            const isFind = event.key === "f" || event.key === "F";
            if ((event.ctrlKey || event.metaKey) && isFind && !event.shiftKey && !event.altKey) {
                event.preventDefault();
                event.stopPropagation();
                openSearch();
                return;
            }
            if (event.key === "Escape" && searchOpen()) {
                event.preventDefault();
                event.stopPropagation();
                setSearchOpen(false);
            }
        };
        window.addEventListener("keydown", handleKeyDown, { capture: true });
        return () => window.removeEventListener("keydown", handleKeyDown, { capture: true });
    });

    // Autofocus the search field when the dialog opens.
    createEffect(
        () => searchOpen(),
        (open) => {
            if (!open) return;
            const timeout = window.setTimeout(() => searchInputRef?.focus(), 0);
            return () => window.clearTimeout(timeout);
        },
    );

    return {
        searchOpen,
        setSearchOpen,
        searchQuery,
        setSearchQuery,
        searchIndex,
        setSearchIndex,
        searchResults,
        selectSearchResult,
        openSearch,
        moveSearchIndex,
        registerSearchInput,
    };
}

export type NotesSearch = ReturnType<typeof useNotesSearch>;
