import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import solidJs from "@astrojs/solid-js";
import bundleAudioWorkletPlugin from "vite-plugin-bundle-audioworklet";
import mdx from "@astrojs/mdx";

// https://astro.build/config
export default defineConfig({
  integrations: [tailwind(), solidJs(), mdx()],
  base: "/",
  vite: {
    plugins: [bundleAudioWorkletPlugin()],
  },
});
