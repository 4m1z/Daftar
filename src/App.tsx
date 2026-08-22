import { Title } from "@solidjs/meta";
import { Loading } from "solid-js";

import { NotesLoadingSkeleton } from "~/components/feedback/notes-loading-skeleton";
import { DashboardThemeProvider } from "~/components/ui/dashboard-theme";

import { Router } from "./router";
import "./tailwind.css";

export default function App() {
    return (
        <DashboardThemeProvider>
            <Router>
                {(props) => (
                    <>
                        <Title>Notes</Title>
                        <Loading fallback={<NotesLoadingSkeleton />}>{props.children}</Loading>
                    </>
                )}
            </Router>
        </DashboardThemeProvider>
    );
}
