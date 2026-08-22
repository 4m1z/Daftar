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
type MermaidApi = (typeof import("mermaid"))["default"];

let mermaidPromise: Promise<MermaidApi> | undefined;
let mermaidQueue = Promise.resolve();
let diagramId = 0;

function getSiteTheme(): DiagramTheme {
    return document.documentElement.dataset.theme === "night" ? "dark" : "light";
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

function queueMermaidRender(block: HTMLElement, source: string) {
    mermaidQueue = mermaidQueue.then(async () => {
        if (!block.isConnected) return;
        try {
            const mermaid = await (mermaidPromise ??= import("mermaid").then((module) => module.default));
            mermaid.initialize({
                startOnLoad: false,
                securityLevel: "strict",
                theme: getSiteTheme() === "dark" ? "dark" : "neutral",
            });
            const { svg, bindFunctions } = await mermaid.render(`mermaid-diagram-${++diagramId}`, source);
            if (!block.isConnected) return;
            block.innerHTML = svg;
            const renderedSvg = block.querySelector("svg");
            renderedSvg?.removeAttribute("height");
            renderedSvg?.setAttribute("role", "img");
            renderedSvg?.setAttribute("aria-label", "Mermaid diagram");
            bindFunctions?.(block);
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

async function renderExcalidrawBlock(block: HTMLElement, source: string, onEdit?: (source: string) => void) {
    const version = (excalidrawRenderVersions.get(block) ?? 0) + 1;
    excalidrawRenderVersions.set(block, version);
    block.replaceChildren();
    try {
        const svg = await renderExcalidraw(source);
        if (!block.isConnected || excalidrawRenderVersions.get(block) !== version) return;
        block.append(svg);
        addExcalidrawEditButton(block, source, onEdit);
    } catch {
        if (block.isConnected && excalidrawRenderVersions.get(block) === version) {
            showDiagramError(block, source, "Excalidraw drawing");
        }
    }
}

function refreshDiagrams(container: HTMLDivElement) {
    for (const block of container.querySelectorAll<HTMLElement>(".mermaid-block")) {
        const source = mermaidSources.get(block);
        if (source) queueMermaidRender(block, source);
    }
    for (const block of container.querySelectorAll<HTMLElement>(".excalidraw-block")) {
        const entry = excalidrawSources.get(block);
        if (entry) void renderExcalidrawBlock(block, entry.source, entry.onEdit);
    }
}

function enhanceDiagrams(container: HTMLDivElement, onEditExcalidraw?: (source: string) => void) {
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
            queueMermaidRender(block, source);
            continue;
        }
        excalidrawSources.set(block, { source, onEdit: onEditExcalidraw });
        void renderExcalidrawBlock(block, source, onEditExcalidraw);
    }
}

export function Markdown(props: { source: string; class?: string; onChange?: (source: string) => void }) {
    let container: HTMLDivElement | undefined;
    let renderVersion = 0;
    let themeObserver: MutationObserver | null = null;
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
            queueMicrotask(() => {
                if (version === renderVersion && container) {
                    enhanceDiagrams(container, editable ? editExcalidraw : undefined);
                    let lastTheme = getSiteTheme();
                    themeObserver ??= new MutationObserver(() => {
                        const theme = getSiteTheme();
                        if (theme === lastTheme || !container) return;
                        lastTheme = theme;
                        refreshDiagrams(container);
                    });
                    themeObserver.observe(document.documentElement, {
                        attributes: true,
                        attributeFilter: ["data-theme", "class"],
                    });
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
