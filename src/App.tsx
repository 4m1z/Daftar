import { Title } from "@solidjs/meta";
import { Loading } from "solid-js";

import { NotesLoadingSkeleton } from "~/components/notes/notes-loading-skeleton";

import { Router } from "./router";
import "./tailwind.css";

export default function App() {
    return (
        <Router>
            {(props) => (
                <>
                    <Title>Notes</Title>
                    <Loading fallback={<NotesLoadingSkeleton />}>{props.children}</Loading>
                </>
            )}
        </Router>
    );
}
