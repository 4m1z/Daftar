import path from "node:path";

import solid from "@solidjs/vite-plugin";
import { fileRoutes } from "filesystem-routing/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    solid({
      start: { devtools: false },
      ssr: true,
      serverFunctions: { configure: "./src/server-config.ts" },
      extensions: [".jsx", ".tsx"],
    }),
    fileRoutes({ types: true }),
  ],
  resolve: {
    alias: { "~": path.resolve(process.cwd(), "src") },
  },
  server: { port: 3000 },
  build: { target: "esnext" },
});
