import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { createGzip, gzip } from "node:zlib";

import { handleRequest } from "./dist/server/server.js";

const root = path.dirname(fileURLToPath(import.meta.url));
const clientRoot = path.resolve(root, "dist/client");
const port = process.env.PORT || 3000;
const gzipBuffer = promisify(gzip);
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

function acceptsGzip(request) {
    return (request.headers["accept-encoding"] || "")
        .split(",")
        .some((value) => value.trim().startsWith("gzip") && !value.includes("q=0"));
}

function isCompressible(contentType) {
    return /^(?:text\/|application\/(?:javascript|json)|image\/svg\+xml)/.test(contentType);
}

function setCompressionHeaders(response) {
    const vary = response.getHeader("Vary");
    response.setHeader("Vary", vary ? `${vary}, Accept-Encoding` : "Accept-Encoding");
    response.setHeader("Content-Encoding", "gzip");
    response.removeHeader("Content-Length");
}

function webRequest(request) {
    const url = new URL(request.url || "/", `http://${request.headers.host || `localhost:${port}`}`);
    const method = request.method || "GET";
    const body = method === "GET" || method === "HEAD" ? undefined : Readable.toWeb(request);
    return new Request(url, { method, headers: request.headers, body, ...(body ? { duplex: "half" } : {}) });
}

createServer(async (request, response) => {
    const url = request.url || "/";
    const pathname = new URL(url, `http://localhost:${port}`).pathname;
    if (pathname !== "/") {
        try {
            const filePath = path.resolve(clientRoot, `.${decodeURIComponent(pathname)}`);
            if (!filePath.startsWith(`${clientRoot}${path.sep}`)) throw new Error("Invalid asset path");

            const content = await readFile(filePath);
            const contentType = mime[path.extname(pathname)] || "application/octet-stream";
            response.setHeader("Content-Type", contentType);
            response.setHeader(
                "Cache-Control",
                pathname.startsWith("/assets/") ? "public, max-age=31536000, immutable" : "no-cache",
            );

            if (request.method === "HEAD") {
                response.setHeader("Content-Length", content.byteLength);
                response.end();
                return;
            }
            if (acceptsGzip(request) && isCompressible(contentType)) {
                const compressed = await gzipBuffer(content);
                setCompressionHeaders(response);
                response.setHeader("Content-Length", compressed.byteLength);
                response.end(compressed);
                return;
            }

            response.setHeader("Content-Length", content.byteLength);
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
        if (request.method === "HEAD" || !result.body) {
            response.end();
            return;
        }

        const body = Readable.fromWeb(result.body);
        if (acceptsGzip(request) && isCompressible(result.headers.get("content-type") || "")) {
            setCompressionHeaders(response);
            await pipeline(body, createGzip(), response);
            return;
        }
        await pipeline(body, response);
    } catch (error) {
        console.error(error);
        if (response.headersSent) {
            response.destroy(error);
            return;
        }
        response.statusCode = 500;
        response.end("Internal server error");
    }
}).listen(port, () => console.log(`Notes is running at http://localhost:${port}`));
