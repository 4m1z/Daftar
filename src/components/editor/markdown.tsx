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

const SVG_NS = "http://www.w3.org/2000/svg";

type DiagramTheme = "light" | "dark";
type Point = [number, number];
type ExcalidrawElement = {
    id?: string;
    type?: string;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    angle?: number;
    strokeColor?: string;
    backgroundColor?: string;
    strokeWidth?: number;
    strokeStyle?: string;
    opacity?: number;
    roundness?: unknown;
    points?: Point[];
    text?: string;
    fontSize?: number;
    fontFamily?: number;
    textAlign?: string;
    lineHeight?: number;
    startArrowhead?: string | null;
    endArrowhead?: string | null;
    fileId?: string;
    isDeleted?: boolean;
};
type ExcalidrawPreviewScene = {
    elements?: ExcalidrawElement[];
    appState?: { viewBackgroundColor?: string };
    files?: Record<string, { dataURL?: string }>;
};
type MermaidApi = (typeof import("mermaid"))["default"];

let mermaidPromise: Promise<MermaidApi> | undefined;
let mermaidQueue = Promise.resolve();
let diagramId = 0;

function svgElement<K extends keyof SVGElementTagNameMap>(name: K) {
    return document.createElementNS(SVG_NS, name);
}

function number(value: number | undefined, fallback = 0) {
    return Number.isFinite(value) ? (value as number) : fallback;
}

function rotatePoint([x, y]: Point, centerX: number, centerY: number, angle: number): Point {
    if (!angle) return [x, y];
    const cosine = Math.cos(angle);
    const sine = Math.sin(angle);
    const offsetX = x - centerX;
    const offsetY = y - centerY;
    return [centerX + offsetX * cosine - offsetY * sine, centerY + offsetX * sine + offsetY * cosine];
}

function getElementPoints(element: ExcalidrawElement): Point[] {
    const x = number(element.x);
    const y = number(element.y);
    const width = number(element.width);
    const height = number(element.height);
    const centerX = x + width / 2;
    const centerY = y + height / 2;
    const angle = number(element.angle);
    const points = element.points?.length
        ? element.points.map(([pointX, pointY]) => [x + pointX, y + pointY] as Point)
        : ([
              [x, y],
              [x + width, y],
              [x + width, y + height],
              [x, y + height],
          ] as Point[]);
    return points.map((point) => rotatePoint(point, centerX, centerY, angle));
}

type Rgb = [number, number, number];

function hexToRgb(hex: string): Rgb {
    let clean = hex.trim().replace(/^#/, "");
    if (clean.length === 3) clean = clean.split("").map((c) => c + c).join("");
    const value = parseInt(clean, 16);
    if (!Number.isFinite(value) || clean.length !== 6) return [0, 0, 0];
    return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function rgbToHex([r, g, b]: Rgb) {
    return `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`;
}

function rgbToHsl([r, g, b]: Rgb): [number, number, number] {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;
    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r:
                h = (g - b) / d + (g < b ? 6 : 0);
                break;
            case g:
                h = (b - r) / d + 2;
                break;
            default:
                h = (r - g) / d + 4;
        }
        h /= 6;
    }
    return [h, s, l];
}

function hslToRgb([h, s, l]: [number, number, number]): Rgb {
    if (s === 0) {
        const gray = l * 255;
        return [gray, gray, gray];
    }
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    const channel = (t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
    };
    return [channel(h + 1 / 3) * 255, channel(h) * 255, channel(h - 1 / 3) * 255];
}

/** Light-theme stroke/text colors mapped to their dark-theme equivalents (Excalidraw palette tints). */
const STROKE_TO_DARK: Record<string, string> = {
    "#1e1e1e": "#ffffff",
    "#495057": "#ced4da",
    "#868e96": "#adb5bd",
    "#adb5bd": "#868e96",
    "#ced4da": "#495057",
    "#e03131": "#ffc9c9",
    "#c92a2a": "#ffa8a8",
    "#f783ac": "#ffdeeb",
    "#c2255c": "#fcc2d7",
    "#be4bdb": "#f3d9fa",
    "#9c36b5": "#eebefa",
    "#7048e8": "#e5dbff",
    "#5f3dc4": "#d0bfff",
    "#4263eb": "#dbe4ff",
    "#364fc7": "#bac8ff",
    "#1c7ed6": "#a5d8ff",
    "#1971c2": "#74c0fc",
    "#1098ad": "#99e9f2",
    "#0b7285": "#66d9e8",
    "#12b886": "#96f2d7",
    "#087f5b": "#63e6be",
    "#2f9e44": "#b2f2bb",
    "#2b8a3e": "#8ce99a",
    "#94d82d": "#e9fac8",
    "#5c940d": "#d8f5a2",
    "#fcc419": "#fff3bf",
    "#e67700": "#ffe066",
    "#fd7e14": "#ffd8a8",
    "#e8590c": "#ffc078",
};

