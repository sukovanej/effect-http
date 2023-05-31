import { defineConfig } from "tsup";

export default defineConfig({
  dts: true,
  bundle: false,
  treeshake: true,
  target: "node16",
  format: ["esm", "cjs"],
  entry: ["src/**/*.ts"],
  tsconfig: "tsconfig.build.json",
  clean: true
});
