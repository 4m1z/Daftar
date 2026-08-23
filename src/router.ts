import { createRouter } from "@solidjs/router";

import NotesIndexRoute from "~/routes";
import NotesLayoutRoute from "~/routes/layout";
import NoteLayoutRoute from "~/routes/note-layout";
import NoteModeRoute from "~/routes/note-mode";
import NotebookIndexRoute from "~/routes/notebook-index";
import NotebookLayoutRoute from "~/routes/notebook-layout";

export const Router = createRouter({
    routes: [
        {
            path: "/",
            component: NotesLayoutRoute,
            children: [
                { path: "/", component: NotesIndexRoute },
                {
                    path: "/notes/:notebookId",
                    component: NotebookLayoutRoute,
                    children: [
                        { path: "/", component: NotebookIndexRoute },
                        {
                            path: "/note/:noteId",
                            component: NoteLayoutRoute,
                            children: [
                                { path: "/:mode", component: NoteModeRoute },
                            ],
                        },
                    ],
                },
            ],
        },
    ],
});

export const { paths } = Router;