/** Light-theme fill/canvas colors mapped to their dark-theme equivalents. */
const FILL_TO_DARK: Record<string, string> = {
    "#ffffff": "#1e1e1e",
    "#f8f9fa": "#212529",
    "#f1f3f5": "#212529",
    "#e9ecef": "#343a40",
    "#ced4da": "#495057",
    "#adb5bd": "#495057",
    "#868e96": "#343a40",
    "#fff9db": "#3a3214",
    "#ffec99": "#453a16",
    "#ffe066": "#4f4115",
    "#fff3bf": "#3a3614",
    "#f3f0ff": "#2c2547",
    "#e5dbff": "#332b52",
    "#d0bfff": "#3a3160",
    "#ffc9c9": "#3f2626",
    "#ffa8a8": "#4a2d2d",
    "#ffdeeb": "#402533",
    "#fcc2d7": "#4a2b3f",
    "#f3d9fa": "#382747",
    "#eebefa": "#452e58",
    "#ffd8a8": "#3f2f1d",
    "#ffc078": "#4a3820",
    "#99e9f2": "#1e353d",
    "#66d9e8": "#254049",
    "#96f2d7": "#1e3a2f",
    "#63e6be": "#254336",
    "#b2f2bb": "#233a26",
    "#8ce99a": "#2a452e",
    "#e9fac8": "#2a3a1e",
    "#d8f5a2": "#33451f",
    "#a5d8ff": "#1f3549",
    "#74c0fc": "#274052",
    "#dbe4ff": "#232f49",
    "#bac8ff": "#2c3a5c",
};

function invertMap(map: Record<string, string>) {
    const inverted: Record<string, string> = {};
    for (const [light, dark] of Object.entries(map)) inverted[dark] = light;
    return inverted;
}

const STROKE_TO_LIGHT = invertMap(STROKE_TO_DARK);
const FILL_TO_LIGHT = invertMap(FILL_TO_DARK);

function remapColor(color: string, sceneTheme: DiagramTheme, siteTheme: DiagramTheme, role: "stroke" | "fill") {
    if (sceneTheme === siteTheme) return color;
    const key = color.trim().toLowerCase();
    if (key === "transparent" || key === "none" || !key.startsWith("#")) return color;
    const table =
        sceneTheme === "light" ? (role === "stroke" ? STROKE_TO_DARK : FILL_TO_DARK) : (role === "stroke" ? STROKE_TO_LIGHT : FILL_TO_LIGHT);
    const mapped = table[key];
    if (mapped) return mapped;
    const [h, s, l] = rgbToHsl(hexToRgb(color));
    const lightness =
        sceneTheme === "light"
            ? role === "fill"
                ? Math.max(0.09, l * 0.22)
                : Math.min(0.9, l * 0.35 + 0.58)
            : role === "fill"
              ? Math.min(0.95, l * 0.5 + 0.45)
              : Math.max(0.12, l * 0.4);
    return rgbToHex(hslToRgb([h, Math.min(1, s * 0.85), lightness]));
}

function detectSceneTheme(scene: ExcalidrawPreviewScene): DiagramTheme {
    const canvas = scene.appState?.viewBackgroundColor;
    if (canvas && canvas !== "transparent") {
        const [, , lightness] = rgbToHsl(hexToRgb(canvas));
        if (lightness < 0.5) return "dark";
    }
    let lightStrokes = 0;
    let darkStrokes = 0;
    for (const element of scene.elements ?? []) {
        if (!element.strokeColor) continue;
        const [, , lightness] = rgbToHsl(hexToRgb(element.strokeColor));
        if (lightness > 0.7) lightStrokes += 1;
        else darkStrokes += 1;
    }
    return lightStrokes > darkStrokes ? "dark" : "light";
}

function getSiteTheme(): DiagramTheme {
    return document.documentElement.dataset.theme === "night" ? "dark" : "light";
}

