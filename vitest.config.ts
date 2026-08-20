import { resolve } from "node:path";

import solid from "@solidjs/vite-plugin";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [solid() as never],
  resolve: {
    conditions: ["development", "browser"],
    alias: { "~": resolve(process.cwd(), "src") },
  },
  test: {
    environment: "jsdom",
    globals: true,
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    setupFiles: ["./vitest.setup.ts"],
  },
});
