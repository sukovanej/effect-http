import * as path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
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