type MapColor = (color: string, role: "stroke" | "fill") => string;

function applyElementStyle(shape: SVGElement, element: ExcalidrawElement, fill: boolean, map: MapColor) {
    shape.setAttribute("stroke", map(element.strokeColor || "#1e1e1e", "stroke"));
    shape.setAttribute("stroke-width", String(Math.max(1, number(element.strokeWidth, 1))));
    shape.setAttribute("stroke-linecap", "round");
    shape.setAttribute("stroke-linejoin", "round");
    if (element.strokeStyle === "dashed") shape.setAttribute("stroke-dasharray", "8 6");
    if (element.strokeStyle === "dotted") shape.setAttribute("stroke-dasharray", "2 6");
    const background = element.backgroundColor;
    shape.setAttribute("fill", fill && background && background !== "transparent" ? map(background, "fill") : "none");
}

function addArrowMarker(defs: SVGDefsElement, element: ExcalidrawElement, markerPosition: "start" | "end", map: MapColor) {
    const marker = svgElement("marker");
    const markerId = `excalidraw-arrow-${markerPosition}-${++diagramId}`;
    marker.setAttribute("id", markerId);
    marker.setAttribute("viewBox", "0 0 10 10");
    marker.setAttribute("refX", markerPosition === "end" ? "9" : "1");
    marker.setAttribute("refY", "5");
    marker.setAttribute("markerWidth", "8");
    marker.setAttribute("markerHeight", "8");
    marker.setAttribute("orient", "auto-start-reverse");
    const arrow = svgElement("path");
    arrow.setAttribute("d", "M 0 0 L 10 5 L 0 10 z");
    arrow.setAttribute("fill", map(element.strokeColor || "#1e1e1e", "stroke"));
    marker.append(arrow);
    defs.append(marker);
    return markerId;
}

