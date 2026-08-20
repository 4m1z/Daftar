import { createRoot, flush } from "solid-js";

/**
 * Runs a reactive factory inside a disposable Solid root so hooks that call
 * createSignal/createEffect work outside of a component. Solid 2 roots are
 * transparent, so test-owned signals written inside the root stay writable.
 * Remember to call `dispose()` (or use it in an afterEach) to clean up
 * effects and listeners.
 */
export function renderReactive<T>(factory: () => T): { result: T; dispose: () => void } {
    let result!: T;
    let dispose!: () => void;
    createRoot((disposeRoot) => {
        dispose = disposeRoot;
        result = factory();
    });
    flush();
    return { result, dispose };
}

/** Lets queued Solid effects run to completion. */
export const flushEffects = () => {
    flush();
    return Promise.resolve();
};
