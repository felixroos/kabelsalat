import { defineConfig } from "vite";
// import { dependencies } from "./package.json";
import { resolve } from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [],
  optimizeDeps: {
    exclude: ["acorn"],
  },
  build: {
    lib: {
      name: "kabelsalat",
      entry: resolve(__dirname, "src", "index.js"),
      formats: ["es", "iife"],
      fileName: (ext) => ({ es: "index.mjs", iife: "index.js" }[ext]),
    },
    rollupOptions: {
      // external: [...Object.keys(dependencies)],
    },
    target: "esnext",
  },
});
