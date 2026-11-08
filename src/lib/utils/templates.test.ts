import { describe, expect, it } from "vitest";

import { fillTemplatePlaceholders, templatePreview } from "./templates";

describe("fillTemplatePlaceholders", () => {
    it("replaces every date placeholder using an ISO date", () => {
        const filled = fillTemplatePlaceholders(
            "# {{date}}\n\nWeek of {{date}}",
            new Date("2026-10-23T15:30:00.000Z"),
        );
        expect(filled).toBe("# 2026-10-23\n\nWeek of 2026-10-23");
    });

    it("leaves content without placeholders untouched", () => {
        expect(fillTemplatePlaceholders("# Notes", new Date())).toBe("# Notes");
    });
});

describe("templatePreview", () => {
    it("uses the first non-empty line without markdown decoration", () => {
        expect(templatePreview("\n\n## Weekly review {{date}}\nBody")).toBe("Weekly review {{date}}");
    });

    it("returns an empty string for empty content", () => {
        expect(templatePreview("\n\n")).toBe("");
    });
});
