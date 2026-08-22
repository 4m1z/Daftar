export function EditorModeToggle(props: { enabled: boolean; onChange: (enabled: boolean) => void }) {
    const label = () => props.enabled ? "Switch to normal editing" : "Switch to Vim editing";

    return (
        <button
            type="button"
            onClick={() => props.onChange(!props.enabled)}
            aria-label={label()}
            aria-pressed={props.enabled ? "true" : "false"}
            title={label()}
            class="h-6 rounded px-2 text-[10px] font-semibold uppercase tracking-[0.12em] transition-colors"
            style={{
                background: props.enabled ? "var(--db-accent-soft)" : "var(--db-surface)",
                color: props.enabled ? "var(--db-accent)" : "var(--db-text3)",
            }}
        >
            {props.enabled ? "Vim" : "Normal"}
        </button>
    );
}
