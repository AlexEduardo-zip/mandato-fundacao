import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const src = (pkg: string) =>
  fileURLToPath(new URL(`./packages/${pkg}/src/index.ts`, import.meta.url));

export const sharedConfig = defineConfig({
  resolve: {
    alias: {
      "@mandato/engine": src("engine"),
      "@mandato/content": src("content"),
      "@mandato/tools": src("tools"),
      "@mandato/cli": src("cli"),
    },
  },
  test: { include: ["src/**/*.test.ts"] },
});
