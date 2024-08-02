import { defineConfig } from "vite";
import { resolve } from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [],
  build: {
    lib: {
      name: "kabelsalat",
      entry: resolve(__dirname, "src", "index.js"),
      formats: ["es", "iife"],
      fileName: (ext) => ({ es: "index.mjs", iife: "index.js" }[ext]),
    },
    rollupOptions: {},
    target: "esnext",
  },
});