function renderExcalidraw(source: string, siteTheme: DiagramTheme = getSiteTheme()) {
    const scene = JSON.parse(source) as ExcalidrawPreviewScene;
    const sceneTheme = detectSceneTheme(scene);
    const map: MapColor = (color, role) => remapColor(color, sceneTheme, siteTheme, role);
    const elements = (scene.elements ?? []).filter((element) => !element.isDeleted && element.type);
    if (!elements.length) throw new Error("The Excalidraw scene has no visible elements.");

    const allPoints = elements.flatMap(getElementPoints);
    const padding = 24;
    const minX = Math.min(...allPoints.map(([x]) => x)) - padding;
    const minY = Math.min(...allPoints.map(([, y]) => y)) - padding;
    const maxX = Math.max(...allPoints.map(([x]) => x)) + padding;
    const maxY = Math.max(...allPoints.map(([, y]) => y)) + padding;
    const sceneWidth = Math.max(1, maxX - minX);
    const sceneHeight = Math.max(1, maxY - minY);
    const svg = svgElement("svg");
    const defs = svgElement("defs");
    svg.setAttribute("viewBox", `${minX} ${minY} ${sceneWidth} ${sceneHeight}`);
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", "Excalidraw drawing");
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    svg.append(defs);

    const background = svgElement("rect");
    background.setAttribute("x", String(minX));
    background.setAttribute("y", String(minY));
    background.setAttribute("width", String(sceneWidth));
    background.setAttribute("height", String(sceneHeight));
    background.setAttribute("fill", map(scene.appState?.viewBackgroundColor || "transparent", "fill"));
    svg.append(background);

    for (const element of elements) {
        const type = element.type;
        const x = number(element.x);
        const y = number(element.y);
        const width = number(element.width);
        const height = number(element.height);
        const group = svgElement("g");
        const angle = number(element.angle);
        if (angle) {
            group.setAttribute("transform", `rotate(${(angle * 180) / Math.PI} ${x + width / 2} ${y + height / 2})`);
        }
        group.setAttribute("opacity", String(Math.min(100, Math.max(0, number(element.opacity, 100))) / 100));

        if (type === "rectangle" || type === "frame" || type === "embeddable") {
            const rectangle = svgElement("rect");
            rectangle.setAttribute("x", String(Math.min(x, x + width)));
            rectangle.setAttribute("y", String(Math.min(y, y + height)));
            rectangle.setAttribute("width", String(Math.abs(width)));
            rectangle.setAttribute("height", String(Math.abs(height)));
            if (element.roundness)
                rectangle.setAttribute("rx", String(Math.min(12, Math.abs(width) / 8, Math.abs(height) / 8)));
            applyElementStyle(rectangle, element, true, map);
            group.append(rectangle);
        } else if (type === "diamond") {
            const diamond = svgElement("polygon");
            diamond.setAttribute(
                "points",
                `${x + width / 2},${y} ${x + width},${y + height / 2} ${x + width / 2},${y + height} ${x},${y + height / 2}`,
            );
            applyElementStyle(diamond, element, true, map);
            group.append(diamond);
        } else if (type === "ellipse") {
            const ellipse = svgElement("ellipse");
            ellipse.setAttribute("cx", String(x + width / 2));
            ellipse.setAttribute("cy", String(y + height / 2));
            ellipse.setAttribute("rx", String(Math.abs(width / 2)));
            ellipse.setAttribute("ry", String(Math.abs(height / 2)));
            applyElementStyle(ellipse, element, true, map);
            group.append(ellipse);
        } else if (type === "line" || type === "arrow" || type === "freedraw" || type === "draw") {
            const line = svgElement("polyline");
            line.setAttribute(
                "points",
                (element.points ?? []).map(([pointX, pointY]) => `${x + pointX},${y + pointY}`).join(" "),
            );
            applyElementStyle(line, element, false, map);
            if (type === "arrow" && element.startArrowhead) {
                line.setAttribute("marker-start", `url(#${addArrowMarker(defs, element, "start", map)})`);
            }
            if (type === "arrow" && element.endArrowhead !== null) {
                line.setAttribute("marker-end", `url(#${addArrowMarker(defs, element, "end", map)})`);
            }
            group.append(line);
        } else if (type === "text") {
            const text = svgElement("text");
            const fontSize = Math.max(8, number(element.fontSize, 20));
            const textAlign = element.textAlign || "left";
            text.setAttribute(
                "x",
                String(textAlign === "center" ? x + width / 2 : textAlign === "right" ? x + width : x),
            );
            text.setAttribute("y", String(y));
            text.setAttribute("fill", map(element.strokeColor || "#1e1e1e", "stroke"));
            text.setAttribute("font-size", String(fontSize));
            text.setAttribute(
                "font-family",
                element.fontFamily === 3
                    ? "monospace"
                    : element.fontFamily === 1
                      ? "Comic Sans MS, cursive"
                      : "Arial, sans-serif",
            );
            text.setAttribute(
                "text-anchor",
                textAlign === "center" ? "middle" : textAlign === "right" ? "end" : "start",
            );
            text.setAttribute("dominant-baseline", "hanging");
            (element.text || "").split("\n").forEach((line, index) => {
                const span = svgElement("tspan");
                span.setAttribute("x", text.getAttribute("x") || String(x));
                span.setAttribute("dy", index === 0 ? "0" : `${number(element.lineHeight, 1.25)}em`);
                span.textContent = line || " ";
                text.append(span);
            });
            group.append(text);
        } else if (type === "image" && element.fileId) {
            const dataUrl = scene.files?.[element.fileId]?.dataURL;
            if (dataUrl) {
                const image = svgElement("image");
                image.setAttribute("x", String(x));
                image.setAttribute("y", String(y));
                image.setAttribute("width", String(width));
                image.setAttribute("height", String(height));
                image.setAttribute("href", dataUrl);
                image.setAttribute("preserveAspectRatio", "none");
                group.append(image);
            }
        }
        svg.append(group);
    }
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
            mermaid.initialize({ startOnLoad: false, securityLevel: "strict", theme: "neutral" });
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

function renderExcalidrawBlock(block: HTMLElement, source: string, onEdit?: (source: string) => void) {
    block.replaceChildren();
    try {
        block.append(renderExcalidraw(source));
        addExcalidrawEditButton(block, source, onEdit);
    } catch {
        showDiagramError(block, source, "Excalidraw drawing");
    }
}

function refreshDiagrams(container: HTMLDivElement) {
    for (const block of container.querySelectorAll<HTMLElement>(".excalidraw-block")) {
        const entry = excalidrawSources.get(block);
        if (entry) renderExcalidrawBlock(block, entry.source, entry.onEdit);
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
            queueMermaidRender(block, source);
            continue;
        }
        excalidrawSources.set(block, { source, onEdit: onEditExcalidraw });
        renderExcalidrawBlock(block, source, onEditExcalidraw);
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
