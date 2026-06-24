import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  build: {
    lib: {
      entry: "src/index.ts",
      name: "SlopTape",
      fileName: "index",
      formats: ["es"],
    },
    sourcemap: true,
  },
  plugins: [dts({ rollupTypes: true, include: ["src"] })],
});
