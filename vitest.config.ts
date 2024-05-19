import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    include: ["test/**/*.{test,spec}.?(c|m)[jt]s?(x)"],
    reporters: ["hanging-process", "default"],
    sequence: {
      concurrent: true
    },
    chaiConfig: {
      truncateThreshold: 10000
    }
  }
})
