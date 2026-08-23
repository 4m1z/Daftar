import { createSignal } from "solid-js";
import { afterEach, describe, expect, it, vi } from "vitest";

import { flushEffects, renderReactive } from "~/lib/test-utils";
import { useDebouncedValue } from "./use-debounced-value";

let cleanup: (() => void) | undefined;

afterEach(() => {
    cleanup?.();
    cleanup = undefined;
    vi.useRealTimers();
});

describe("useDebouncedValue", () => {
    it("publishes only the latest value after the delay", async () => {
        vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
        const [source, setSource] = createSignal("initial");
        const { result, dispose } = renderReactive(() => useDebouncedValue(source, 250));
        cleanup = dispose;

        setSource("first");
        await flushEffects();
        setSource("second");
        await flushEffects();

        expect(result()).toBe("initial");
        vi.advanceTimersByTime(249);
        expect(result()).toBe("initial");
        vi.advanceTimersByTime(1);
        await flushEffects();
        expect(result()).toBe("second");
    });

    it("updates immediately and cancels pending work when the key changes", async () => {
        vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
        const [state, setState] = createSignal({ key: "n1", value: "first note" });
        const { result, dispose } = renderReactive(() => useDebouncedValue(
            () => state().value,
            250,
            { key: () => state().key },
        ));
        cleanup = dispose;

        setState({ key: "n1", value: "pending edit" });
        await flushEffects();
        setState({ key: "n2", value: "second note" });
        await flushEffects();

        expect(result()).toBe("second note");
        vi.advanceTimersByTime(250);
        await flushEffects();
        expect(result()).toBe("second note");
    });
});
