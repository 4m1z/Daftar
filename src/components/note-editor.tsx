import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { languages } from "@codemirror/language-data";
import { searchKeymap } from "@codemirror/search";
import { Compartment, EditorSelection, EditorState } from "@codemirror/state";
import { drawSelection, EditorView, keymap, placeholder as cmPlaceholder } from "@codemirror/view";
import { tags } from "@lezer/highlight";
import { vim } from "@replit/codemirror-vim";
import { createEffect, createSignal, Show, onSettled } from "solid-js";

import { ExcalidrawEditorModal, type ExcalidrawScene } from "~/components/excalidraw-editor-modal";
import type { Theme } from "~/utils/theme";

function findExcalidrawFenceAt(state: EditorState, position: number) {
    let fenceStartLine: number | null = null;
    let fenceLanguage = "";
    for (let lineNumber = 1; lineNumber <= state.doc.lines; lineNumber += 1) {
        const line = state.doc.line(lineNumber);
        const trimmed = line.text.trim();
        if (!trimmed.startsWith("```")) continue;
        if (fenceStartLine === null) {
            fenceStartLine = lineNumber;
            fenceLanguage = trimmed.slice(3).trim().toLowerCase();
            continue;
        }
        const startLine = state.doc.line(fenceStartLine);
        if (fenceLanguage === "excalidraw" && position >= startLine.from && position <= line.to) {
            try {
                const scene = JSON.parse(state.sliceDoc(startLine.to + 1, line.from)) as ExcalidrawScene;
                if (scene && Array.isArray(scene.elements)) {
                    return { scene, from: startLine.from, to: line.to };
                }
            } catch {
                return null;
            }
        }
        fenceStartLine = null;
        fenceLanguage = "";
    }
    return null;
}

const editorHighlightStyle = HighlightStyle.define([
    { tag: tags.comment, color: "var(--editor-comment)", fontStyle: "italic" },
    { tag: [tags.keyword, tags.modifier, tags.operator], color: "var(--editor-keyword)" },
    { tag: [tags.atom, tags.bool, tags.number], color: "var(--editor-number)" },
    { tag: [tags.string, tags.character, tags.regexp], color: "var(--editor-string)" },
    { tag: [tags.typeName, tags.className, tags.tagName], color: "var(--editor-type)" },
    { tag: [tags.definition(tags.variableName), tags.function(tags.variableName)], color: "var(--editor-function)" },
    { tag: [tags.propertyName, tags.attributeName], color: "var(--editor-function)" },
    { tag: tags.punctuation, color: "var(--editor-number)" },
    { tag: tags.heading, color: "var(--editor-type)", fontWeight: "600" },
    { tag: tags.emphasis, color: "var(--editor-fg)", fontStyle: "italic" },
    { tag: tags.strong, color: "var(--editor-fg)", fontWeight: "600" },
    { tag: [tags.link, tags.url], color: "var(--editor-link)", textDecoration: "underline" },
    { tag: tags.monospace, color: "var(--editor-fg)" },
]);

const darkTheme = EditorView.theme(
    {
        "&": { height: "100%", background: "transparent", color: "var(--editor-fg)", fontSize: "14px" },
        ".cm-scroller": {
            overflow: "auto",
            fontFamily: "var(--font-mono, monospace)",
            lineHeight: "1.75",
            padding: "2rem 2.5rem",
        },
        ".cm-content": { caretColor: "var(--db-accent, #a8bb9d)" },
        ".cm-cursor, .cm-dropCursor": { borderLeftColor: "var(--db-accent, #a8bb9d)", borderLeftWidth: "2px" },
        ".cm-fat-cursor": { background: "var(--db-accent, #a8bb9d) !important", outline: "none !important" },
        ".cm-focused": { outline: "none" },
        ".cm-line": { padding: "0" },
        ".cm-vim-panel, .cm-vim-panel input": {
            fontFamily: "var(--font-mono, monospace)",
            fontSize: "12px",
            color: "var(--db-text2, #a8ad9f)",
            background: "var(--db-surface, #272a24)",
            borderTop: "1px solid var(--db-border, #3b3e36)",
            padding: "2px 8px",
        },
        "&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, ::selection": {
            background: "var(--db-accent-soft, #343d31) !important",
        },
        ".cm-selectionBackground": { background: "var(--db-accent-soft, #343d31) !important" },
        ".cm-focused .cm-selectionBackground": {
            background: "color-mix(in srgb, var(--db-accent, #a8bb9d) 32%, transparent) !important",
        },
        ".cm-activeLine": { background: "color-mix(in srgb, var(--db-accent, #a8bb9d) 7%, transparent)" },
        ".cm-line .tok-heading, .cm-line .tok-heading1, .cm-line .tok-heading2, .cm-line .tok-heading3": {
            color: "var(--editor-type)",
            fontWeight: "600",
        },
        ".cm-line .tok-emphasis": { color: "var(--editor-fg)", fontStyle: "italic" },
        ".cm-line .tok-strong": { color: "var(--editor-fg)", fontWeight: "600" },
        ".cm-line .tok-url, .cm-line .tok-link": { color: "var(--editor-link)" },
        ".cm-line .tok-monospace": { color: "var(--editor-fg)" },
        ".cm-line .tok-string": { color: "var(--editor-string)" },
        ".cm-line .tok-comment": { color: "var(--editor-comment)", fontStyle: "italic" },
        ".cm-line .tok-meta, .cm-line .tok-atom": { color: "var(--editor-number)" },
    },
    { dark: true },
);

