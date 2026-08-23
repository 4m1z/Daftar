import { Errored, type ParentProps } from "solid-js";

const asError = (value: unknown) => value instanceof Error ? value : new Error(String(value));

export function NotesRouteBoundary(props: ParentProps) {
    return (
        <Errored fallback={(error, reset) => <NotesRouteError error={asError(error())} reset={reset} />}>
            {props.children}
        </Errored>
    );
}

function NotesRouteError(props: { error: Error; reset: () => void }) {
    return (
        <div
            class={`flex min-h-0 min-w-0 flex-1 flex-col
                items-center justify-center gap-3 p-6 text-center`}
        >
            <p class="text-sm font-semibold" style={{ color: "var(--db-text)" }}>
                This part of Daftar could not be loaded.
            </p>
            <p class="max-w-md text-xs" style={{ color: "var(--db-text3)" }}>
                {props.error.message}
            </p>
            <button
                type="button"
                onClick={props.reset}
                class="rounded px-3 py-1.5 text-xs transition-colors"
                style={{ background: "var(--db-surface)", color: "var(--db-text)" }}
            >
                Try again
            </button>
        </div>
    );
}
