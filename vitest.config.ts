import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    setupFiles: "./tests/setupTests.ts",
    coverage: {
      provider: "c8",
    },
  },
  resolve: {
    alias: {
      "effect-http": path.resolve(__dirname, "/src"),
    },
  },
});
