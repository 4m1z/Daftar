import { beforeEach, describe, expect, it, vi } from "vitest";

const router = vi.hoisted(() => ({
    navigate: vi.fn(),
    params: {} as { notebook?: string; note?: string; mode?: string; search?: string },
    setParams: vi.fn(),
}));

vi.mock("@solidjs/router", () => ({
    useNavigate: () => router.navigate,
    useSearchParams: () => [router.params, router.setParams],
}));

import { notesNotebookPath, notesNotePath, useNotesRoute } from "./use-notes-route";

beforeEach(() => {
    router.navigate.mockReset();
    router.setParams.mockReset();
    router.params = {};
});

describe("notes routes", () => {
    it("builds notebook URLs with encoded IDs", () => {
        expect(notesNotebookPath("work notes")).toBe("/?notebook=work%20notes");
    });

    it("builds canonical note URLs and defaults to edit mode", () => {
        expect(notesNotePath("p1", "note/1")).toBe("/?notebook=p1&note=note%2F1&mode=edit-mode");
        expect(notesNotePath("p1", "n1", "view-mode")).toBe("/?notebook=p1&note=n1&mode=view-mode");
        expect(notesNotePath("p1", "n1", "both")).toBe("/?notebook=p1&note=n1&mode=both");
    });

    it("encodes search queries in notebook and note URLs", () => {
        expect(notesNotebookPath("p1", "solid router")).toBe("/?notebook=p1&search=solid%20router");
        expect(notesNotePath("p1", "n1", "edit-mode", "solid router"))
            .toBe("/?notebook=p1&note=n1&mode=edit-mode&search=solid%20router");
    });

    it("preserves search when navigating to another note", () => {
        router.params = { notebook: "p1", note: "n1", mode: "edit-mode", search: "routing" };
        const route = useNotesRoute();

        route.selectNote("p1", "n2");

        expect(router.navigate).toHaveBeenCalledWith(
            "/?notebook=p1&note=n2&mode=edit-mode&search=routing",
            { replace: false },
        );
    });

    it("replaces the current URL when the search query changes", () => {
        const route = useNotesRoute();
        route.setSearchQuery("solid");
        route.setSearchQuery("");

        expect(router.setParams).toHaveBeenNthCalledWith(1, { search: "solid" }, { replace: true });
        expect(router.setParams).toHaveBeenNthCalledWith(2, { search: undefined }, { replace: true });
    });
});
