import { Title } from "@solidjs/meta";
import { Loading } from "solid-js";

import { NotesLoadingSkeleton } from "~/components/feedback/notes-loading-skeleton";
import { ThemeProvider } from "~/components/ui/theme";

import { Router } from "./router";
import "./tailwind.css";

export default function App() {
    return (
        <ThemeProvider>
            <Router>
                {(props) => (
                    <>
                        <Title>Daftar</Title>
                        <Loading fallback={<NotesLoadingSkeleton />}>{props.children}</Loading>
                    </>
                )}
            </Router>
        </ThemeProvider>
    );
}
