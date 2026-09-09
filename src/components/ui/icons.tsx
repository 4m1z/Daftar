export function MoonIcon(props: { class?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            class={props.class ?? ""}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
        >
            <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width={1.8}
                d="M21 12.8A9 9 0 1111.2 3 7 7 0 0021 12.8z"
            />
        </svg>
    );
}

export function SunIcon(props: { class?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            class={props.class ?? ""}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
        >
            <circle cx="12" cy="12" r="4" stroke-width={1.8} />
            <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width={1.8}
                d="M12 2.5v2.2M12 19.3v2.2M4.7 4.7l1.6 1.6M17.7 17.7l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.7 19.3l1.6-1.6M17.7 6.3l1.6-1.6"
            />
        </svg>
    );
}

export function SmallPlusIcon(props: { class?: string }) {
    return (
        <svg viewBox="0 0 16 16" fill="currentColor" class={props.class ?? "h-3.5 w-3.5"}>
            <path d="M8 2a.75.75 0 0 1 .75.75v4.5h4.5a.75.75 0 0 1 0 1.5h-4.5v4.5a.75.75 0 0 1-1.5 0v-4.5h-4.5a.75.75 0 0 1 0-1.5h4.5v-4.5A.75.75 0 0 1 8 2Z" />
        </svg>
    );
}

export function TrashIcon(props: { class?: string }) {
    return (
        <svg viewBox="0 0 16 16" fill="currentColor" class={props.class ?? "h-3 w-3"}>
            <path d="M6.5 1.75a.25.25 0 0 1 .25-.25h2.5a.25.25 0 0 1 .25.25V3h-3Zm4.5 0V3h2.25a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1 0-1.5H5V1.75C5 .784 5.784 0 6.75 0h2.5C10.216 0 11 .784 11 1.75ZM4.496 6.559a.75.75 0 1 0-1.492.141l.747 7.945A1.75 1.75 0 0 0 5.496 16h5.007a1.75 1.75 0 0 0 1.745-1.355l.747-7.945a.75.75 0 1 0-1.492-.141l-.747 7.945a.25.25 0 0 1-.249.193H5.496a.25.25 0 0 1-.249-.193Z" />
        </svg>
    );
}

export function ArchiveIcon(props: { class?: string }) {
    return (
        <svg viewBox="0 0 16 16" fill="currentColor" class={props.class ?? "h-3 w-3"}>
            <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M2.5 1.25h11a.75.75 0 0 1 .75.75v1a.75.75 0 0 1-.75.75h-11a.75.75 0 0 1-.75-.75v-1a.75.75 0 0 1 .75-.75ZM1 3.75h14v7.5a2.75 2.75 0 0 1-2.75 2.75H3.75A2.75 2.75 0 0 1 1 11.25V3.75ZM5 7a.75.75 0 0 1 .75-.75h4.5a.75.75 0 0 1 0 1.5H5.75A.75.75 0 0 1 5 7Z"
            />
        </svg>
    );
}

export function RestoreIcon(props: { class?: string }) {
    return (
        <svg viewBox="0 0 16 16" fill="currentColor" class={props.class ?? "h-3 w-3"}>
            <path d="M8 1l3 3H9.25v4.5h-2.5V4H5L8 1ZM2 9.75a.75.75 0 0 1 .75-.75h10.5a.75.75 0 0 1 .75.75v1.5a2.75 2.75 0 0 1-2.75 2.75h-6.5A2.75 2.75 0 0 1 2 11.25V9.75Z" />
        </svg>
    );
}

export function EditIcon(props: { class?: string }) {
    return (
        <svg viewBox="0 0 16 16" fill="currentColor" class={props.class ?? "h-3.5 w-3.5"}>
            <path d="M11.013 1.427a1.75 1.75 0 0 1 2.474 0l1.086 1.086a1.75 1.75 0 0 1 0 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 0 1-.927-.928l.929-3.25c.081-.286.235-.547.445-.758l8.61-8.61Zm1.414 1.06a.25.25 0 0 0-.354 0L10.811 3.75l1.439 1.44 1.263-1.263a.25.25 0 0 0 0-.354Zm-1.86 3.254-1.44-1.44-6.616 6.616a.25.25 0 0 0-.065.108l-.544 1.907 1.907-.544a.25.25 0 0 0 .108-.065Z" />
        </svg>
    );
}

export function EyeIcon(props: { class?: string }) {
    return (
        <svg viewBox="0 0 16 16" fill="currentColor" class={props.class ?? "h-3.5 w-3.5"}>
            <path d="M8 2c1.981 0 3.671.992 4.933 2.078 1.27 1.091 2.187 2.345 2.637 3.023a1.62 1.62 0 0 1 0 1.798c-.45.678-1.367 1.932-2.637 3.023C11.671 13.008 9.981 14 8 14c-1.981 0-3.671-.992-4.933-2.078C1.797 10.83.88 9.576.43 8.898a1.62 1.62 0 0 1 0-1.798c.45-.677 1.367-1.931 2.637-3.022C4.329 2.992 6.019 2 8 2ZM1.679 7.932a.12.12 0 0 0 0 .136c.411.622 1.241 1.75 2.366 2.717C5.176 11.758 6.527 12.5 8 12.5c1.473 0 2.825-.742 3.955-1.715 1.124-.967 1.954-2.096 2.366-2.717a.12.12 0 0 0 0-.136c-.412-.621-1.242-1.75-2.366-2.717C10.824 4.242 9.473 3.5 8 3.5c-1.473 0-2.825.742-3.955 1.715-1.124.967-1.954 2.096-2.366 2.717ZM8 10a2 2 0 1 1-.001-3.999A2 2 0 0 1 8 10Z" />
        </svg>
    );
}

