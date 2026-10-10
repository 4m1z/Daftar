export type Theme = "light" | "dark" | "omablue";

const STORAGE_KEY = "dashboard-theme";
const COOKIE_KEY = "notes-theme";

export function themeFromCookieHeader(cookieHeader: string | null | undefined): Theme {
    const value = cookieHeader
        ?.split(";")
        .map((cookie) => cookie.trim().split("="))
        .find(([name]) => name === COOKIE_KEY)?.[1];
    return value === "dark" || value === "omablue" ? value : "light";
}

export function themeFromDocument(): Theme {
    const value = document.documentElement.dataset.dashboardTheme;
    return value === "dark" || value === "omablue" ? value : "light";
}

export function storeTheme(theme: Theme) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, theme);
    document.cookie = `${COOKIE_KEY}=${theme}; Path=/; Max-Age=31536000; SameSite=Lax`;
    document.documentElement.setAttribute("data-dashboard-theme", theme);
}

export function applyThemeClass(theme: Theme) {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    root.classList.remove("dark", "dashboard-dark", "dashboard-omablue");
    root.setAttribute("data-theme", theme === "light" ? "light" : "night");
    root.setAttribute("data-dashboard-theme", theme);
    if (theme !== "light") root.classList.add("dark", "dashboard-dark");
    if (theme === "omablue") root.classList.add("dashboard-omablue");
}

export function nextTheme(theme: Theme): Theme {
    return theme === "light" ? "dark" : theme === "dark" ? "omablue" : "light";
}

// Run before first paint. Reads the persisted notes theme (cookie first,
// localStorage fallback) so the correct palette is on the document before
// hydration, avoiding a light-first flash.
export const themeBootstrapScript = `(function(){try{var d=document.documentElement;var m=document.cookie.match(/(?:^|; )notes-theme=(dark|light|omablue)/);var s=null;try{s=localStorage.getItem('dashboard-theme')}catch(e){}var t=m?m[1]:(s==='dark'||s==='omablue'?s:'light');if(!m)document.cookie='notes-theme='+t+'; Path=/; Max-Age=31536000; SameSite=Lax';d.classList.remove('dark','dashboard-dark','dashboard-omablue');if(t!=='light')d.classList.add('dark','dashboard-dark');if(t==='omablue')d.classList.add('dashboard-omablue');d.setAttribute('data-theme',t==='light'?'light':'night');d.setAttribute('data-dashboard-theme',t)}catch(e){}})();`;
