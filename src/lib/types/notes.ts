export type NoteItem = {
    id: string;
    title: string;
    content: string;
    updatedAt: string;
};

export type Project = {
    id: string;
    name: string;
    color: string;
    isArchived: boolean;
    notes: NoteItem[];
};

export type NotesLoaderData = {
    projects: Project[];
    selectedProjectId: string;
    selectedNoteId: string;
    updatedAt: string | null;
};

export type PendingDelete = { kind: "project"; id: string; name: string } | { kind: "note"; id: string; title: string };

export type SearchResult = {
    projectId: string;
    noteId: string;
    projectName: string;
    projectColor: string;
    noteTitle: string;
    snippet: string;
    score: number;
};

export type SplitMode = "edit" | "preview" | "split";
