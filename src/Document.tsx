import type { ParentProps } from "solid-js";
import { HydrationScript } from "@solidjs/web";

// The document shell — picked up by the src/Document.* convention, it wraps
// the app in the plugin's generated entries. The client script is injected
// into the head by the plugin.
export default function Document(props: ParentProps) {
    return (
        <html lang="en" class="h-screen" data-theme="light">
            <head>
                <meta charset="utf-8" />
                <meta name="viewport" content="width=device-width,initial-scale=1" />
                <script innerHTML="(function(){try{var d=document.documentElement;var t=localStorage.getItem('dashboard-theme')==='dark'?'dark':'light';d.classList.remove('dark','dashboard-dark');if(t==='dark'){d.classList.add('dark','dashboard-dark')}d.setAttribute('data-theme',t==='dark'?'night':'light');d.setAttribute('data-dashboard-theme',t)}catch(e){}})();" />
                <HydrationScript />
            </head>
            <body class="min-h-screen overflow-x-hidden bg-[var(--app-bg)] font-sans text-[var(--app-text)] antialiased">
                {props.children}
            </body>
        </html>
    );
}