const lightTheme = EditorView.theme(
    {
        "&": { height: "100%", background: "transparent", color: "var(--editor-fg)", fontSize: "14px" },
        ".cm-scroller": {
            overflow: "auto",
            fontFamily: "var(--font-mono, monospace)",
            lineHeight: "1.8",
            padding: "1.5rem 2rem",
        },
        ".cm-content": { caretColor: "var(--db-accent, #5f755d)" },
        ".cm-cursor, .cm-dropCursor": { borderLeftColor: "var(--db-accent, #5f755d)", borderLeftWidth: "2px" },
        ".cm-fat-cursor": { background: "var(--db-accent, #5f755d) !important", outline: "none !important" },
        ".cm-focused": { outline: "none" },
        ".cm-line": { padding: "0" },
        ".cm-vim-panel, .cm-vim-panel input": {
            fontFamily: "var(--font-mono, monospace)",
            fontSize: "12px",
            color: "var(--db-text2, #62675c)",
            background: "var(--db-surface, #f8f6f0)",
            borderTop: "1px solid var(--db-border, #d8d2c5)",
            padding: "2px 8px",
        },
        "&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, ::selection": {
            background: "var(--db-accent-soft, #dfe6da) !important",
        },
        ".cm-selectionBackground": { background: "var(--db-accent-soft, #dfe6da) !important" },
        ".cm-focused .cm-selectionBackground": {
            background: "color-mix(in srgb, var(--db-accent, #5f755d) 24%, transparent) !important",
        },
        ".cm-activeLine": { background: "color-mix(in srgb, var(--db-accent, #5f755d) 6%, transparent)" },
        ".cm-line .tok-heading, .cm-line .tok-heading1, .cm-line .tok-heading2, .cm-line .tok-heading3": {
            color: "var(--editor-type)",
            fontWeight: "700",
        },
        ".cm-line .tok-emphasis": { color: "var(--editor-fg)", fontStyle: "italic" },
        ".cm-line .tok-strong": { color: "var(--editor-fg)", fontWeight: "700" },
        ".cm-line .tok-url, .cm-line .tok-link": { color: "var(--editor-link)" },
        ".cm-line .tok-monospace": { color: "var(--editor-fg)" },
        ".cm-line .tok-string": { color: "var(--editor-string)" },
        ".cm-line .tok-comment": { color: "var(--editor-comment)", fontStyle: "italic" },
        ".cm-line .tok-meta, .cm-line .tok-atom": { color: "var(--editor-number)" },
    },
    { dark: false },
);

function getThemeExtensions(theme: Theme) {
    const highlighting = syntaxHighlighting(editorHighlightStyle);
    return theme === "dark" ? [highlighting, darkTheme] : [highlighting, lightTheme];
}

