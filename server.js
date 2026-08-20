import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { Readable } from "node:stream";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { handleRequest } from "./dist/server/server.js";

const root = path.dirname(fileURLToPath(import.meta.url));
const port = process.env.PORT || 3000;
const mime = {
    ".js": "application/javascript",
    ".css": "text/css",
    ".json": "application/json",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
};

function webRequest(request) {
    const url = new URL(request.url || "/", `http://${request.headers.host || `localhost:${port}`}`);
    const method = request.method || "GET";
    const body = method === "GET" || method === "HEAD" ? undefined : Readable.toWeb(request);
    return new Request(url, { method, headers: request.headers, body, ...(body ? { duplex: "half" } : {}) });
}

createServer(async (request, response) => {
    const url = request.url || "/";
    if (url !== "/" && !url.includes("..")) {
        try {
            const pathname = url.split("?")[0];
            const content = readFileSync(path.resolve(root, `dist/client${pathname}`));
            response.setHeader("Content-Type", mime[path.extname(pathname)] || "application/octet-stream");
            response.end(content);
            return;
        } catch {
            // SSR routes and server functions fall through to Solid's handler.
        }
    }

    try {
        const result = await handleRequest(webRequest(request), { event: { nativeEvent: request } });
        response.statusCode = result.status;
        result.headers.forEach((value, key) => response.setHeader(key, value));
        if (result.body) for await (const chunk of result.body) response.write(chunk);
        response.end();
    } catch (error) {
        console.error(error);
        response.statusCode = 500;
        response.end("Internal server error");
    }
}).listen(port, () => console.log(`Notes is running at http://localhost:${port}`));