export function SplitViewIcon(props: { class?: string }) {
    return (
        <svg viewBox="0 0 16 16" fill="currentColor" class={props.class ?? "h-3.5 w-3.5"}>
            <path d="M7.25 1.75a.75.75 0 0 1 1.5 0v12.5a.75.75 0 0 1-1.5 0V1.75ZM1.5 3.25a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 0 1.5h-3a.75.75 0 0 1-.75-.75Zm0 3a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 0 1.5h-3A.75.75 0 0 1 1.5 6.25Zm0 3a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 0 1.5h-3a.75.75 0 0 1-.75-.75Zm0 3a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 0 1.5h-3a.75.75 0 0 1-.75-.75Zm9.25-9h3a.75.75 0 0 1 0 1.5h-3a.75.75 0 0 1 0-1.5Zm0 3h3a.75.75 0 0 1 0 1.5h-3a.75.75 0 0 1 0-1.5Zm0 3h3a.75.75 0 0 1 0 1.5h-3a.75.75 0 0 1 0-1.5Zm0 3h3a.75.75 0 0 1 0 1.5h-3a.75.75 0 0 1 0-1.5Z" />
        </svg>
    );
}

export function NoteIcon(props: { class?: string }) {
    return (
        <svg viewBox="0 0 16 16" fill="currentColor" class={props.class ?? "h-3.5 w-3.5"}>
            <path d="M0 3.75C0 2.784.784 2 1.75 2h12.5c.966 0 1.75.784 1.75 1.75v7a1.75 1.75 0 0 1-1.75 1.75H9.06l-2.573 2.573A1.458 1.458 0 0 1 4 14.543V12.5H1.75A1.75 1.75 0 0 1 0 10.75Zm1.75-.25a.25.25 0 0 0-.25.25v7c0 .138.112.25.25.25h2.5a.75.75 0 0 1 .75.75v2.19l2.72-2.72a.749.749 0 0 1 .53-.22h4.5a.25.25 0 0 0 .25-.25v-7a.25.25 0 0 0-.25-.25Z" />
        </svg>
    );
}

export function FolderIcon(props: { class?: string }) {
    return (
        <svg viewBox="0 0 16 16" fill="currentColor" class={props.class ?? "h-3.5 w-3.5"}>
            <path d="M1.75 1A1.75 1.75 0 0 0 0 2.75v10.5C0 14.216.784 15 1.75 15h12.5A1.75 1.75 0 0 0 16 13.25v-8.5A1.75 1.75 0 0 0 14.25 3H7.5a.25.25 0 0 1-.2-.1l-.9-1.2C6.07 1.26 5.55 1 5 1Z" />
        </svg>
    );
}

export function ExpandIcon(props: { class?: string }) {
    return (
        <svg viewBox="0 0 16 16" fill="currentColor" class={props.class ?? "h-3.5 w-3.5"}>
            <path d="M1.75 1h4a.75.75 0 0 1 0 1.5H2.5v3.25a.75.75 0 0 1-1.5 0v-4A.75.75 0 0 1 1.75 1Zm8.5 0h4a.75.75 0 0 1 .75.75v4a.75.75 0 0 1-1.5 0V2.5h-3.25a.75.75 0 0 1 0-1.5ZM1.75 9.5a.75.75 0 0 1 .75.75v3.25h3.25a.75.75 0 0 1 0 1.5h-4a.75.75 0 0 1-.75-.75v-4a.75.75 0 0 1 .75-.75Zm12.5 0a.75.75 0 0 1 .75.75v4a.75.75 0 0 1-.75.75h-4a.75.75 0 0 1 0-1.5h3.25v-3.25a.75.75 0 0 1 .75-.75Z" />
        </svg>
    );
}

export function CompressIcon(props: { class?: string }) {
    return (
        <svg viewBox="0 0 16 16" fill="currentColor" class={props.class ?? "h-3.5 w-3.5"}>
            <path d="M5.75 1a.75.75 0 0 1 .75.75v4a.75.75 0 0 1-.75.75h-4a.75.75 0 0 1 0-1.5H5V1.75A.75.75 0 0 1 5.75 1Zm4.5 0a.75.75 0 0 1 .75.75V5h3.25a.75.75 0 0 1 0 1.5h-4a.75.75 0 0 1-.75-.75v-4a.75.75 0 0 1 .75-.75ZM1 10.25a.75.75 0 0 1 .75-.75h4a.75.75 0 0 1 .75.75v4a.75.75 0 0 1-1.5 0V11H1.75a.75.75 0 0 1-.75-.75Zm8.5 0a.75.75 0 0 1 .75-.75h4a.75.75 0 0 1 0 1.5H11v3.25a.75.75 0 0 1-1.5 0v-4Z" />
        </svg>
    );
}
