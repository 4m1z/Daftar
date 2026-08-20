CREATE TABLE "NotesNotebook" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "NotesEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "notebookId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "NotesEntry_notebookId_fkey" FOREIGN KEY ("notebookId") REFERENCES "NotesNotebook" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "NotesNotebook_sortOrder_idx" ON "NotesNotebook"("sortOrder");
CREATE INDEX "NotesEntry_notebookId_sortOrder_idx" ON "NotesEntry"("notebookId", "sortOrder");
