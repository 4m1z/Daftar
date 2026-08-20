import { Portal } from "@solidjs/web";
import { createSignal, onSettled, Show } from "solid-js";

import type { Theme } from "~/utils/theme";

type ReactRoot = import("react-dom/client").Root;

export type ExcalidrawScene = {
    id?: string;
    type?: string;
    version?: number;
    source?: string;
    elements: unknown[];
    appState?: Record<string, unknown>;
    files?: Record<string, unknown>;
};

function sceneId() {
    if ("randomUUID" in crypto) return crypto.randomUUID();
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function initialData(scene: ExcalidrawScene | null): ExcalidrawScene {
    return {
        id: scene?.id ?? sceneId(),
        type: "excalidraw",
        version: 2,
        source: "my-note-taking-application",
        elements: scene?.elements ?? [],
        appState: scene?.appState ?? { viewBackgroundColor: "#ffffff" },
        files: scene?.files ?? {},
    };
}

function toFencedBlock(scene: ExcalidrawScene) {
    const appState = scene.appState ?? {};
    const persisted = {
        type: "excalidraw",
        id: scene.id ?? sceneId(),
        version: 2,
        source: "my-note-taking-application",
        elements: scene.elements ?? [],
        appState: {
            viewBackgroundColor: appState.viewBackgroundColor ?? "#ffffff",
            gridSize: appState.gridSize ?? null,
        },
        files: scene.files ?? {},
    };
    return ["```excalidraw", JSON.stringify(persisted, null, 2), "```"].join("\n");
}

function sceneFingerprint(scene: ExcalidrawScene) {
    return JSON.stringify({
        elements: scene.elements,
        viewBackgroundColor: scene.appState?.viewBackgroundColor ?? "#ffffff",
        files: scene.files ?? {},
    });
}

export function parseExcalidrawScene(raw: string): { scene: ExcalidrawScene } | { error: string } {
    const trimmed = raw.trim();
    if (!trimmed) return { error: "Excalidraw scene is empty" };
    try {
        const parsed = JSON.parse(trimmed) as unknown;
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
            return { error: "Excalidraw scene must be a JSON object" };
        }
        const scene = parsed as ExcalidrawScene;
        if (!Array.isArray(scene.elements)) return { error: "Excalidraw scene needs an elements array" };
        return { scene };
    } catch (error) {
        return { error: error instanceof Error ? error.message : String(error) };
    }
}

export function replaceExcalidrawFence(content: string, rawScene: string, replacement: string) {
    const wanted = rawScene.trim().replace(/\r\n/g, "\n");
    const fence = /```excalidraw[^\S\r\n]*\r?\n([\s\S]*?)\r?\n```/gi;
    for (const match of content.matchAll(fence)) {
        const body = (match[1] ?? "").trim().replace(/\r\n/g, "\n");
        if (body !== wanted || match.index === undefined) continue;
        return `${content.slice(0, match.index)}${replacement}${content.slice(match.index + match[0].length)}`;
    }
    return null;
}

export function ExcalidrawEditorModal(props: {
    initialScene: ExcalidrawScene | null;
    theme: Theme;
    onSave: (fencedBlock: string) => void;
    onClose: () => void;
}) {
    let host: HTMLDivElement | undefined;
    let reactRoot: ReactRoot | undefined;
    const startingScene = initialData(props.initialScene);
    const startingFingerprint = sceneFingerprint(startingScene);
    let scene = startingScene;
    let dirty = false;
    const [loading, setLoading] = createSignal(true);
    const [loadError, setLoadError] = createSignal("");

    const requestClose = () => {
        if (dirty && !window.confirm("Discard your unsaved drawing changes?")) return;
        props.onClose();
    };

    onSettled(() => {
        let cancelled = false;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key !== "Escape") return;
            event.stopPropagation();
            requestClose();
        };
        window.addEventListener("keydown", handleKeyDown, true);

        void Promise.all([
            import("react"),
            import("react-dom/client"),
            import("@excalidraw/excalidraw"),
            import("@excalidraw/excalidraw/index.css"),
        ])
            .then(([React, ReactDom, ExcalidrawModule]) => {
                if (cancelled || !host) return;
                reactRoot = ReactDom.createRoot(host);
                reactRoot.render(
                    React.createElement(ExcalidrawModule.Excalidraw, {
                        initialData: startingScene as never,
                        theme: props.theme,
                        viewModeEnabled: false,
                        zenModeEnabled: false,
                        gridModeEnabled: false,
                        onChange: (elements, appState, files) => {
                            scene = {
                                ...scene,
                                elements: [...elements],
                                appState: appState as unknown as Record<string, unknown>,
                                files: files as unknown as Record<string, unknown>,
                            };
                            dirty = sceneFingerprint(scene) !== startingFingerprint;
                        },
                        UIOptions: {
                            canvasActions: {
                                changeViewBackgroundColor: true,
                                clearCanvas: true,
                                export: false,
                                loadScene: false,
                                saveToActiveFile: false,
                                toggleTheme: false,
                            },
                        },
                    }),
                );
                setLoading(false);
            })
            .catch((error: unknown) => {
                if (cancelled) return;
                setLoading(false);
                setLoadError(error instanceof Error ? error.message : String(error));
            });

        return () => {
            cancelled = true;
            document.body.style.overflow = previousOverflow;
            window.removeEventListener("keydown", handleKeyDown, true);
            reactRoot?.unmount();
        };
    });

    return (
        <Portal>
            <div
                class="fixed inset-0 z-[9999] flex flex-col bg-black/70 backdrop-blur-sm"
                role="dialog"
                aria-modal="true"
                aria-labelledby="excalidraw-editor-title"
            >
                <header
                    class="flex items-center justify-between gap-4 border-b px-4 py-3"
                    style={{
                        background: "var(--db-surface, #ffffff)",
                        color: "var(--db-text, #0f172a)",
                        "border-color": "var(--db-border, #e2e8f0)",
                    }}
                >
                    <div>
                        <h2 id="excalidraw-editor-title" class="text-sm font-semibold">
                            Draw
                        </h2>
                        <p class="db-text3 mt-0.5 text-[11px]">
                            Sketch freely with pen, shapes, text, and arrows. Esc cancels.
                        </p>
                    </div>
                    <div class="flex shrink-0 items-center gap-2">
                        <button
                            type="button"
                            onClick={requestClose}
                            class="rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-[var(--db-surface2)]"
                            style={{ "border-color": "var(--db-border)" }}
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={() => props.onSave(toFencedBlock(scene))}
                            disabled={loading() || !!loadError()}
                            class="rounded-md px-3 py-1.5 text-xs font-semibold text-white transition-opacity disabled:opacity-40"
                            style={{ background: "var(--db-accent, #2563eb)" }}
                        >
                            Save to note
                        </button>
                    </div>
                </header>
                <div class="relative min-h-0 flex-1 bg-white">
                    <div ref={host} class="h-full w-full" />
                    <Show when={loading()}>
                        <div class="absolute inset-0 grid place-items-center bg-white text-sm text-zinc-500">
                            Loading Excalidraw…
                        </div>
                    </Show>
                    <Show when={loadError()}>
                        {(message) => (
                            <div class="absolute inset-0 grid place-items-center bg-white p-6 text-center text-sm text-red-700">
                                Could not load Excalidraw: {message()}
                            </div>
                        )}
                    </Show>
                </div>
            </div>
        </Portal>
    );
}
