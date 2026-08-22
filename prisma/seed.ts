import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const existingNotebook = await prisma.notebook.findFirst({ select: { id: true } });
    if (existingNotebook) {
        console.log("Workspace already contains a notebook; skipping showcase seed.");
        return;
    }

    const content = await readFile(new URL("./showcase-note.md", import.meta.url), "utf8");
    await prisma.notebook.create({
        data: {
            id: randomUUID(),
            name: "Welcome to Daftar",
            color: "6",
            notes: {
                create: {
                    id: randomUUID(),
                    title: "The Daftar Field Guide",
                    content,
                },
            },
        },
    });
    console.log("Seeded the Daftar showcase note.");
}

main()
    .catch((error: unknown) => {
        console.error(error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
