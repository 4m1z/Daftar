import { action, query } from "@solidjs/router";

import {
    createTemplate,
    deleteTemplate,
    ensurePredefinedTemplates,
    listTemplates,
    updateTemplate,
} from "~/models/templates.server";

export const getTemplatesData = query(async () => {
    "use server";
    await ensurePredefinedTemplates();
    return listTemplates();
}, "templates-data");

export const templatesAction = action(async (formData: FormData) => {
    "use server";
    const intent = String(formData.get("intent") ?? "");
    const id = String(formData.get("templateId") ?? "");
    if (!id) throw new Response("Template id is required", { status: 400 });

    let result: { updatedAt: Date };
    switch (intent) {
        case "createTemplate":
            result = await createTemplate({
                id,
                name: String(formData.get("name") ?? "Untitled Template"),
                description: String(formData.get("description") ?? ""),
                content: String(formData.get("content") ?? ""),
                category: String(formData.get("category") ?? "General"),
            });
            break;
        case "updateTemplate":
            result = await updateTemplate(id, {
                name: String(formData.get("name") ?? "Untitled Template"),
                description: String(formData.get("description") ?? ""),
                content: String(formData.get("content") ?? ""),
                category: String(formData.get("category") ?? "General"),
            });
            break;
        case "deleteTemplate":
            result = await deleteTemplate(id);
            break;
        default:
            throw new Response("Unknown templates action", { status: 400 });
    }
    return { ok: true, updatedAt: result.updatedAt.toISOString() };
}, "templates-action");
