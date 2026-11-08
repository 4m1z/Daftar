import { describe, expect, it } from "vitest";

import { getFilteredCommands, parseSlashQuery, SLASH_COMMANDS } from "./slash-commands";

describe("parseSlashQuery", () => {
    it("detects a slash command at the start of a line", () => {
        expect(parseSlashQuery("/task", 5)).toEqual({ from: 0, query: "task" });
    });
    it("allows leading whitespace but keeps it out of the query", () => {
        expect(parseSlashQuery("  /h1", 5)).toEqual({ from: 2, query: "h1" });
    });
    it("returns an empty query for a bare slash", () => {
        expect(parseSlashQuery("/", 1)).toEqual({ from: 0, query: "" });
    });
    it("ignores slashes after text", () => {
        expect(parseSlashQuery("hello /task", 11)).toBeNull();
    });
    it("ignores a cursor before the slash", () => {
        expect(parseSlashQuery("/task", 0)).toBeNull();
    });
});

describe("getFilteredCommands", () => {
    it("filters by id and label", () => {
        const results = getFilteredCommands("task");
        expect(results.some((command) => command.id === "taskList")).toBe(true);
        expect(results.every((command) => command.id !== "heading1")).toBe(true);
    });
    it("finds every GitHub alert by category", () => {
        expect(getFilteredCommands("github alerts").map((command) => command.id)).toEqual([
            "alertNote", "alertTip", "alertImportant", "alertWarning", "alertCaution",
        ]);
    });
    it("returns no results for an unknown query", () => {
        expect(getFilteredCommands("definitely-not-a-command")).toEqual([]);
    });
});

describe("slash command insertion data", () => {
    it("includes core formatting and alert commands", () => {
        const ids = SLASH_COMMANDS.map((command) => command.id);
        for (const id of ["heading1", "heading2", "heading3", "bold", "italic", "blockquote", "orderedList", "unorderedList", "taskList", "link", "image", "inlineCode", "codeBlock", "alertNote", "alertTip", "alertImportant", "alertWarning", "alertCaution"]) {
            expect(ids).toContain(id);
        }
    });
    it("keeps alert snippets in valid GitHub alert syntax", () => {
        for (const command of SLASH_COMMANDS.filter((item) => item.id.startsWith("alert"))) {
            expect(command.insert).toMatch(/^> \[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\n> $/);
        }
    });
    it("keeps caret offsets inside inserted text", () => {
        for (const command of SLASH_COMMANDS) {
            expect(command.cursor ?? command.insert.length).toBeLessThanOrEqual(command.insert.length);
        }
    });
    it("has an Excalidraw command for the existing /draw shortcut", () => {
        expect(SLASH_COMMANDS.find((command) => command.action === "drawing")?.id).toBe("drawing");
    });
});
