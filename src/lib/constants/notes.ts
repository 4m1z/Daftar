export const NOTEBOOK_COLOR_COUNT = 8;
export const DEFAULT_NOTEBOOK_COLOR = "1";

/** Debounce (ms) before persisting note edits. */
export const NOTE_SAVE_DELAY = 600;

/** Debounce (ms) before persisting notebook renames. */
export const PROJECT_SAVE_DELAY = 400;

/** Maximum number of search results returned. */
export const MAX_SEARCH_RESULTS = 50;

export const TEMPLATE_CATEGORIES = ["Journaling", "Work", "Productivity", "Development", "Learning", "General"] as const;
export type TemplateCategory = (typeof TEMPLATE_CATEGORIES)[number];
export const DEFAULT_TEMPLATE_CATEGORY: TemplateCategory = "General";
