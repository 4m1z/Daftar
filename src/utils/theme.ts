export type Theme = "light" | "dark";

const STORAGE_KEY = "dashboard-theme";
const COOKIE_KEY = "notes-theme";

export function themeFromCookieHeader(cookieHeader: string | null | undefined): Theme {
    const value = cookieHeader
        ?.split(";")
        .map((cookie) => cookie.trim().split("="))
        .find(([name]) => name === COOKIE_KEY)?.[1];
    return value === "dark" ? "dark" : "light";
}

export function themeFromDocument(): Theme {
    return document.documentElement.dataset.dashboardTheme === "dark" ? "dark" : "light";
}

export function storeTheme(theme: Theme) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, theme);
    document.cookie = `${COOKIE_KEY}=${theme}; Path=/; Max-Age=31536000; SameSite=Lax`;
}

export function applyThemeClass(theme: Theme) {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    root.classList.remove("dark", "dashboard-dark");
    root.setAttribute("data-theme", theme === "light" ? "light" : "night");
    root.setAttribute("data-dashboard-theme", theme);
    if (theme === "dark") root.classList.add("dark", "dashboard-dark");
}

export function nextTheme(theme: Theme): Theme {
    return theme === "light" ? "dark" : "light";
}
