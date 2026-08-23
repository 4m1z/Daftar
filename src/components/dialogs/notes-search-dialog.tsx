import { For, Show, type Accessor } from "solid-js";

import type { SearchResult } from "~/lib/types/notes";
import { notebookColor } from "~/lib/utils/notes";

/** Command-palette style fuzzy search across all notebooks and notes. */
export function NotesSearchDialog(props: {
    open: Accessor<boolean>;
    query: Accessor<string>;
    setQuery: (value: string) => void;
    index: Accessor<number>;
    setIndex: (value: number) => void;
    results: Accessor<SearchResult[]>;
    onSelect: (result: SearchResult) => void;
    onClose: () => void;
    moveIndex: (delta: number) => void;
    registerInput: (element: HTMLInputElement) => void;
}) {
    const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === "ArrowDown") {
            event.preventDefault();
            props.moveIndex(1);
        } else if (event.key === "ArrowUp") {
            event.preventDefault();
            props.moveIndex(-1);
        } else if (event.key === "Enter") {
            event.preventDefault();
            const result = props.results()[props.index()];
            if (result) props.onSelect(result);
        } else if (event.key === "Escape") {
            event.preventDefault();
            props.onClose();
        }
    };

    return (
        <Show when={props.open()}>
            <div
                class={`fixed inset-0 z-50 flex items-start
                    justify-center px-4 pt-[10vh]`}
                style={{ background: "rgba(0, 0, 0, 0.45)" }}
                onMouseDown={(event) => {
                    if (event.target === event.currentTarget) props.onClose();
                }}
                role="dialog"
                aria-modal="true"
                aria-label="Search notes"
            >
                <div
                    class={`flex w-full max-w-[640px] flex-col overflow-hidden
                        rounded-lg border shadow-2xl`}
                    style={{ background: "var(--db-surface)", "border-color": "var(--db-border)" }}
                >
                    <div
                        class="flex items-center gap-2 border-b px-3 py-2.5"
                        style={{ "border-color": "var(--db-border)" }}
                    >
                        <svg
                            viewBox="0 0 16 16"
                            fill="currentColor"
                            class="h-4 w-4 shrink-0"
                            style={{ color: "var(--db-text3)" }}
                        >
                            <path d="M11.5 7a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Zm-.82 4.74a6 6 0 1 1 1.06-1.06l3.04 3.04a.75.75 0 1 1-1.06 1.06l-3.04-3.04Z" />
                        </svg>
                        <input
                            ref={props.registerInput}
                            value={props.query()}
                            onInput={(event) => {
                                props.setQuery(event.currentTarget.value);
                                props.setIndex(0);
                            }}
                            onKeyDown={handleKeyDown}
                            placeholder="Search notebooks and notes (e.g. 'webtech')"
                            class="flex-1 bg-transparent text-[14px] outline-none"
                            style={{ color: "var(--db-text)", "caret-color": "var(--db-accent)" }}
                        />
                        <span class="hidden text-[10px] sm:inline" style={{ color: "var(--db-text3)" }}>
                            Esc to close
                        </span>
                    </div>
                    <div class="max-h-[50vh] overflow-y-auto">
                        <Show
                            when={props.query().trim() !== ""}
                            fallback={
                                <p class="px-4 py-8 text-center text-[12px]" style={{ color: "var(--db-text3)" }}>
                                    Type to search across all notebooks and notes.
                                </p>
                            }
                        >
                            <Show
                                when={props.results().length > 0}
                                fallback={
                                    <p class="px-4 py-8 text-center text-[12px]" style={{ color: "var(--db-text3)" }}>
                                        No matches for{" "}
                                        <span style={{ color: "var(--db-text2)" }}>&quot;{props.query()}&quot;</span>
                                    </p>
                                }
                            >
                                <For each={props.results()}>
                                    {(result, index) => {
                                        const active = () => index() === props.index();
                                        return (
                                            <button
                                                type="button"
                                                onMouseEnter={() => props.setIndex(index())}
                                                onClick={() => props.onSelect(result)}
                                                class={`flex w-full flex-col gap-0.5 border-b
                                                    px-3 py-2 text-left transition-colors`}
                                                style={{
                                                    background: active() ? "var(--db-surface2)" : "transparent",
                                                    "border-color": "var(--db-border)",
                                                }}
                                            >
                                                <div
                                                    class="flex items-center gap-1.5 text-[11px]"
                                                    style={{ color: "var(--db-text3)" }}
                                                >
                                                    <span
                                                        class="h-1.5 w-1.5 shrink-0 rounded-full"
                                                        style={{ background: notebookColor(result.projectColor) }}
                                                    />
                                                    <span class="truncate">{result.projectName}</span>
                                                    <span style={{ color: "var(--db-text3)" }}>›</span>
                                                    <span
                                                        class="truncate"
                                                        style={{
                                                            color: active() ? "var(--db-text) " : "var(--db-text2)",
                                                        }}
                                                    >
                                                        {result.noteTitle}
                                                    </span>
                                                </div>
                                                <p
                                                    class="line-clamp-1 text-[11px]"
                                                    style={{ color: "var(--db-text3)" }}
                                                >
                                                    {result.snippet}
                                                </p>
                                            </button>
                                        );
                                    }}
                                </For>
                            </Show>
                        </Show>
                    </div>
                    <div
                        class={`flex items-center justify-between gap-2 border-t
                            px-3 py-1.5 text-[10px]`}
                        style={{ "border-color": "var(--db-border)", color: "var(--db-text3)" }}
                    >
                        <span>↑↓ navigate · ↵ open</span>
                        <span>
                            {props.results().length} result{props.results().length === 1 ? "" : "s"}
                        </span>
                    </div>
                </div>
            </div>
        </Show>
    );
}