export function NoteEditor(props: {
    initialValue: string;
    onChange: (value: string) => void;
    placeholder?: string;
    theme: Theme;
}) {
    let container: HTMLDivElement | undefined;
    let view: EditorView | undefined;
    let syncingValue = false;
    const themeCompartment = new Compartment();
    const [drawing, setDrawing] = createSignal<{
        initialScene: ExcalidrawScene | null;
        replaceRange: { from: number; to: number } | null;
    } | null>(null);

    const openDrawing = (editor = view) => {
        if (!editor) return false;
        const selection = editor.state.selection.main;
        const line = editor.state.doc.lineAt(selection.from);
        if (line.text.trim().toLowerCase() === "/draw") {
            editor.dispatch({
                changes: { from: line.from, to: line.to, insert: "" },
                selection: EditorSelection.cursor(line.from),
            });
        }
        const existing = findExcalidrawFenceAt(editor.state, editor.state.selection.main.from);
        setDrawing({
            initialScene: existing?.scene ?? null,
            replaceRange: existing ? { from: existing.from, to: existing.to } : null,
        });
        return true;
    };

    const openDrawingFromSlash = (editor: EditorView) => {
        const selection = editor.state.selection.main;
        if (!selection.empty || editor.state.doc.lineAt(selection.from).text.trim().toLowerCase() !== "/draw") {
            return false;
        }
        return openDrawing(editor);
    };

    const saveDrawing = (fencedBlock: string) => {
        const editor = view;
        const current = drawing();
        if (!editor || !current) return;
        if (current.replaceRange) {
            const { from, to } = current.replaceRange;
            editor.dispatch({
                changes: { from, to, insert: fencedBlock },
                selection: EditorSelection.cursor(from + fencedBlock.length),
            });
        } else {
            const position = editor.state.selection.main.from;
            const line = editor.state.doc.lineAt(position);
            const needsLeadingNewline = line.from !== position || line.text.trim().length > 0;
            const insertion = `${needsLeadingNewline ? "\n" : ""}${fencedBlock}\n`;
            editor.dispatch({
                changes: { from: position, to: position, insert: insertion },
                selection: EditorSelection.cursor(position + insertion.length),
            });
        }
        setDrawing(null);
        editor.focus();
    };

    onSettled(() => {
        if (!container) return;
        const state = EditorState.create({
            doc: props.initialValue,
            extensions: [
                vim(),
                drawSelection(),
                history(),
                markdown({ base: markdownLanguage, codeLanguages: languages }),
                themeCompartment.of(getThemeExtensions(props.theme)),
                cmPlaceholder(props.placeholder ?? "# Start writing…"),
                keymap.of([
                    { key: "Enter", run: openDrawingFromSlash },
                    { key: "Tab", run: openDrawingFromSlash },
                ]),
                keymap.of([...defaultKeymap, ...historyKeymap, ...searchKeymap]),
                EditorView.lineWrapping,
                EditorView.updateListener.of((update) => {
                    if (update.docChanged && !syncingValue) props.onChange(update.state.doc.toString());
                }),
            ],
        });
        view = new EditorView({ state, parent: container });
        return () => view?.destroy();
    });

    createEffect(
        () => props.theme,
        (theme) => {
            view?.dispatch({ effects: themeCompartment.reconfigure(getThemeExtensions(theme)) });
        },
    );

    createEffect(
        () => props.initialValue,
        (value) => {
            if (!view || view.state.doc.toString() === value) return;
            const cursor = Math.min(view.state.selection.main.head, value.length);
            syncingValue = true;
            try {
                view.dispatch({
                    changes: { from: 0, to: view.state.doc.length, insert: value },
                    selection: EditorSelection.cursor(cursor),
                });
            } finally {
                syncingValue = false;
            }
        },
    );

    return (
        <div class="relative h-full min-h-0 overflow-hidden" style={{ background: "var(--db-bg)" }}>
            <div
                ref={container}
                class={
                    props.theme === "light"
                        ? "h-full min-h-0 overflow-hidden"
                        : "notes-editor h-full min-h-0 overflow-hidden"
                }
            />
            <button
                type="button"
                onClick={() => openDrawing()}
                class="absolute bottom-3 right-3 z-10 rounded border px-2.5 py-1.5 text-[11px] uppercase tracking-[0.18em] transition hover:brightness-110"
                style={{
                    "border-color": "var(--db-border, rgba(255,255,255,0.12))",
                    background: "var(--db-panel, rgba(24,24,27,0.9))",
                    color: "var(--db-text3, inherit)",
                }}
            >
                / draw
            </button>
            <Show when={drawing()} keyed>
                {(state) => (
                    <ExcalidrawEditorModal
                        initialScene={state.initialScene}
                        theme={props.theme}
                        onSave={saveDrawing}
                        onClose={() => {
                            setDrawing(null);
                            view?.focus();
                        }}
                    />
                )}
            </Show>
        </div>
    );
}
