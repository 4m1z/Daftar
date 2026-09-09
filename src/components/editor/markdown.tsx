import hljs from "highlight.js/lib/common";
import { marked } from "marked";
import { markedHighlight } from "marked-highlight";
import { createEffect, createMemo, createSignal, onCleanup, Show } from "solid-js";

import {
    ExcalidrawEditorModal,
    parseExcalidrawScene,
    replaceExcalidrawFence,
    type ExcalidrawScene,
} from "~/components/editor/excalidraw-editor-modal";

marked.use({ gfm: true, breaks: false });
marked.use(
    markedHighlight({
        langPrefix: "hljs language-",
        highlight(code, language) {
            const normalized = language.trim().toLowerCase();
            const target = hljs.getLanguage(normalized) ? normalized : "plaintext";
            return hljs.highlight(code, { language: target }).value;
        },
    }),
);

type DiagramTheme = "light" | "dark";
type DiagramLanguage = "mermaid" | "excalidraw";
type MermaidApi = (typeof import("mermaid"))["default"];

let mermaidPromise: Promise<MermaidApi> | undefined;
let mermaidQueue = Promise.resolve();
let diagramId = 0;

function getSiteTheme(): DiagramTheme {
    return document.documentElement.dataset.theme === "night" ? "dark" : "light";
}

// Bounded cache of rendered diagram markup, keyed by language + theme +
// source. The preview re-parses the whole note on every (debounced) keystroke,
// which destroys all diagram DOM nodes. Seeding freshly parsed blocks from
// this cache keeps unchanged diagrams on screen instead of flashing an empty
// box while the async renderer catches up.
const diagramMarkupCache = new Map<string, string>();
const MAX_DIAGRAM_CACHE_ENTRIES = 30;

export function diagramCacheKey(language: DiagramLanguage, source: string, theme: DiagramTheme) {
    return `${language}\n${theme}\n${source}`;
}

export function getCachedDiagramMarkup(language: DiagramLanguage, source: string, theme: DiagramTheme) {
    return diagramMarkupCache.get(diagramCacheKey(language, source, theme));
}

export function setCachedDiagramMarkup(language: DiagramLanguage, source: string, theme: DiagramTheme, markup: string) {
    const key = diagramCacheKey(language, source, theme);
    // Re-insert to keep eviction order recency-based.
    if (diagramMarkupCache.has(key)) diagramMarkupCache.delete(key);
    diagramMarkupCache.set(key, markup);
    while (diagramMarkupCache.size > MAX_DIAGRAM_CACHE_ENTRIES) {
        const oldest = diagramMarkupCache.keys().next();
        if (oldest.done) break;
        diagramMarkupCache.delete(oldest.value);
    }
}

export function clearDiagramMarkupCache() {
    diagramMarkupCache.clear();
}

async function renderExcalidraw(source: string, siteTheme: DiagramTheme = getSiteTheme()) {
    const { exportToSvg, getNonDeletedElements, restore } = await import("@excalidraw/excalidraw");
    const restored = restore(JSON.parse(source), null, null);
    const svg = await exportToSvg({
        elements: getNonDeletedElements(restored.elements),
        appState: {
            ...restored.appState,
            exportBackground: true,
            exportWithDarkMode: siteTheme === "dark",
        },
        files: restored.files,
        exportPadding: 24,
    });
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", "Excalidraw drawing");
    return svg;
}

function showDiagramError(block: HTMLElement, source: string, label: string) {
    const message = document.createElement("p");
    message.className = "diagram-error-label";
    message.textContent = `${label} could not be rendered. Showing the source instead.`;
    const pre = document.createElement("pre");
    const code = document.createElement("code");
    code.textContent = source;
    pre.append(code);
    block.classList.add("diagram-error");
    block.replaceChildren(message, pre);
}

