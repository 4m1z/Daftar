import { getRequestEvent } from "@solidjs/web";
import { createContext, createSignal, useContext, type ParentProps } from "solid-js";

import { MoonIcon, SunIcon } from "~/components/ui/icons";
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

type ThemeContextValue = {
    theme: () => Theme;
    setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextValue>();

export function ThemeProvider(props: ParentProps) {
    const [theme, setThemeState] = createSignal<Theme>(initialTheme());

    const setTheme = (value: Theme) => {
        setThemeState(value);
        storeTheme(value);
        applyThemeClass(value);
    };
    return (
        <ThemeContext value={{ theme, setTheme }}>
            {props.children}
        </ThemeContext>
    );
}

export function useTheme() {
    return useContext(ThemeContext);
}

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const label = () =>
        `Theme: ${theme() === "omablue" ? "Omablue" : theme()}. Switch to ${nextTheme(theme()) === "omablue" ? "Omablue" : nextTheme(theme())} theme`;
    return (
        <button
            type="button"
            onClick={() => setTheme(nextTheme(theme()))}
            title={label()}
            aria-label={label()}
            class={`flex h-6 w-6 items-center justify-center rounded
                transition-colors hover:bg-black/10 dark:hover:bg-white/10`}
            style={{ color: "var(--db-text2)" }}
        >
            {theme() === "omablue" ? (
                <SunIcon class="h-3.5 w-3.5" />
            ) : theme() === "dark" ? (
                <span aria-hidden="true" class="h-3.5 w-3.5 rounded-full border-2 border-[#73b7ff] bg-[#012456]" />
            ) : (
                <MoonIcon class="h-3.5 w-3.5" />
            )}
        </button>
    );
}
