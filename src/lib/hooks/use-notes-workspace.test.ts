import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { flushEffects, renderReactive } from "~/lib/test-utils";

vi.mock("@solidjs/router", () => ({
    useLocation: () => ({ pathname: "/" }),
    useNavigate: () => vi.fn(),
    useSearchParams: () => [{}, vi.fn()],
    useAction: () => vi.fn().mockResolvedValue({ ok: true }),
}));
vi.mock("~/lib/actions/notes", () => ({
    getNotesData: () => ({ projects: [], selectedProjectId: "", selectedNoteId: "", updatedAt: null }),
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

beforeEach(() => window.localStorage.clear());
afterEach(() => {
    cleanups.splice(0).forEach((dispose) => dispose());
    vi.restoreAllMocks();
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
