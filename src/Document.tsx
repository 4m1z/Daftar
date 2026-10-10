import type { ParentProps } from "solid-js";
import { getRequestEvent, HydrationScript } from "@solidjs/web";

import { themeBootstrapScript, themeFromCookieHeader } from "~/utils/theme";

// The document shell — picked up by the src/Document.* convention, it wraps
// the app in the plugin's generated entries. The client script is injected
// into the head by the plugin.
export default function Document(props: ParentProps) {
    const theme = themeFromCookieHeader(getRequestEvent()?.request.headers.get("cookie"));
    const dark = theme !== "light";
    return (
        <html
            lang="en"
            class={`h-screen${dark ? " dark dashboard-dark" : ""}${theme === "omablue" ? " dashboard-omablue" : ""}`}
            data-theme={dark ? "night" : "light"}
            data-dashboard-theme={theme}
        >
            <head>
                <meta charset="utf-8" />
                <meta name="viewport" content="width=device-width,initial-scale=1" />
                <script innerHTML={themeBootstrapScript} />
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
