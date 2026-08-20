export type Theme = "light" | "dark";

const STORAGE_KEY = "dashboard-theme";

export function storeTheme(theme: Theme) {
    if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, theme);
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
