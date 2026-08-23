import { lazy, Show, type Accessor } from "solid-js";

import { useDebouncedValue } from "~/lib/hooks/use-debounced-value";
import type { NoteItem } from "~/lib/types/notes";
import type { Theme } from "~/utils/theme";

const Markdown = lazy(() => import("~/components/editor/markdown").then((module) => ({ default: module.Markdown })));
const NoteEditor = lazy(() => import("~/components/editor/note-editor").then((module) => ({ default: module.NoteEditor })));

export function NoteEditorPanel(props: {
    note: Accessor<NoteItem | null>;
    onChange: (value: string) => void;
    theme: Accessor<Theme>;
    vimMode: Accessor<boolean>;
}) {
    return (
        <Show when={props.note()?.id} keyed>
            {(_noteId) => (
                <NoteEditor
                    initialValue={props.note()?.content ?? ""}
                    onChange={props.onChange}
                    theme={props.theme()}
                    vimMode={props.vimMode()}
                />
            )}
        </Show>
    );
}

export function NotePreviewPanel(props: {
    note: Accessor<NoteItem | null>;
    onChange: (value: string) => void;
    mobile?: boolean;
}) {
    const source = useDebouncedValue(
        () => props.note()?.content ?? "",
        250,
        { key: () => props.note()?.id },
    );

    return (
        <Show
            when={props.mobile}
            fallback={
                <Show
                    when={source().trim()}
                    fallback={
                        <div class="notes-preview min-h-full px-5 py-6 md:px-8 md:py-8">
                            <p class="text-[13px]" style={{ color: "var(--md-text-dim)" }}>
                                Nothing to preview yet.
                            </p>
                        </div>
                    }
                >
                    <Markdown
                        source={source()}
                        class="notes-preview min-h-full px-5 py-6 md:px-8 md:py-8"
                        onChange={props.onChange}
                    />
                </Show>
            }
        >
            <Markdown
                source={source()}
                class="notes-preview min-h-full px-5 py-5 sm:px-8 sm:py-6"
                onChange={props.onChange}
            />
        </Show>
    );
}
