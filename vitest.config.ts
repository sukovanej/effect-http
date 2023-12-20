import * as path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.{test,spec}.?(c|m)[jt]s?(x)"],
    globals: true,
    setupFiles: "./tests/setupTests.ts",
    reporters: ["hanging-process", "default"],
  },
  resolve: {
    alias: {
      "effect-http": path.resolve(__dirname, "src"),
    },
  },
});
