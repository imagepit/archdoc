import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    "bin/archdoc": "bin/archdoc.ts",
    "src/index": "src/index.ts",
  },
  format: "esm",
  dts: true,
  clean: true,
  target: "node18",
  splitting: false,
  sourcemap: true,
});
