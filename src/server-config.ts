// Pre-dispatch server-function configuration (wired via
// `serverFunctions.configure` in vite.config.ts). Registering the router as
// the single-flight collector turns a mutation into ONE round trip: the
// action response carries the refreshed query() data for the page the client
// will show, and the router seeds its cache from the envelope.
import { createFlightDataCollector } from "@solidjs/router/server";
import { configureServerFunctionsServer } from "@solidjs/web/server-functions/server";

import { Router } from "./router";

configureServerFunctionsServer({
    collectFlightData: createFlightDataCollector(Router),
});
