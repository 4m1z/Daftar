import { getRequestEvent } from "@solidjs/web";
import { createSignal } from "solid-js";

import {
    applyThemeClass,
    nextTheme,
    storeTheme,
    themeFromCookieHeader,
    themeFromDocument,
    type Theme,
} from "~/utils/theme";

function initialTheme() {
    if (typeof document !== "undefined") return themeFromDocument();
    return themeFromCookieHeader(getRequestEvent()?.request.headers.get("cookie"));
}

export function useDashboardTheme() {
    const [theme, setThemeState] = createSignal<Theme>(initialTheme());

    const setTheme = (value: Theme) => {
        setThemeState(value);
        storeTheme(value);
        applyThemeClass(value);
    };
    return { theme, setTheme };
}

export function DashboardThemeToggle(props: { theme: Theme; onChange: (theme: Theme) => void }) {
    const label = () => props.theme === "dark" ? "Switch to light theme" : "Switch to dark theme";
    return (
        <button type="button" onClick={() => props.onChange(nextTheme(props.theme))} title={label()} aria-label={label()} class="flex h-6 w-6 items-center justify-center rounded transition-colors hover:bg-black/10 dark:hover:bg-white/10" style={{ color: "var(--db-text2)" }}>
            {props.theme === "dark" ? <IconSun /> : <IconMoon />}
        </button>
    );
}

function IconSun() {
    return <svg viewBox="0 0 16 16" fill="currentColor" class="h-3.5 w-3.5"><path d="M8 12a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm0-1.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM8 1a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 8 1Zm0 11a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 8 12Zm6.25-4.25a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1 0-1.5h1.5a.75.75 0 0 1 .75.75ZM2.5 7.25a.75.75 0 0 1 0 1.5H1a.75.75 0 0 1 0-1.5ZM11.78 4.22a.75.75 0 0 1 0 1.06l-1.06 1.06a.75.75 0 0 1-1.06-1.06l1.06-1.06a.75.75 0 0 1 1.06 0ZM5.34 9.72a.75.75 0 0 1 0 1.06l-1.06 1.06a.75.75 0 0 1-1.06-1.06l1.06-1.06a.75.75 0 0 1 1.06 0ZM4.28 4.22a.75.75 0 0 1 1.06 0l1.06 1.06a.75.75 0 0 1-1.06 1.06L4.28 5.28a.75.75 0 0 1 0-1.06Zm5.44 5.5a.75.75 0 0 1 1.06 0l1.06 1.06a.75.75 0 0 1-1.06 1.06l-1.06-1.06a.75.75 0 0 1 0-1.06Z" /></svg>;
}

function IconMoon() {
    return <svg viewBox="0 0 16 16" fill="currentColor" class="h-3.5 w-3.5"><path d="M9.598 1.591a.749.749 0 0 1 .785-.175 7.001 7.001 0 1 1-8.967 8.967.75.75 0 0 1 .961-.96 5.5 5.5 0 0 0 7.046-7.046.75.75 0 0 1 .175-.786Zm1.616 1.945a7 7 0 0 1-7.678 7.678 5.499 5.499 0 1 0 7.678-7.678Z" /></svg>;
}
