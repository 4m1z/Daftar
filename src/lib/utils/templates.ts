/** Replaces template placeholders without touching the stored template. */
export function fillTemplatePlaceholders(content: string, date = new Date()): string {
    return content.replace(/{{date}}/g, date.toISOString().slice(0, 10));
}

/** One-line plain-text preview of a template's markdown content. */
export function templatePreview(content: string): string {
    const line = content
        .split("\n")
        .map((item) => item.trim())
        .find((item) => item.length > 0);
    if (!line) return "";
    return line
        .replace(/^#{1,6}\s*/, "")
        .replace(/[*_`~>[\]]/g, "")
        .trim();
}
