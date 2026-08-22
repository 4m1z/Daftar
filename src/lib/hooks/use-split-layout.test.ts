import { afterEach, describe, expect, it } from "vitest";

import { flushEffects, renderReactive } from "~/lib/test-utils";
import { useSplitLayout } from "./use-split-layout";

let cleanup: (() => void) | undefined;

afterEach(() => {
    cleanup?.();
    cleanup = undefined;
    document.documentElement.removeAttribute("data-notes-focus");
});

function setup() {
    const { result, dispose } = renderReactive(() => useSplitLayout());
    cleanup = dispose;
    return result;
}

describe("useSplitLayout", () => {
    it("starts in edit mode at a 50% split", () => {
        const layout = setup();
        expect(layout.splitMode()).toBe("edit");
        expect(layout.splitPct()).toBe(50);
        expect(layout.focusMode()).toBe(false);
    });

    it("switches split mode", async () => {
        const layout = setup();
        layout.setSplitMode("preview");
        await flushEffects();
        expect(layout.splitMode()).toBe("preview");
    });

    it("nudges the split within the 10-90 bounds", async () => {
        const layout = setup();

        layout.nudgeSplit(5);
        await flushEffects();
        expect(layout.splitPct()).toBe(55);

        layout.setSplitPct(88);
        layout.nudgeSplit(10);
        await flushEffects();
        expect(layout.splitPct()).toBe(90);

        layout.setSplitPct(12);
        layout.nudgeSplit(-10);
        await flushEffects();
        expect(layout.splitPct()).toBe(10);
    });

    it("reflects focus mode on the document root", async () => {
        const layout = setup();

        layout.setFocusMode(true);
        await flushEffects();
        expect(document.documentElement.getAttribute("data-notes-focus")).toBe("true");

        layout.setFocusMode(false);
        await flushEffects();
        expect(document.documentElement.hasAttribute("data-notes-focus")).toBe(false);
    });

    it("clears the focus attribute on dispose", async () => {
        const layout = setup();
        layout.setFocusMode(true);
        await flushEffects();
        expect(document.documentElement.hasAttribute("data-notes-focus")).toBe(true);

        cleanup?.();
        cleanup = undefined;
        expect(document.documentElement.hasAttribute("data-notes-focus")).toBe(false);
    });

    it("resizes via divider drag using the editor column width", async () => {
        const layout = setup();

        const column = document.createElement("div");
        column.getBoundingClientRect = () => ({ width: 200 }) as DOMRect;
        layout.registerEditorColumn(column);

        layout.onDividerMouseDown({ preventDefault() {}, clientX: 100 } as unknown as MouseEvent & {
            currentTarget: HTMLButtonElement;
            target: Element;
        });

        // Moving +50px over a 200px column shifts the split by 25%.
        window.dispatchEvent(new MouseEvent("mousemove", { clientX: 150 }));
        await flushEffects();
        expect(layout.splitPct()).toBe(75);

        // After mouseup, further movement is ignored.
        window.dispatchEvent(new MouseEvent("mouseup"));
        window.dispatchEvent(new MouseEvent("mousemove", { clientX: 0 }));
        await flushEffects();
        expect(layout.splitPct()).toBe(75);
    });
});
