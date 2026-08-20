import { describe, expect, it } from "vitest";

import { notesNotebookPath, notesNotePath } from "./use-notes-route";

describe("notes routes", () => {
    it("builds notebook URLs with encoded IDs", () => {
        expect(notesNotebookPath("work notes")).toBe("/?notebook=work%20notes");
    });

    it("builds canonical note URLs and defaults to edit mode", () => {
        expect(notesNotePath("p1", "note/1")).toBe("/?notebook=p1&note=note%2F1&mode=edit-mode");
        expect(notesNotePath("p1", "n1", "view-mode")).toBe("/?notebook=p1&note=n1&mode=view-mode");
        expect(notesNotePath("p1", "n1", "both")).toBe("/?notebook=p1&note=n1&mode=both");
    });
});
