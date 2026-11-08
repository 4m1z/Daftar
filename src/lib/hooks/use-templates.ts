import { useAction } from "@solidjs/router";
import { createEffect, createMemo, createSignal, untrack } from "solid-js";

import { getTemplatesData, templatesAction } from "~/lib/actions/templates";
import type { Template } from "~/models/templates.server";
import { uid } from "~/lib/utils/notes";

export function useTemplates() {
    const data = createMemo(() => getTemplatesData());
    const runTemplatesAction = useAction(templatesAction);
    const [inFlight, setInFlight] = createSignal(0);
    const [pendingCreate, setPendingCreate] = createSignal<Record<string, true>>({});
    const [pendingDelete, setPendingDelete] = createSignal<Record<string, true>>({});

    let initialized = false;

    const [templates, setTemplates] = createSignal<Template[]>([]);

    createEffect(
        () => data(),
        (loaded) => {
            if (!loaded || initialized) return;
            initialized = true;
            setTemplates(loaded);
        },
    );

    const submit = (values: Record<string, string>) => {
        const formData = new FormData();
        for (const [key, value] of Object.entries(values)) formData.set(key, value);
        setInFlight((count) => count + 1);
        return runTemplatesAction(formData)
            .then(() => true)
            .catch((error) => {
                console.error("[templates] mutation failed", error);
                return false;
            })
            .finally(() => setInFlight((count) => Math.max(0, count - 1)));
    };

    const createTemplate = (template: {
        name: string;
        description?: string | null;
        content: string;
        category: string;
    }) => {
        const id = uid();
        const newTemplate: Template = {
            ...template,
            description: template.description ?? null,
            id,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isPredefined: false,
        };
        setTemplates((current) => [...current, newTemplate]);
        setPendingCreate((current) => ({ ...current, [id]: true }));
        void submit({
            intent: "createTemplate",
            templateId: id,
            name: template.name,
            description: template.description ?? "",
            content: template.content,
            category: template.category,
        }).finally(() =>
            setPendingCreate((current) => {
                if (!(id in current)) return current;
                const next = { ...current };
                delete next[id];
                return next;
            }),
        );
        return id;
    };

    const updateTemplate = (id: string, updates: Partial<Pick<Template, "name" | "description" | "content" | "category">>) => {
        setTemplates((current) =>
            current.map((template) => (template.id === id ? { ...template, ...updates, updatedAt: new Date().toISOString() } : template)),
        );
        const template = untrack(templates).find((t) => t.id === id);
        if (!template) return;
        void submit({
            intent: "updateTemplate",
            templateId: id,
            name: updates.name ?? template.name,
            description: updates.description ?? template.description ?? "",
            content: updates.content ?? template.content,
            category: updates.category ?? template.category,
        });
    };

    const deleteTemplate = (id: string) => {
        const template = untrack(templates).find((t) => t.id === id);
        if (template?.isPredefined) return; // Prevent deleting predefined templates
        setTemplates((current) => current.filter((template) => template.id !== id));
        setPendingDelete((current) => ({ ...current, [id]: true }));
        void submit({ intent: "deleteTemplate", templateId: id }).finally(() =>
            setPendingDelete((current) => {
                if (!(id in current)) return current;
                const next = { ...current };
                delete next[id];
                return next;
            }),
        );
    };

    const duplicateTemplate = (id: string) => {
        const template = untrack(templates).find((t) => t.id === id);
        if (!template) return;
        return createTemplate({
            name: `${template.name} (Copy)`,
            description: template.description,
            content: template.content,
            category: template.category,
        });
    };

    const templatesByCategory = createMemo(() => {
        const grouped: Record<string, Template[]> = {};
        for (const template of templates()) {
            const category = template.category || "General";
            if (!grouped[category]) grouped[category] = [];
            grouped[category].push(template);
        }
        return grouped;
    });

    const predefinedTemplates = createMemo(() => templates().filter((t) => t.isPredefined));
    const customTemplates = createMemo(() => templates().filter((t) => !t.isPredefined));
    const isSaving = createMemo(() => inFlight() > 0);

    return {
        templates,
        templatesByCategory,
        predefinedTemplates,
        customTemplates,
        isSaving,
        pendingCreate,
        pendingDelete,
        isTemplateBusy: (id: string) => Boolean(pendingCreate()[id] ?? pendingDelete()[id]),
        createTemplate,
        updateTemplate,
        deleteTemplate,
        duplicateTemplate,
    };
}

export type TemplatesStore = ReturnType<typeof useTemplates>;