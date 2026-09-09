import { beforeEach, describe, expect, it, vi } from "vitest";

const router = vi.hoisted(() => ({
    navigate: vi.fn(),
    location: { pathname: "/" },
    searchParams: {} as { search?: string },
    setSearchParams: vi.fn(),
}));

vi.mock("@solidjs/router", () => ({
    useNavigate: () => router.navigate,
    useLocation: () => router.location,
    useSearchParams: () => [router.searchParams, router.setSearchParams],
}));

import { notesNotebookPath, notesNotePath, useNotesRoute } from "./use-notes-route";

beforeEach(() => {
    router.navigate.mockReset();
    router.setSearchParams.mockReset();
    router.location.pathname = "/";
    router.searchParams = {};
});

describe("notes routes", () => {
    it("builds notebook URLs with encoded IDs", () => {
        expect(notesNotebookPath("work notes")).toBe("/notes/work%20notes");
    });

    it("builds canonical note URLs and defaults to edit mode", () => {
        expect(notesNotePath("p1", "note/1")).toBe("/notes/p1/note/note%2F1/edit-mode");
        expect(notesNotePath("p1", "n1", "view-mode")).toBe("/notes/p1/note/n1/view-mode");
        expect(notesNotePath("p1", "n1", "both")).toBe("/notes/p1/note/n1/both");
    });

    it("encodes search queries in notebook and note URLs", () => {
        expect(notesNotebookPath("p1", "solid router")).toBe("/notes/p1?search=solid%20router");
        expect(notesNotePath("p1", "n1", "edit-mode", "solid router"))
            .toBe("/notes/p1/note/n1/edit-mode?search=solid%20router");
    });

    it("reads and decodes notebook and note path parameters", () => {
        router.location.pathname = "/notes/work%20notes/note/note%2F1/view-mode";
        const route = useNotesRoute();

        expect(route.selectedProject()).toBe("work notes");
        expect(route.selectedNote()).toBe("note/1");
        expect(route.splitMode()).toBe("preview");
    });

    it("preserves search when navigating to another note", () => {
        router.location.pathname = "/notes/p1/note/n1/edit-mode";
        router.searchParams = { search: "routing" };
        const route = useNotesRoute();

        route.selectNote("p1", "n2");

        expect(router.navigate).toHaveBeenCalledWith(
            "/notes/p1/note/n2/edit-mode?search=routing",
            { replace: false },
        );
    });

    it("treats re-selecting the open note as a no-op", () => {
        router.location.pathname = "/notes/p1/note/n1/edit-mode";
        const route = useNotesRoute();

        route.pickNote("n1");

        expect(router.navigate).not.toHaveBeenCalled();

        route.pickNote("n2");

        expect(router.navigate).toHaveBeenCalledWith("/notes/p1/note/n2/edit-mode", {
            replace: false,
        });
    });

    it("replaces the current URL when the search query changes", () => {
        const route = useNotesRoute();
        route.setSearchQuery("solid");
        route.setSearchQuery("");

        expect(router.setSearchParams).toHaveBeenNthCalledWith(1, { search: "solid" }, { replace: true });
        expect(router.setSearchParams).toHaveBeenNthCalledWith(2, { search: undefined }, { replace: true });
    });

    it("canonicalizes invalid projects, notes, and modes", () => {
        const projects = [{
            id: "p1",
            name: "Project",
            color: "1",
            isArchived: false,
            notes: [{ id: "n1", title: "Note", content: "", updatedAt: "2026-08-22T00:00:00.000Z" }],
        }];

        router.location.pathname = "/notes/missing";
        router.searchParams = { search: "routing" };
        expect(useNotesRoute().canonicalPath(projects)).toBe("/?search=routing");

        router.location.pathname = "/notes/p1/note/missing/edit-mode";
        expect(useNotesRoute().canonicalPath(projects)).toBe("/notes/p1?search=routing");

        router.location.pathname = "/notes/p1/note/n1/invalid";
        expect(useNotesRoute().canonicalPath(projects))
            .toBe("/notes/p1/note/n1/edit-mode?search=routing");
    });

    it("treats archived notebooks as valid deep-link targets", () => {
        const projects = [
            {
                id: "p1",
                name: "Active",
                color: "1",
                isArchived: false,
                notes: [{ id: "n1", title: "Note", content: "", updatedAt: "2026-08-22T00:00:00.000Z" }],
            },
            {
                id: "p2",
                name: "Old project",
                color: "2",
                isArchived: true,
                notes: [{ id: "n2", title: "Old note", content: "", updatedAt: "2026-08-22T00:00:00.000Z" }],
            },
        ];

        router.location.pathname = "/notes/p2";
        expect(useNotesRoute().canonicalPath(projects)).toBeNull();

        router.location.pathname = "/notes/p2/note/n2/edit-mode";
        expect(useNotesRoute().canonicalPath(projects)).toBeNull();

        router.location.pathname = "/notes/p2/note/missing/edit-mode";
        expect(useNotesRoute().canonicalPath(projects)).toBe("/notes/p2");
    });
});