function queueMermaidRender(block: HTMLElement, source: string, theme: DiagramTheme) {
    // Seed from cache so the diagram stays visible (instead of an empty box)
    // until the fresh render below swaps in seamlessly.
    const cached = getCachedDiagramMarkup("mermaid", source, theme);
    if (cached) block.innerHTML = cached;
    mermaidQueue = mermaidQueue.then(async () => {
        if (!block.isConnected) return;
        try {
            const mermaid = await (mermaidPromise ??= import("mermaid").then((module) => module.default));
            mermaid.initialize({
                startOnLoad: false,
                securityLevel: "strict",
                theme: theme === "dark" ? "dark" : "neutral",
            });
            const { svg, bindFunctions } = await mermaid.render(`mermaid-diagram-${++diagramId}`, source);
            if (!block.isConnected) return;
            block.innerHTML = svg;
            const renderedSvg = block.querySelector("svg");
            renderedSvg?.removeAttribute("height");
            renderedSvg?.setAttribute("role", "img");
            renderedSvg?.setAttribute("aria-label", "Mermaid diagram");
            bindFunctions?.(block);
            setCachedDiagramMarkup("mermaid", source, theme, block.innerHTML);
        } catch {
            if (block.isConnected) showDiagramError(block, source, "Mermaid diagram");
        }
    });
}

function addExcalidrawEditButton(block: HTMLElement, source: string, onEdit?: (source: string) => void) {
    if (!onEdit) return;
    block.classList.add("excalidraw-editable");
    const button = document.createElement("button");
    button.type = "button";
    button.className = "excalidraw-edit-button";
    button.textContent = "Edit drawing";
    button.addEventListener("click", () => onEdit(source));
    block.prepend(button);
}

const excalidrawSources = new WeakMap<HTMLElement, { source: string; onEdit?: (source: string) => void }>();
const mermaidSources = new WeakMap<HTMLElement, string>();
const excalidrawRenderVersions = new WeakMap<HTMLElement, number>();

async function renderExcalidrawBlock(
    block: HTMLElement,
    source: string,
    onEdit?: (source: string) => void,
    theme: DiagramTheme = getSiteTheme(),
) {
    const version = (excalidrawRenderVersions.get(block) ?? 0) + 1;
    excalidrawRenderVersions.set(block, version);
    // Deliberately no clearing here: the previous rendering (or a cached seed)
    // stays visible until the fresh SVG is ready, so edits elsewhere in the
    // note never flash an empty drawing box.
    try {
        const svg = await renderExcalidraw(source, theme);
        if (!block.isConnected || excalidrawRenderVersions.get(block) !== version) return;
        setCachedDiagramMarkup("excalidraw", source, theme, svg.outerHTML);
        block.replaceChildren(svg);
        addExcalidrawEditButton(block, source, onEdit);
    } catch {
        if (block.isConnected && excalidrawRenderVersions.get(block) === version) {
            showDiagramError(block, source, "Excalidraw drawing");
        }
    }
}

function refreshDiagrams(container: HTMLDivElement) {
    const theme = getSiteTheme();
    for (const block of container.querySelectorAll<HTMLElement>(".mermaid-block")) {
        const source = mermaidSources.get(block);
        if (source) queueMermaidRender(block, source, theme);
    }
    for (const block of container.querySelectorAll<HTMLElement>(".excalidraw-block")) {
        const entry = excalidrawSources.get(block);
        if (!entry) continue;
        // Same-theme output is deterministic, so a cache hit swaps instantly
        // with no async gap at all.
        const cached = getCachedDiagramMarkup("excalidraw", entry.source, theme);
        if (cached) {
            excalidrawRenderVersions.set(block, (excalidrawRenderVersions.get(block) ?? 0) + 1);
            block.innerHTML = cached;
            addExcalidrawEditButton(block, entry.source, entry.onEdit);
            continue;
        }
        void renderExcalidrawBlock(block, entry.source, entry.onEdit, theme);
    }
}

