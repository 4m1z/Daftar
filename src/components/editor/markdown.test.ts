import { afterEach, describe, expect, it } from "vitest";

import {
    clearDiagramMarkupCache,
    diagramCacheKey,
    getCachedDiagramMarkup,
    setCachedDiagramMarkup,
} from "./markdown";
import { renderGithubAlerts } from "./markdown";

afterEach(() => {
    clearDiagramMarkupCache();
});

describe("diagramMarkupCache", () => {
    it("keys entries by language, theme, and source", () => {
        expect(diagramCacheKey("mermaid", "graph TD", "light")).not.toBe(
            diagramCacheKey("excalidraw", "graph TD", "light"),
        );
        expect(diagramCacheKey("mermaid", "graph TD", "light")).not.toBe(
            diagramCacheKey("mermaid", "graph TD", "dark"),
        );
        expect(diagramCacheKey("mermaid", "graph TD", "light")).not.toBe(
            diagramCacheKey("mermaid", "graph LR", "light"),
        );
    });

    it("returns undefined for entries that were never rendered", () => {
        expect(getCachedDiagramMarkup("mermaid", "graph TD", "light")).toBeUndefined();
    });

    it("round-trips rendered markup so unchanged diagrams can seed synchronously", () => {
        setCachedDiagramMarkup("excalidraw", '{"elements":[]}', "dark", "<svg>drawing</svg>");
        expect(getCachedDiagramMarkup("excalidraw", '{"elements":[]}', "dark")).toBe("<svg>drawing</svg>");
        // Other themes/languages stay empty.
        expect(getCachedDiagramMarkup("excalidraw", '{"elements":[]}', "light")).toBeUndefined();
    });

    it("evicts the least recently stored entry once bounded", () => {
        for (let index = 0; index < 30; index += 1) {
            setCachedDiagramMarkup("mermaid", `diagram-${index}`, "light", `<svg>${index}</svg>`);
        }
        // Re-touch the oldest entry so `diagram-1` becomes the eviction victim.
        setCachedDiagramMarkup("mermaid", "diagram-0", "light", "<svg>0</svg>");
        setCachedDiagramMarkup("mermaid", "diagram-new", "light", "<svg>new</svg>");

        expect(getCachedDiagramMarkup("mermaid", "diagram-0", "light")).toBe("<svg>0</svg>");
        expect(getCachedDiagramMarkup("mermaid", "diagram-new", "light")).toBe("<svg>new</svg>");
        expect(getCachedDiagramMarkup("mermaid", "diagram-1", "light")).toBeUndefined();
    });
});

describe("renderGithubAlerts", () => {
    it("renders a GitHub alert heading and body as an alert blockquote", () => {
        expect(renderGithubAlerts("<blockquote>\n<p>[!WARNING] Careful</p>\n</blockquote>")).toContain(
            '<blockquote class="md-alert md-alert-warning">\n<p class="md-alert-title">Warning</p>\n<p>Careful</p>',
        );
    });
    it("keeps ordinary blockquotes unchanged", () => {
        expect(renderGithubAlerts("<blockquote><p>Plain text</p></blockquote>")).toBe(
            "<blockquote><p>Plain text</p></blockquote>",
        );
    });
});
