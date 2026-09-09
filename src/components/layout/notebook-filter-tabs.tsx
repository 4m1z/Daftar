import { For } from "solid-js";

import type { NotebookFilter } from "~/lib/hooks/use-notes-workspace";

const TABS: { value: NotebookFilter; label: string }[] = [
    { value: "active", label: "Active" },
    { value: "archived", label: "Archived" },
];

/**
 * Active/Archived segmented filter shared by the desktop notebook sidebar and
 * the mobile notes navigation. Filtering only changes list visibility: the
 * open notebook, editor, and URL are never altered by switching tabs.
 */
export function NotebookFilterTabs(props: {
    filter: () => NotebookFilter;
    onChange: (filter: NotebookFilter) => void;
    activeCount: () => number;
    archivedCount: () => number;
}) {
    const count = (value: NotebookFilter) => (value === "archived" ? props.archivedCount() : props.activeCount());

    return (
        <div
            role="group"
            aria-label="Filter notebooks"
            data-notebook-tabs
            tabindex={-1}
            class="flex gap-1 rounded p-0.5 outline-none"
            style={{ background: "var(--db-surface2)" }}
        >
            <For each={TABS}>
                {(tab) => {
                    const selected = () => props.filter() === tab.value;
                    return (
                        <button
                            type="button"
                            onClick={() => props.onChange(tab.value)}
                            aria-pressed={selected() ? "true" : "false"}
                            class={`flex flex-1 items-center justify-center gap-1 rounded px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] transition-colors`}
                            style={{
                                background: selected() ? "var(--db-bg)" : "transparent",
                                color: selected() ? "var(--db-text)" : "var(--db-text3)",
                            }}
                        >
                            {tab.label}
                            <span class="tabular-nums" style={{ color: selected() ? "var(--db-accent)" : undefined }}>
                                {count(tab.value)}
                            </span>
                        </button>
                    );
                }}
            </For>
        </div>
    );
}
