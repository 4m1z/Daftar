import { createEffect, createSignal, onCleanup, Show, type Accessor } from "solid-js";

import { Markdown } from "~/components/markdown";
import { NoteEditor } from "~/components/note-editor";
import type { NoteItem } from "~/lib/notes/types";
import type { Theme } from "~/utils/theme";

/** CodeMirror editor bound to the active note. Remounts when the note changes. */
export function NoteEditorPanel(props: {
    note: Accessor<NoteItem | null>;
    onChange: (value: string) => void;
    theme: Accessor<Theme>;
}) {
    return (
        <Show when={props.note()?.id} keyed>
            {(_noteId) => (
                <NoteEditor
                    initialValue={props.note()?.content ?? ""}
                    onChange={props.onChange}
                    theme={props.theme()}
                />
            )}
        </Show>
    );
}

/** Rendered markdown preview of the active note. */
export function NotePreviewPanel(props: {
    note: Accessor<NoteItem | null>;
    onChange: (value: string) => void;
    mobile?: boolean;
}) {
    const [source, setSource] = createSignal(props.note()?.content ?? "");
    let noteId = props.note()?.id;
    let timeout: number | undefined;

    createEffect(
        () => ({ id: props.note()?.id, content: props.note()?.content ?? "" }),
        (note) => {
            window.clearTimeout(timeout);
            if (note.id !== noteId) {
                noteId = note.id;
                setSource(note.content);
                return;
            }
            timeout = window.setTimeout(() => setSource(note.content), 250);
        },
    );
    onCleanup(() => window.clearTimeout(timeout));

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
