import type { JSX } from "@solidjs/web";
import { createEffect, createSignal } from "solid-js";

import type { SplitMode } from "~/lib/types/notes";

const MIN_SPLIT_PCT = 10;
const MAX_SPLIT_PCT = 90;

const clampSplit = (value: number) => Math.min(MAX_SPLIT_PCT, Math.max(MIN_SPLIT_PCT, value));

/**
 * Owns the editor layout: edit/split/preview mode, the draggable divider between
 * the editor and preview panes, and distraction-free focus mode. Fully
 * self-contained with no dependency on the notes data model.
 */
export function useSplitLayout() {
    const [splitPct, setSplitPct] = createSignal(50);
    const [splitMode, setSplitMode] = createSignal<SplitMode>("edit");
    const [focusMode, setFocusMode] = createSignal(false);

    let editorColRef: HTMLDivElement | undefined;
    let dragStartX = 0;
    let dragStartPct = 0;
    let isDragging = false;

    const registerEditorColumn = (element: HTMLDivElement) => (editorColRef = element);

    // Reflect focus mode on the document root for global styling.
    createEffect(
        () => focusMode(),
        (focused) => {
            if (focused) document.documentElement.setAttribute("data-notes-focus", "true");
            else document.documentElement.removeAttribute("data-notes-focus");
            return () => document.documentElement.removeAttribute("data-notes-focus");
        },
    );

    const onDividerMouseDown: JSX.EventHandler<HTMLButtonElement, MouseEvent> = (event) => {
        event.preventDefault();
        isDragging = true;
        dragStartX = event.clientX;
        dragStartPct = splitPct();
        const onMove = (moveEvent: MouseEvent) => {
            if (!isDragging || !editorColRef) return;
            const width = editorColRef.getBoundingClientRect().width;
            const delta = ((moveEvent.clientX - dragStartX) / width) * 100;
            setSplitPct(clampSplit(dragStartPct + delta));
        };
        const onUp = () => {
            isDragging = false;
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseup", onUp);
        };
        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onUp);
    };

    const nudgeSplit = (deltaPct: number) => setSplitPct((value) => clampSplit(value + deltaPct));

    return {
        splitPct,
        setSplitPct,
        nudgeSplit,
        splitMode,
        setSplitMode,
        focusMode,
        setFocusMode,
        onDividerMouseDown,
        registerEditorColumn,
    };
}

export type SplitLayout = ReturnType<typeof useSplitLayout>;
