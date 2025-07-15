import { defineConfig } from "vite";
import { resolve } from "path";
import bundleAudioWorkletPlugin from "vite-plugin-bundle-audioworklet";

// https://vitejs.dev/config/
export default defineConfig({
  //base: "./", // this changes the worklet urls..
  // with base "./", the worklet URL becomes /node_modules/.vite/deps/assets/worklet-B8fb_TPB.js
  // -> new URL("assets/worklet-DzGFm3ry.js", import.meta.url).href
  // witout base, the worklet URL becomes /assets/worklet-DzGFm3ry.js
  // -> "/assets/worklet-DzGFm3ry.js"
  // both don't work out of the box (404), but the latter can be worked around by copying the file to public/assets
  // the former doesn't work with copying because it seems node_modules is filtered out when serving files
  // all of this is relevant for esm, in cjs it seems to work with base, not sure what happens without...
  plugins: [bundleAudioWorkletPlugin()],
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
