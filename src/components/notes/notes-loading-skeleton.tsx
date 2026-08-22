import { For } from "solid-js";

function SkeletonLine(props: { class: string }) {
    return <div class={`rounded bg-[var(--db-border)] ${props.class}`} />;
}

export function NotesLoadingSkeleton() {
    return (
        <main
            class="notes-app db-page flex h-screen w-full overflow-hidden antialiased"
            aria-busy="true"
            aria-label="Loading notes"
        >
            <span class="sr-only" role="status">Loading notes</span>

            <div class="flex w-full animate-pulse flex-col xl:hidden">
                <div class="flex h-12 items-center gap-3 border-b px-4" style={{ "border-color": "var(--db-border)" }}>
                    <For each={["w-20", "w-24", "w-16"]}>
                        {(width) => <SkeletonLine class={`h-6 ${width}`} />}
                    </For>
                </div>
                <div class="flex h-14 items-center gap-3 border-b px-4" style={{ "border-color": "var(--db-border)" }}>
                    <SkeletonLine class="h-8 w-28" />
                    <SkeletonLine class="h-8 w-36" />
                </div>
                <div class="flex h-11 items-center justify-between border-b px-4" style={{ "border-color": "var(--db-border)" }}>
                    <SkeletonLine class="h-4 w-40" />
                    <SkeletonLine class="h-6 w-24" />
                </div>
                <div class="space-y-4 p-6">
                    <SkeletonLine class="h-7 w-2/3" />
                    <SkeletonLine class="h-4 w-full" />
                    <SkeletonLine class="h-4 w-5/6" />
                    <SkeletonLine class="h-4 w-3/4" />
                </div>
            </div>

            <div class="hidden w-full animate-pulse xl:flex">
                <aside class="w-56 shrink-0 space-y-5 border-r p-4" style={{ "border-color": "var(--db-border)" }}>
                    <SkeletonLine class="h-7 w-28" />
                    <For each={[1, 2, 3, 4]}>
                        {() => <SkeletonLine class="h-8 w-full" />}
                    </For>
                </aside>
                <aside class="w-80 shrink-0 border-r" style={{ "border-color": "var(--db-border)" }}>
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
                </aside>
                <section class="min-w-0 flex-1">
                    <div class="flex h-11 items-center justify-between border-b px-5" style={{ "border-color": "var(--db-border)" }}>
                        <SkeletonLine class="h-4 w-52" />
                        <SkeletonLine class="h-6 w-40" />
                    </div>
                    <div class="space-y-5 p-10">
                        <SkeletonLine class="h-8 w-1/2" />
                        <SkeletonLine class="h-4 w-full" />
                        <SkeletonLine class="h-4 w-11/12" />
                        <SkeletonLine class="h-4 w-4/5" />
                        <SkeletonLine class="h-4 w-2/3" />
                    </div>
                </section>
            </div>
        </main>
    );
}
