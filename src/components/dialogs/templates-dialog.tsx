import { createEffect, createMemo, createSignal, For, onSettled, Show } from "solid-js";

import { SmallPlusIcon, TemplateIcon, TrashIcon } from "~/components/ui/icons";
import { DEFAULT_TEMPLATE_CATEGORY, TEMPLATE_CATEGORIES } from "~/lib/constants/notes";
import type { NoteItem } from "~/lib/types/notes";
import { templatePreview } from "~/lib/utils/templates";
import type { Template } from "~/models/templates.server";

type TemplateInput = {
    name: string;
    description?: string;
    content: string;
    category: string;
};

const emptyForm = (): TemplateInput => ({
    name: "",
    description: "",
    content: "",
    category: DEFAULT_TEMPLATE_CATEGORY,
});

/** Template picker and editor, opened from the notebooks rail. */
export function TemplatesDialog(props: {
    mode: "pick" | "manage";
    templates: Template[];
    activeNote: NoteItem | null;
    onClose: () => void;
    onPick: (template: Template) => void;
    onCreate: (data: TemplateInput) => string;
    onUpdate: (id: string, data: TemplateInput) => void;
    onDelete: (id: string) => void;
    onDuplicate: (id: string) => string | undefined;
}) {
    const [search, setSearch] = createSignal("");
    const [selectedId, setSelectedId] = createSignal<string | null>(null);
    const [form, setForm] = createSignal<TemplateInput>(emptyForm());
    const [confirmDelete, setConfirmDelete] = createSignal(false);
    let searchInput: HTMLInputElement | undefined;

    const filtered = createMemo(() => {
        const query = search().trim().toLowerCase();
        if (!query) return props.templates;
        return props.templates.filter((template) =>
            [template.name, template.category, template.description ?? "", template.content]
                .join(" ")
                .toLowerCase()
                .includes(query),
        );
    });

    const selected = () => props.templates.find((template) => template.id === selectedId()) ?? null;

    const pick = (template: Template) => {
        if (props.mode === "pick") {
            props.onPick(template);
            return;
        }
        setSelectedId(template.id);
        setConfirmDelete(false);
        setForm({
            name: template.name,
            description: template.description ?? "",
            content: template.content,
            category: template.category,
        });
    };

    const startNew = () => {
        setSelectedId(null);
        setConfirmDelete(false);
        setForm(emptyForm());
    };

    const useActiveNote = () => {
        const note = props.activeNote;
        if (!note) return;
        setSelectedId(null);
        setConfirmDelete(false);
        setForm({
            name: note.title.trim() || "Untitled template",
            description: "",
            content: note.content,
            category: DEFAULT_TEMPLATE_CATEGORY,
        });
    };

    const save = () => {
        const data = form();
        const name = data.name.trim();
        if (!name) return;
        const payload: TemplateInput = {
            ...data,
            name,
            description: data.description?.trim() || undefined,
        };
        if (selectedId()) {
            props.onUpdate(selectedId()!, payload);
        } else {
            setSelectedId(props.onCreate(payload));
        }
    };

    const remove = () => {
        const template = selected();
        if (!template || template.isPredefined) return;
        if (!confirmDelete()) {
            setConfirmDelete(true);
            return;
        }
        props.onDelete(template.id);
        startNew();
    };

    const duplicate = () => {
        if (!selectedId()) return;
        const id = props.onDuplicate(selectedId()!);
        if (id) {
            const copy = props.templates.find((template) => template.id === id);
            if (copy) pick(copy);
        }
    };

    onSettled(() => {
        searchInput?.focus();
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key !== "Escape") return;
            event.preventDefault();
            props.onClose();
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    });

    // Keep the form in sync when the optimistically created template lands.
    createEffect(
        () => ({ id: selectedId(), templates: props.templates }),
        ({ id }) => {
            if (!id) return;
            const template = props.templates.find((item) => item.id === id);
            if (!template) return;
            setForm((current) =>
                current.name === template.name && current.content === template.content
                    ? current
                    : {
                          name: template.name,
                          description: template.description ?? "",
                          content: template.content,
                          category: template.category,
                      },
            );
        },
    );

    const manage = () => props.mode === "manage";

    return (
        <div
            class="fixed inset-0 z-50 flex items-center justify-center px-3 py-6"
            style={{ background: "rgba(0, 0, 0, 0.5)" }}
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) props.onClose();
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="templates-dialog-title"
        >
            <div
                class="flex max-h-full w-full flex-col overflow-hidden rounded-lg border shadow-2xl"
                style={{
                    background: "var(--db-surface)",
                    "border-color": "var(--db-border)",
                    "max-width": manage() ? "860px" : "560px",
                }}
            >
                <div
                    class="flex min-h-12 shrink-0 items-center justify-between gap-3 border-b px-4"
                    style={{ "border-color": "var(--db-border)" }}
                >
                    <h2 id="templates-dialog-title" class="text-[14px] font-semibold" style={{ color: "var(--db-text)" }}>
                        {manage() ? "Manage templates" : "New note from template"}
                    </h2>
                    <div class="flex items-center gap-2">
                        <Show when={manage()}>
                            <button
                                type="button"
                                onClick={startNew}
                                class="flex h-8 items-center gap-1.5 rounded px-2.5 text-[12px] font-medium transition-colors hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-1"
                                style={{
                                    background: "var(--db-surface2)",
                                    color: "var(--db-text)",
                                    "outline-color": "var(--db-accent)",
                                }}
                            >
                                <SmallPlusIcon />
                                New template
                            </button>
                        </Show>
                        <button
                            type="button"
                            onClick={props.onClose}
                            title="Close"
                            aria-label="Close templates"
                            class="flex h-8 w-8 items-center justify-center rounded text-[16px] transition-colors hover:bg-[var(--db-surface2)] focus-visible:outline-2 focus-visible:outline-offset-1"
                            style={{ color: "var(--db-text3)", "outline-color": "var(--db-accent)" }}
                        >
                            ×
                        </button>
                    </div>
                </div>

                <div class="flex min-h-0 flex-1 flex-col sm:flex-row">
                    <div
                        class="flex min-h-0 w-full flex-col border-b sm:w-[270px] sm:shrink-0 sm:border-b-0 sm:border-r"
                        style={{ "border-color": "var(--db-border)" }}
                    >
                        <div class="shrink-0 p-2">
                            <input
                                ref={searchInput}
                                value={search()}
                                onInput={(event) => setSearch(event.currentTarget.value)}
                                placeholder="Search templates…"
                                aria-label="Search templates"
                                class="h-8 w-full rounded border bg-transparent px-2.5 text-[12px] outline-none focus-visible:outline-2 focus-visible:outline-offset-1"
                                style={{
                                    "border-color": "var(--db-border)",
                                    color: "var(--db-text)",
                                    "caret-color": "var(--db-accent)",
                                    "outline-color": "var(--db-accent)",
                                }}
                            />
                        </div>
                        <div class="min-h-0 flex-1 overflow-y-auto px-1 pb-2">
                            <Show
                                when={filtered().length > 0}
                                fallback={
                                    <p class="px-3 py-8 text-center text-[12px]" style={{ color: "var(--db-text3)" }}>
                                        No templates match “{search()}”.
                                    </p>
                                }
                            >
                                <For each={filtered()}>
                                    {(template) => {
                                        const active = () => manage() && template.id === selectedId();
                                        return (
                                            <button
                                                type="button"
                                                onClick={() => pick(template)}
                                                class="mb-0.5 flex w-full items-start gap-2 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-[var(--db-surface2)] focus-visible:outline-2 focus-visible:outline-offset-1"
                                                style={{
                                                    background: active() ? "var(--db-accent-soft)" : "transparent",
                                                    "outline-color": "var(--db-accent)",
                                                }}
                                            >
                                                <TemplateIcon class="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--db-text3)]" />
                                                <span class="min-w-0 flex-1">
                                                    <span class="flex items-center gap-1.5">
                                                        <span
                                                            class="truncate text-[12px] font-medium"
                                                            style={{ color: "var(--db-text)" }}
                                                        >
                                                            {template.name}
                                                        </span>
                                                        <Show when={template.isPredefined}>
                                                            <span
                                                                class="shrink-0 rounded px-1 py-px text-[9px] font-semibold uppercase tracking-[0.08em]"
                                                                style={{
                                                                    background: "var(--db-surface2)",
                                                                    color: "var(--db-text3)",
                                                                }}
                                                            >
                                                                Built-in
                                                            </span>
                                                        </Show>
                                                    </span>
                                                    <span
                                                        class="mt-0.5 block text-[10px] uppercase tracking-[0.08em]"
                                                        style={{ color: "var(--db-text3)" }}
                                                    >
                                                        {template.category}
                                                    </span>
                                                    <span
                                                        class="mt-0.5 line-clamp-2 block text-[11px] leading-snug"
                                                        style={{ color: "var(--db-text3)" }}
                                                    >
                                                        {template.description || templatePreview(template.content)}
                                                    </span>
                                                </span>
                                            </button>
                                        );
                                    }}
                                </For>
                            </Show>
                        </div>
                    </div>

                    <Show when={manage()}>
                        <div class="flex min-h-0 min-w-0 flex-1 flex-col">
                            <div class="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
                <Show when={props.activeNote}>
                                    <button
                                        type="button"
                                        onClick={useActiveNote}
                                        class="flex w-full items-center justify-center gap-1.5 rounded border border-dashed px-3 py-2 text-[12px] transition-colors hover:bg-[var(--db-surface2)] focus-visible:outline-2 focus-visible:outline-offset-1"
                                        style={{
                                            "border-color": "var(--db-border)",
                                            color: "var(--db-text2)",
                                            "outline-color": "var(--db-accent)",
                                        }}
                                    >
                                        <TemplateIcon class="h-3.5 w-3.5" />
                                        Use current note as the template
                                    </button>
                                </Show>

                                <label class="block">
                                    <span class="mb-1 block text-[11px] font-medium" style={{ color: "var(--db-text2)" }}>
                                        Name
                                    </span>
                                    <input
                                        value={form().name}
                                        onInput={(event) =>
                                            setForm((current) => ({ ...current, name: event.currentTarget.value }))
                                        }
                                        placeholder="Template name"
                                        class="h-8 w-full rounded border bg-transparent px-2.5 text-[12px] outline-none focus-visible:outline-2 focus-visible:outline-offset-1"
                                        style={{
                                            "border-color": "var(--db-border)",
                                            color: "var(--db-text)",
                                            "caret-color": "var(--db-accent)",
                                            "outline-color": "var(--db-accent)",
                                        }}
                                    />
                                </label>

                                <div class="flex flex-col gap-3 sm:flex-row">
                                    <label class="block sm:w-40">
                                        <span
                                            class="mb-1 block text-[11px] font-medium"
                                            style={{ color: "var(--db-text2)" }}
                                        >
                                            Category
                                        </span>
                                        <select
                                            value={form().category}
                                            onChange={(event) =>
                                                setForm((current) => ({
                                                    ...current,
                                                    category: event.currentTarget.value,
                                                }))
                                            }
                                            class="h-8 w-full rounded border bg-transparent px-2 text-[12px] outline-none focus-visible:outline-2 focus-visible:outline-offset-1"
                                            style={{
                                                "border-color": "var(--db-border)",
                                                color: "var(--db-text)",
                                                "outline-color": "var(--db-accent)",
                                            }}
                                        >
                                            <For each={TEMPLATE_CATEGORIES}>
                                                {(category) => <option value={category}>{category}</option>}
                                            </For>
                                        </select>
                                    </label>
                                    <label class="block flex-1">
                                        <span
                                            class="mb-1 block text-[11px] font-medium"
                                            style={{ color: "var(--db-text2)" }}
                                        >
                                            Description
                                        </span>
                                        <input
                                            value={form().description ?? ""}
                                            onInput={(event) =>
                                                setForm((current) => ({
                                                    ...current,
                                                    description: event.currentTarget.value,
                                                }))
                                            }
                                            placeholder="Optional"
                                            class="h-8 w-full rounded border bg-transparent px-2.5 text-[12px] outline-none focus-visible:outline-2 focus-visible:outline-offset-1"
                                            style={{
                                                "border-color": "var(--db-border)",
                                                color: "var(--db-text)",
                                                "caret-color": "var(--db-accent)",
                                                "outline-color": "var(--db-accent)",
                                            }}
                                        />
                                    </label>
                                </div>

                                <label class="block">
                                    <span class="mb-1 block text-[11px] font-medium" style={{ color: "var(--db-text2)" }}>
                                        Content
                                    </span>
                                    <textarea
                                        value={form().content}
                                        onInput={(event) =>
                                            setForm((current) => ({ ...current, content: event.currentTarget.value }))
                                        }
                                        rows={12}
                                        placeholder="# Template content"
                                        class="w-full resize-y rounded border bg-transparent px-2.5 py-2 font-mono text-[12px] leading-relaxed outline-none focus-visible:outline-2 focus-visible:outline-offset-1"
                                        style={{
                                            "border-color": "var(--db-border)",
                                            color: "var(--db-text)",
                                            "caret-color": "var(--db-accent)",
                                            "outline-color": "var(--db-accent)",
                                        }}
                                    />
                                </label>
                            </div>

                            <div
                                class="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t px-3 py-2"
                                style={{ "border-color": "var(--db-border)" }}
                            >
                                <div class="flex items-center gap-2">
                                    <Show when={selectedId()}>
                                        <button
                                            type="button"
                                            onClick={duplicate}
                                            class="rounded px-2.5 py-1.5 text-[12px] transition-colors hover:bg-[var(--db-surface2)] focus-visible:outline-2 focus-visible:outline-offset-1"
                                            style={{
                                                color: "var(--db-text2)",
                                                "outline-color": "var(--db-accent)",
                                            }}
                                        >
                                            Duplicate
                                        </button>
                                    </Show>
                                    <Show when={selected() && !selected()!.isPredefined}>
                                        <button
                                            type="button"
                                            onClick={remove}
                                            class="flex items-center gap-1 rounded px-2.5 py-1.5 text-[12px] transition-colors hover:bg-[color-mix(in_srgb,var(--db-danger)_12%,transparent)] focus-visible:outline-2 focus-visible:outline-offset-1"
                                            style={{
                                                color: confirmDelete() ? "var(--db-danger)" : "var(--db-text3)",
                                                "outline-color": "var(--db-accent)",
                                            }}
                                        >
                                            <TrashIcon class="h-3 w-3" />
                                            {confirmDelete() ? "Click again to delete" : "Delete"}
                                        </button>
                                    </Show>
                                </div>
                                <button
                                    type="button"
                                    onClick={save}
                                    disabled={!form().name.trim()}
                                    class="rounded px-3 py-1.5 text-[12px] font-semibold transition-colors hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-1 disabled:opacity-40"
                                    style={{
                                        background: "var(--db-accent)",
                                        color: "var(--db-bg)",
                                        "outline-color": "var(--db-accent)",
                                    }}
                                >
                                    {selectedId() ? "Save changes" : "Create template"}
                                </button>
                            </div>
                        </div>
                    </Show>
                </div>
            </div>
        </div>
    );
}
