export interface SlashCommand {
    id: string;
    label: string;
    category: string;
    insert: string;
    description: string;
    icon?: string;
    /** Caret offset inside `insert`; defaults to the end of the inserted text. */
    cursor?: number;
    action?: "drawing";
}

export const SLASH_COMMANDS: SlashCommand[] = [
    { id: "heading1", label: "Heading 1", category: "Basic Formatting", insert: "# ", description: "Large heading", icon: "H1" },
    { id: "heading2", label: "Heading 2", category: "Basic Formatting", insert: "## ", description: "Medium heading", icon: "H2" },
    { id: "heading3", label: "Heading 3", category: "Basic Formatting", insert: "### ", description: "Small heading", icon: "H3" },
    { id: "heading4", label: "Heading 4", category: "Basic Formatting", insert: "#### ", description: "Smallest heading", icon: "H4" },
    { id: "paragraph", label: "Normal Text", category: "Basic Formatting", insert: "", description: "Regular paragraph", icon: "¶" },
    { id: "bold", label: "Bold", category: "Basic Formatting", insert: "****", cursor: 2, description: "Bold text", icon: "B" },
    { id: "italic", label: "Italic", category: "Basic Formatting", insert: "**", cursor: 1, description: "Italic text", icon: "I" },
    { id: "blockquote", label: "Blockquote", category: "Basic Formatting", insert: "> ", description: "Quoted text", icon: "❝" },
    { id: "hr", label: "Horizontal Rule", category: "Basic Formatting", insert: "\n---\n", description: "Divider line", icon: "—" },
    { id: "inlineCode", label: "Inline Code", category: "Basic Formatting", insert: "``", cursor: 1, description: "Inline code", icon: "</>" },
    { id: "codeBlock", label: "Code Block", category: "Basic Formatting", insert: "```\n\n```", cursor: 4, description: "Code block", icon: "{}" },
    { id: "orderedList", label: "Ordered List", category: "Basic Formatting", insert: "1. ", description: "Numbered list", icon: "1." },
    { id: "unorderedList", label: "Unordered List", category: "Basic Formatting", insert: "- ", description: "Bullet list", icon: "•" },
    { id: "taskList", label: "Task List", category: "Basic Formatting", insert: "- [ ] ", description: "Task checkbox", icon: "☐" },
    { id: "link", label: "Link", category: "Basic Formatting", insert: "[]()", cursor: 1, description: "Hyperlink", icon: "🔗" },
    { id: "image", label: "Image", category: "Basic Formatting", insert: "![]()", cursor: 2, description: "Image embed", icon: "🖼" },
    { id: "noteLink", label: "Note Link", category: "Basic Formatting", insert: "[[note name]]", description: "Link to note", icon: "📎" },
    { id: "drawing", label: "Drawing", category: "Insert", insert: "", description: "Excalidraw drawing", icon: "✏️", action: "drawing" },
    { id: "alertNote", label: "Note Alert", category: "GitHub Alerts", insert: "> [!NOTE]\n> ", description: "Note callout", icon: "📝" },
    { id: "alertTip", label: "Tip Alert", category: "GitHub Alerts", insert: "> [!TIP]\n> ", description: "Tip callout", icon: "💡" },
    { id: "alertImportant", label: "Important Alert", category: "GitHub Alerts", insert: "> [!IMPORTANT]\n> ", description: "Important callout", icon: "❗" },
    { id: "alertWarning", label: "Warning Alert", category: "GitHub Alerts", insert: "> [!WARNING]\n> ", description: "Warning callout", icon: "⚠️" },
    { id: "alertCaution", label: "Caution Alert", category: "GitHub Alerts", insert: "> [!CAUTION]\n> ", description: "Caution callout", icon: "🛑" },
];

export function parseSlashQuery(lineText: string, cursorColumn: number): { from: number; query: string } | null {
    const match = /^(\s*)\/(.*)$/.exec(lineText.slice(0, cursorColumn));
    return match ? { from: match[1].length, query: match[2] } : null;
}

export function getFilteredCommands(query: string): SlashCommand[] {
    const lowerQuery = query.toLowerCase().trim();
    if (!lowerQuery) return SLASH_COMMANDS;
    return SLASH_COMMANDS.filter((command) =>
        [command.id, command.label, command.category, command.description]
            .some((value) => value.toLowerCase().includes(lowerQuery)),
    );
}

export function getCommandCategories(): Record<string, SlashCommand[]> {
    const categories: Record<string, SlashCommand[]> = {};
    for (const command of SLASH_COMMANDS) (categories[command.category] ??= []).push(command);
    return categories;
}
