import { createSignal } from "solid-js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { flushEffects, renderReactive } from "~/lib/test-utils";

const mocks = vi.hoisted(() => ({
    location: { pathname: "/" },
    navigate: vi.fn(),
}));

vi.mock("@solidjs/router", () => ({
    useLocation: () => mocks.location,
    useNavigate: () => mocks.navigate,
    useSearchParams: () => [{}, vi.fn()],
    useAction: () => vi.fn().mockResolvedValue({ ok: true }),
}));
vi.mock("~/lib/actions/notes", () => ({
    getNotesData: () => ({
        projects: [{ id: "p1", name: "Notebook", color: "1", isArchived: false, notes: [] }],
        selectedProjectId: "p1", selectedNoteId: "", updatedAt: null,
    }),
    notesAction: vi.fn(),
}));
vi.mock("~/lib/actions/templates", () => ({ getTemplatesData: () => [], templatesAction: vi.fn() }));
vi.mock("~/components/ui/theme", () => ({ useTheme: () => ({ theme: () => "light" }) }));

import { useNotesWorkspace } from "./use-notes-workspace";

const cleanups: (() => void)[] = [];
const setup = () => {
    const { result, dispose } = renderReactive(useNotesWorkspace);
    cleanups.push(dispose);
    return result;
};

beforeEach(() => {
    window.localStorage.clear();
    const [pathname, setPathname] = createSignal("/");
    mocks.location = { get pathname() { return pathname(); } };
    mocks.navigate.mockReset().mockImplementation((path: string) => setPathname(path));
});
afterEach(() => {
    cleanups.splice(0).forEach((dispose) => dispose());
    vi.restoreAllMocks();
});

describe("workspace route validation", () => {
    it("keeps a newly created template note selected before server data catches up", async () => {
        mocks.navigate("/notes/p1");
        const workspace = setup();
        await flushEffects();
        const noteId = workspace.addNoteFromTemplate({ name: "Meeting", content: "## Agenda" });
        await vi.waitFor(async () => {
            await flushEffects();
            expect(workspace.selectedNote()).toBe(noteId);
        });
        expect(workspace.activeNote()).toMatchObject({ id: noteId, title: "Meeting", content: "## Agenda" });
    });

    it.each([
        ["/notes/missing", "/"],
        ["/notes/p1/note/missing/edit-mode", "/notes/p1"],
    ])("corrects invalid deep link %s after hydration", async (path, expected) => {
        mocks.navigate(path);
        setup();
        await flushEffects();
        await flushEffects();
        expect(mocks.location.pathname).toBe(expected);
    });
});

describe("notebook sidebar preference", () => {
    it("persists toggles and restores the preference in a new workspace", async () => {
        const workspace = setup();
        await flushEffects();
        expect(workspace.sidebarVisible()).toBe(true);

        workspace.toggleSidebar();
        await flushEffects();
        expect(workspace.sidebarVisible()).toBe(false);
        expect(window.localStorage.getItem("notes-sidebar-visible")).toBe("false");

        const restored = setup();
        await flushEffects();
        expect(restored.sidebarVisible()).toBe(false);
        restored.toggleSidebar();
        await flushEffects();
        expect(restored.sidebarVisible()).toBe(true);
        expect(window.localStorage.getItem("notes-sidebar-visible")).toBe("true");
    });

    it("does not overwrite a hidden preference during startup", async () => {
        window.localStorage.setItem("notes-sidebar-visible", "false");
        const workspace = setup();
        await flushEffects();
        expect(workspace.sidebarVisible()).toBe(false);
        expect(window.localStorage.getItem("notes-sidebar-visible")).toBe("false");
    });

    it("allows toggling when sidebar storage is unavailable", async () => {
        const getItem = Storage.prototype.getItem;
        vi.spyOn(Storage.prototype, "getItem").mockImplementation(function (this: Storage, key) {
            if (key === "notes-sidebar-visible") throw new Error("Storage blocked");
            return getItem.call(this, key);
        });
        vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("Storage full"); });
        const workspace = setup();
        await flushEffects();
        expect(workspace.sidebarVisible()).toBe(true);
        workspace.toggleSidebar();
        await flushEffects();
        expect(workspace.sidebarVisible()).toBe(false);
    });
});