function enhanceDiagrams(container: HTMLDivElement, onEditExcalidraw?: (source: string) => void) {
    const theme = getSiteTheme();
    for (const code of container.querySelectorAll<HTMLPreElement>("pre > code")) {
        const source = code.textContent || "";
        const language = [...code.classList]
            .find((name) => name.startsWith("language-"))
            ?.slice(9)
            .toLowerCase();
        if (language !== "mermaid" && language !== "excalidraw") continue;
        const pre = code.parentElement;
        if (!pre) continue;
        const block = document.createElement("div");
        block.className = language === "mermaid" ? "mermaid-block" : "excalidraw-block";
        pre.replaceWith(block);
        if (language === "mermaid") {
            mermaidSources.set(block, source);
            queueMermaidRender(block, source, theme);
            continue;
        }
        excalidrawSources.set(block, { source, onEdit: onEditExcalidraw });
        // Excalidraw output is deterministic per (source, theme): a cache hit
        // renders synchronously, so typing elsewhere in the note never
        // re-renders (or flashes) an unchanged drawing.
        const cached = getCachedDiagramMarkup("excalidraw", source, theme);
        if (cached) {
            block.innerHTML = cached;
            addExcalidrawEditButton(block, source, onEditExcalidraw);
            continue;
        }
        void renderExcalidrawBlock(block, source, onEditExcalidraw, theme);
    }
}

export function Markdown(props: { source: string; class?: string; onChange?: (source: string) => void }) {
    let container: HTMLDivElement | undefined;
    let renderVersion = 0;
    let themeObserver: MutationObserver | null = null;
    let lastTheme: DiagramTheme | null = null;
    const html = createMemo(() => marked.parse(props.source) as string);
    const [editingDrawing, setEditingDrawing] = createSignal<{ source: string; scene: ExcalidrawScene } | null>(null);

    const editExcalidraw = (source: string) => {
        const parsed = parseExcalidrawScene(source);
        if ("error" in parsed) return;
        setEditingDrawing({ source, scene: parsed.scene });
    };

    const saveExcalidraw = (fencedBlock: string) => {
        const editing = editingDrawing();
        if (!editing) return;
        const updated = replaceExcalidrawFence(props.source, editing.source, fencedBlock);
        if (updated !== null) props.onChange?.(updated);
        setEditingDrawing(null);
    };

    createEffect(
        () => props.source,
        () => {
            const editable = !!props.onChange;
            const version = ++renderVersion;
            // Observe once per component instance. The callback reads the
            // current container/lastTheme through this closure, so later
            // renders never leave it watching with a stale theme value.
            if (!themeObserver && typeof MutationObserver !== "undefined") {
                themeObserver = new MutationObserver(() => {
                    if (!container) return;
                    const theme = getSiteTheme();
                    if (theme === lastTheme) return;
                    lastTheme = theme;
                    refreshDiagrams(container);
                });
                themeObserver.observe(document.documentElement, {
                    attributes: true,
                    attributeFilter: ["data-theme", "class"],
                });
            }
            queueMicrotask(() => {
                if (version === renderVersion && container) {
                    lastTheme = getSiteTheme();
                    enhanceDiagrams(container, editable ? editExcalidraw : undefined);
                }
            });
            return () => {
                renderVersion += 1;
            };
        },
    );
    onCleanup(() => {
        renderVersion += 1;
        themeObserver?.disconnect();
        themeObserver = null;
    });

    return (
        <>
            <div ref={container} class={props.class ?? "md-preview"} innerHTML={html()} />
            <Show when={editingDrawing()} keyed>
                {(editing) => (
                    <ExcalidrawEditorModal
                        initialScene={editing.scene}
                        theme={document.documentElement.classList.contains("dashboard-dark") ? "dark" : "light"}
                        onSave={saveExcalidraw}
                        onClose={() => setEditingDrawing(null)}
                    />
                )}
            </Show>
        </>
    );
}
