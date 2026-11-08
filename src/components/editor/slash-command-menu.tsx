import { createEffect, For, onSettled, Show } from "solid-js";

import { getFilteredCommands } from "~/components/editor/slash-commands";

/** Floating slash-command list. Keyboard handling lives in the editor keymap. */
export function SlashCommandMenu(props: {
    query: string;
    position: { top: number; left: number } | null;
    selectedIndex: number;
    onSelect: (command: ReturnType<typeof getFilteredCommands>[number]) => void;
    onHover: (index: number) => void;
    onClose: () => void;
}) {
    let menuRef: HTMLDivElement | undefined;

    const filteredCommands = () => getFilteredCommands(props.query);

    // Click outside closes without stealing the click that selected a command.
    onSettled(() => {
        const handlePointerDown = (event: PointerEvent) => {
            if (!menuRef?.contains(event.target as Node)) props.onClose();
        };
        document.addEventListener("pointerdown", handlePointerDown);
        return () => document.removeEventListener("pointerdown", handlePointerDown);
    });

    // Keep the active row visible while navigating with the keyboard.
    createEffect(
        () => props.selectedIndex,
        (index) => {
            menuRef
                ?.querySelector<HTMLElement>(`[data-command-index="${index}"]`)
                ?.scrollIntoView({ block: "nearest" });
        },
    );

    return (
        <Show when={props.position}>
            {(position) => (
                <div
                    ref={menuRef}
                    class="slash-command-menu fixed z-50 w-72 max-w-[calc(100vw-1rem)] rounded-xl border shadow-2xl"
                    style={{
                        top: `${position().top}px`,
                        left: `${position().left}px`,
                        background: "var(--db-surface)",
                        "border-color": "var(--db-border)",
                        color: "var(--db-text)",
                    }}
                    role="dialog"
                    aria-label="Command menu"
                >
                    <div
                        class="flex items-center gap-2 border-b px-3 py-2.5"
                        style={{ "border-color": "var(--db-border)" }}
                    >
                        <span class="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--db-text3)" }}>
                            Slash Command
                        </span>
                        <span class="ml-auto text-[10px] font-medium" style={{ color: "var(--db-text3)" }}>
                            {filteredCommands().length} result{filteredCommands().length !== 1 ? "s" : ""}
                        </span>
                    </div>

                    <div class="max-h-[320px] overflow-y-auto p-1">
                        <Show
                            when={filteredCommands().length > 0}
                            fallback={
                                <div class="py-6 text-center">
                                    <p class="text-[13px] font-medium" style={{ color: "var(--db-text2)" }}>
                                        No commands found
                                    </p>
                                    <p class="mt-1 text-[11px]" style={{ color: "var(--db-text3)" }}>
                                        Try a different search term
                                    </p>
                                </div>
                            }
                        >
                            <For each={filteredCommands()}>
                                {(command, index) => {
                                    const selected = () => index() === props.selectedIndex;
                                    return (
                                        <>
                                            <Show
                                                when={
                                                    index() === 0 ||
                                                    filteredCommands()[index() - 1]?.category !== command.category
                                                }
                                            >
                                                <div
                                                    class="sticky top-0 z-10 px-2.5 pt-1.5 pb-1 text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm"
                                                    style={{
                                                        color: "var(--db-text3)",
                                                        background:
                                                            "color-mix(in srgb, var(--db-surface) 85%, transparent)",
                                                    }}
                                                >
                                                    {command.category}
                                                </div>
                                            </Show>
                                            <button
                                                type="button"
                                                data-command-index={index()}
                                                data-selected={selected() ? "true" : undefined}
                                                onClick={() => props.onSelect(command)}
                                                onMouseEnter={() => props.onHover(index())}
                                                class="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left transition-colors"
                                                style={{
                                                    background: selected() ? "var(--db-accent-soft)" : "transparent",
                                                    color: selected() ? "var(--db-text)" : "inherit",
                                                    "outline-color": "var(--db-accent)",
                                                    "outline-offset": "1px",
                                                    outline: "none",
                                                    border: "none",
                                                    cursor: "pointer",
                                                }}
                                            >
                                                <span
                                                    class="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[10px] font-black"
                                                    style={{
                                                        background: selected()
                                                            ? "var(--db-accent)"
                                                            : "var(--db-surface2)",
                                                        color: selected() ? "var(--db-bg)" : "var(--db-text3)",
                                                    }}
                                                >
                                                    {command.icon ?? command.id.slice(0, 2).toUpperCase()}
                                                </span>
                                                <div class="min-w-0 flex-1">
                                                    <div class="text-[13px] font-medium leading-snug">{command.label}</div>
                                                    <div
                                                        class="mt-0.5 text-[11px] leading-snug"
                                                        style={{
                                                            color: selected()
                                                                ? "var(--db-text2)"
                                                                : "var(--db-text3)",
                                                        }}
                                                    >
                                                        {command.description}
                                                    </div>
                                                </div>
                                                <span
                                                    class="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-mono"
                                                    style={{
                                                        background: selected()
                                                            ? "var(--db-surface2)"
                                                            : "var(--db-bg)",
                                                        color: selected() ? "var(--db-text3)" : "var(--db-text2)",
                                                    }}
                                                >
                                                    {command.insert
                                                        ? command.insert.slice(0, 8) +
                                                          (command.insert.length > 8 ? "…" : "")
                                                        : "-"}
                                                </span>
                                            </button>
                                        </>
                                    );
                                }}
                            </For>
                        </Show>
                    </div>
                </div>
            )}
        </Show>
    );
}
