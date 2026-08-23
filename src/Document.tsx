import type { ParentProps } from "solid-js";
import { getRequestEvent, HydrationScript } from "@solidjs/web";

import { themeFromCookieHeader } from "~/utils/theme";

// The document shell — picked up by the src/Document.* convention, it wraps
// the app in the plugin's generated entries. The client script is injected
// into the head by the plugin.
export default function Document(props: ParentProps) {
    const theme = themeFromCookieHeader(getRequestEvent()?.request.headers.get("cookie"));
    const dark = theme === "dark";
    return (
        <html
            lang="en"
            class={`h-screen${dark ? " dark dashboard-dark" : ""}`}
            data-theme={dark ? "night" : "light"}
            data-dashboard-theme={theme}
        >
            <head>
                <meta charset="utf-8" />
                <meta name="viewport" content="width=device-width,initial-scale=1" />
                <script innerHTML="(function(){try{var d=document.documentElement;var m=document.cookie.match(/(?:^|; )notes-theme=(dark|light)/);var t=m?m[1]:(localStorage.getItem('dashboard-theme')==='dark'?'dark':'light');if(!m)document.cookie='notes-theme='+t+'; Path=/; Max-Age=31536000; SameSite=Lax';d.classList.remove('dark','dashboard-dark');if(t==='dark')d.classList.add('dark','dashboard-dark');d.setAttribute('data-theme',t==='dark'?'night':'light');d.setAttribute('data-dashboard-theme',t)}catch(e){}})();" />
                <HydrationScript />
            </head>
            <body
                class={`min-h-screen overflow-x-hidden bg-[var(--app-bg)]
                    font-sans text-[var(--app-text)] antialiased`}
            >
                {props.children}
            </body>
        </html>
    );
}
