import type { Prisma } from "@prisma/client";

import { prisma } from "~/db.server";
import type { Project } from "~/lib/notes/types";

export async function listNotesProjects(): Promise<Project[]> {
    const notebooks = await prisma.notebook.findMany({
        orderBy: [{ sortOrder: "asc" }, { updatedAt: "asc" }],
        select: {
            id: true,
            name: true,
            color: true,
            notes: {
                orderBy: [{ sortOrder: "asc" }, { updatedAt: "asc" }],
                select: { id: true, title: true, content: true, updatedAt: true },
            },
        },
    });

    return notebooks.map((notebook) => ({
        id: notebook.id,
        name: notebook.name,
        color: notebook.color,
        notes: notebook.notes.map((note) => ({ ...note, updatedAt: note.updatedAt.toISOString() })),
    }));
}

export async function createNotebook({
    id,
    name,
    color,
    firstNoteId,
}: {
    id: string;
    name: string;
    color: string;
    firstNoteId: string;
}) {
    return prisma.$transaction(async (tx) => {
        await tx.notebook.create({
            data: {
                id,
                name,
                color,
                sortOrder: await nextNotebookSortOrder(tx),
                notes: {
                    create: { id: firstNoteId, title: "First note", content: "", sortOrder: 0 },
                },
            },
        });
        return { updatedAt: new Date() };
    });
}

export async function renameNotebook(id: string, name: string) {
    const result = await prisma.notebook.updateMany({ where: { id }, data: { name } });
    if (result.count === 0) throw new Response("Notebook not found", { status: 404 });
    return { updatedAt: new Date() };
}

export async function deleteNotebook(id: string) {
    await prisma.notebook.deleteMany({ where: { id } });
    return { updatedAt: new Date() };
}

export async function createNote({ notebookId, noteId }: { notebookId: string; noteId: string }) {
    const notebook = await prisma.notebook.findUnique({ where: { id: notebookId }, select: { id: true } });
    if (!notebook) throw new Response("Notebook not found", { status: 404 });

    return prisma.note.create({
        data: {
            id: noteId,
            notebookId,
            title: "Untitled",
            content: "",
            sortOrder: await nextNoteSortOrder(prisma, notebookId),
        },
        select: { updatedAt: true },
    });
}

export async function updateNote(noteId: string, { title, content }: { title: string; content: string }) {
    const result = await prisma.note.updateMany({ where: { id: noteId }, data: { title, content } });
    if (result.count === 0) throw new Response("Note not found", { status: 404 });
    return { updatedAt: new Date() };
}

export async function deleteNote(noteId: string) {
    await prisma.note.deleteMany({ where: { id: noteId } });
    return { updatedAt: new Date() };
}

async function nextNotebookSortOrder(client: Prisma.TransactionClient | typeof prisma) {
    const notebook = await client.notebook.findFirst({
        orderBy: { sortOrder: "desc" },
        select: { sortOrder: true },
    });
    return (notebook?.sortOrder ?? -1) + 1;
}

async function nextNoteSortOrder(client: Prisma.TransactionClient | typeof prisma, notebookId: string) {
    const note = await client.note.findFirst({
        where: { notebookId },
        orderBy: { sortOrder: "desc" },
        select: { sortOrder: true },
    });
    return (note?.sortOrder ?? -1) + 1;
}
