import { describe, expect, it } from "vitest";

import { themeFromCookieHeader } from "./theme";

describe("themeFromCookieHeader", () => {
    it("reads the persisted dark theme", () => {
        expect(themeFromCookieHeader("session=abc; notes-theme=dark; other=value")).toBe("dark");
    });

    it("defaults missing and invalid values to light", () => {
        expect(themeFromCookieHeader(null)).toBe("light");
        expect(themeFromCookieHeader("notes-theme=unknown")).toBe("light");
    });
});
