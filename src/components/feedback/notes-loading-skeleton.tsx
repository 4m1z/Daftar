import { For } from "solid-js";

function SkeletonLine(props: { class: string }) {
    return <div class={`notes-skeleton rounded ${props.class}`} aria-hidden="true" />;
}

export function NotesLoadingSkeleton() {
    return (
        <main
            class="notes-app db-page notes-frame"
            aria-busy="true"
            aria-label="Loading notes"
            data-depth={1}
            data-direction="none"
            data-compact="false"
            data-focus="false"
        >
            <span class="sr-only" role="status">
                Loading notes
            </span>

            <div class="notes-pane notes-pane-notebooks" data-pane="notebooks" aria-hidden="true">
                <div class="flex h-full w-full flex-col gap-4 p-4">
                    <SkeletonLine class="h-7 w-28" />
                    <For each={[1, 2, 3, 4]}>{() => <SkeletonLine class="h-8 w-full" />}</For>
                </div>
            </div>
            <div class="notes-pane notes-pane-notes" data-pane="notes" aria-hidden="true">
                <div class="flex h-full w-full flex-col">
                    <div class="border-b p-4" style={{ "border-color": "var(--db-border)" }}>
                        <SkeletonLine class="h-8 w-full" />
                    </div>
                    <div class="space-y-5 p-4">
                        <For each={[1, 2, 3, 4, 5]}>
                            {() => (
                                <div class="space-y-2">
                                    <SkeletonLine class="h-4 w-3/4" />
                                    <SkeletonLine class="h-3 w-full" />
                                    <SkeletonLine class="h-3 w-1/3" />
                                </div>
                            )}
                        </For>
                    </div>
                </div>
            </div>
            <div class="notes-pane notes-pane-editor" data-pane="editor" aria-hidden="true">
                <div class="flex h-full w-full flex-1 flex-col">
                    <div
                        class="flex h-12 items-center justify-between border-b px-5"
                        style={{ "border-color": "var(--db-border)" }}
                    >
                        <SkeletonLine class="h-4 w-52" />
                        <SkeletonLine class="h-6 w-40" />
                    </div>
                    <div class="space-y-5 p-6 sm:p-10">
                        <SkeletonLine class="h-8 w-1/2" />
                        <SkeletonLine class="h-4 w-full" />
                        <SkeletonLine class="h-4 w-11/12" />
                        <SkeletonLine class="h-4 w-4/5" />
                    </div>
                </div>
            </div>
        </main>
    );
}
