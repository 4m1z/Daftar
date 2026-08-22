import { createSignal, onSettled } from "solid-js";

const EDITOR_MODE_KEY = "notes-editor-mode";

export function useEditorMode() {
    const [vimMode, setVimModeState] = createSignal(true);

    onSettled(() => {
        setVimModeState(window.localStorage.getItem(EDITOR_MODE_KEY) !== "normal");
    });

    const setVimMode = (enabled: boolean) => {
        setVimModeState(enabled);
        window.localStorage.setItem(EDITOR_MODE_KEY, enabled ? "vim" : "normal");
    };

    return { vimMode, setVimMode };
}
