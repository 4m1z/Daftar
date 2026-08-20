import { createSignal } from "solid-js";
import { afterEach, describe, expect, it, vi } from "vitest";

import { flushEffects, renderReactive } from "./test-support";
import type { Project } from "./types";
import { useNotesSearch } from "./use-notes-search";

let cleanup: (() => void) | undefined;

afterEach(() => {
    cleanup?.();
    cleanup = undefined;
});

const projectsFixture: Project[] = [
    {
        id: "p1",
        name: "Web Tech",
        color: "#111",
        notes: [
            { id: "n1", title: "Solid JS", content: "signals", updatedAt: "2024-01-01T00:00:00.000Z" },
            { id: "n2", title: "Routing", content: "routes", updatedAt: "2024-01-02T00:00:00.000Z" },
        ],
    },
    {
        id: "p2",
        name: "Cooking",
        color: "#222",
        notes: [{ id: "n3", title: "Pasta", content: "boil", updatedAt: "2024-01-03T00:00:00.000Z" }],
    },
];

function setup() {
    const [projects] = createSignal<Project[]>(projectsFixture);
    const selectNote = vi.fn();

    const { result, dispose } = renderReactive(() => useNotesSearch({ projects, selectNote }));
    cleanup = dispose;
    return { search: result, selectNote };
}

describe("useNotesSearch", () => {
    it("starts closed with an empty query", () => {
        const { search } = setup();
        expect(search.searchOpen()).toBe(false);
        expect(search.searchQuery()).toBe("");
        expect(search.searchResults()).toEqual([]);
    });

    it("produces results reactively as the query changes", async () => {
        const { search } = setup();
        search.setSearchQuery("pasta");
        await flushEffects();
        const results = search.searchResults();
        expect(results).toHaveLength(1);
        expect(results[0].noteId).toBe("n3");
    });

    it("openSearch resets state and opens the dialog", async () => {
        const { search } = setup();
        search.setSearchQuery("stale");
        search.setSearchIndex(5);

        search.openSearch();
        await flushEffects();

        expect(search.searchOpen()).toBe(true);
        expect(search.searchQuery()).toBe("");
        expect(search.searchIndex()).toBe(0);
    });

    it("moveSearchIndex clamps within the available results", async () => {
        const { search } = setup();
        search.setSearchQuery("routing");
        await flushEffects();
        expect(search.searchResults().length).toBe(1);

        search.moveSearchIndex(1);
        await flushEffects();
        expect(search.searchIndex()).toBe(0); // cannot exceed last index

        search.moveSearchIndex(-1);
        await flushEffects();
        expect(search.searchIndex()).toBe(0); // cannot go below zero
    });

    it("keeps the highlighted index in bounds when results shrink", async () => {
        const { search } = setup();
        search.setSearchQuery("s"); // matches multiple notes
        await flushEffects();
        search.setSearchIndex(search.searchResults().length - 1);

        search.setSearchQuery("pasta"); // now a single result
        await flushEffects();

        expect(search.searchIndex()).toBeLessThanOrEqual(search.searchResults().length - 1);
    });

    it("selecting a result navigates to the note and closes", async () => {
        const { search, selectNote } = setup();
        search.setSearchOpen(true);
        await flushEffects();

        search.selectSearchResult({
            projectId: "p1",
            noteId: "n2",
            projectName: "Web Tech",
            projectColor: "#111",
            noteTitle: "Routing",
            snippet: "routes",
            score: 0,
        });
        await flushEffects();

        expect(selectNote).toHaveBeenCalledWith("p1", "n2");
        expect(search.searchOpen()).toBe(false);
    });

    it("opens on Ctrl+F and closes on Escape", async () => {
        const { search } = setup();
        await flushEffects();

        window.dispatchEvent(new KeyboardEvent("keydown", { key: "f", ctrlKey: true }));
        await flushEffects();
        expect(search.searchOpen()).toBe(true);

        window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
        await flushEffects();
        expect(search.searchOpen()).toBe(false);
    });
});
