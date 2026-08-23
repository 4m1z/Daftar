import { createEffect, createSignal, onCleanup, untrack, type Accessor } from "solid-js";

type DebouncedValueOptions = {
    key?: Accessor<unknown>;
};

export function useDebouncedValue<T>(source: Accessor<T>, delay: number, options: DebouncedValueOptions = {}) {
    const [value, setValue] = createSignal<T>(() => untrack(source));
    let currentKey = options.key ? untrack(options.key) : undefined;
    let timeout: number | undefined;

    createEffect(
        () => ({ value: source(), key: options.key?.() }),
        (next) => {
            window.clearTimeout(timeout);

            if (options.key && !Object.is(next.key, currentKey)) {
                currentKey = next.key;
                setValue(() => next.value);
                return;
            }

            timeout = window.setTimeout(() => setValue(() => next.value), delay);
        },
    );

    onCleanup(() => window.clearTimeout(timeout));
    return value;
}
