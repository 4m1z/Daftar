import { beforeEach, describe, expect, it } from "vitest";
import "@testing-library/jest-dom/vitest";

import {
    applyThemeClass,
    nextTheme,
    storeTheme,
    themeBootstrapScript,
    themeFromCookieHeader,
    themeFromDocument,
} from "./theme";

describe("themeFromCookieHeader", () => {
    it("reads the persisted dark theme", () => {
        expect(themeFromCookieHeader("session=abc; notes-theme=dark; other=value")).toBe("dark");
    });

    it("reads the persisted omablue theme", () => {
        expect(themeFromCookieHeader("notes-theme=omablue")).toBe("omablue");
    });

    it("defaults missing and invalid values to light", () => {
        expect(themeFromCookieHeader(null)).toBe("light");
        expect(themeFromCookieHeader("notes-theme=unknown")).toBe("light");
    });
});

describe("themeFromDocument", () => {
    it("reads dark and omablue from the dashboard theme attribute", () => {
        document.documentElement.dataset.dashboardTheme = "dark";
        expect(themeFromDocument()).toBe("dark");
        document.documentElement.dataset.dashboardTheme = "omablue";
        expect(themeFromDocument()).toBe("omablue");
        document.documentElement.dataset.dashboardTheme = "light";
        expect(themeFromDocument()).toBe("light");
    });
});

describe("nextTheme", () => {
    it("cycles light -> dark -> omablue -> light", () => {
        expect(nextTheme("light")).toBe("dark");
        expect(nextTheme("dark")).toBe("omablue");
        expect(nextTheme("omablue")).toBe("light");
    });
});

describe("applyThemeClass", () => {
    beforeEach(() => {
        document.documentElement.className = "h-screen";
    });

    it("applies the omablue palette on top of the dark dashboard classes", () => {
        applyThemeClass("omablue");
        expect(document.documentElement).toHaveClass("dark", "dashboard-dark", "dashboard-omablue");
        expect(document.documentElement.dataset.theme).toBe("night");
        expect(document.documentElement.dataset.dashboardTheme).toBe("omablue");
    });

    it("applies dark without the omablue palette", () => {
        applyThemeClass("dark");
        expect(document.documentElement).toHaveClass("dark", "dashboard-dark");
        expect(document.documentElement).not.toHaveClass("dashboard-omablue");
        expect(document.documentElement.dataset.theme).toBe("night");
    });

    it("clears all theme classes for light", () => {
        applyThemeClass("omablue");
        applyThemeClass("light");
        expect(document.documentElement).not.toHaveClass("dark", "dashboard-dark", "dashboard-omablue");
        expect(document.documentElement.dataset.theme).toBe("light");
    });

    it("persists through the store helper", () => {
        storeTheme("omablue");
        expect(window.localStorage.getItem("dashboard-theme")).toBe("omablue");
        expect(document.documentElement.dataset.dashboardTheme).toBe("omablue");
        applyThemeClass("omablue");
        expect(document.documentElement).toHaveClass("dashboard-omablue");
    });
});

describe("theme bootstrap before first paint", () => {
    beforeEach(() => {
        window.localStorage.clear();
        document.cookie = "notes-theme=; Path=/; Max-Age=0";
        document.documentElement.className = "h-screen";
    });

    const bootstrap = () => new Function(themeBootstrapScript)();

    it("restores omablue from the cookie", () => {
        document.cookie = "notes-theme=omablue; Path=/";
        bootstrap();
        expect(document.documentElement).toHaveClass("dark", "dashboard-dark", "dashboard-omablue");
        expect(document.documentElement.dataset.theme).toBe("night");
        expect(document.documentElement.dataset.dashboardTheme).toBe("omablue");
    });

    it("falls back to the stored dashboard theme without a cookie", () => {
        window.localStorage.setItem("dashboard-theme", "omablue");
        bootstrap();
        expect(document.documentElement).toHaveClass("dashboard-omablue");
        expect(document.cookie).toContain("notes-theme=omablue");
    });

    it("defaults to light and clears dashboard styling", () => {
        document.documentElement.classList.add("dark", "dashboard-dark", "dashboard-omablue");
        bootstrap();
        expect(document.documentElement).not.toHaveClass("dark", "dashboard-dark", "dashboard-omablue");
        expect(document.documentElement.dataset.theme).toBe("light");
    });
});
