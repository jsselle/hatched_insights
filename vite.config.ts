import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  publicDir: "./public",
  plugins: [react()],
  build: {
    sourcemap: true,
    minify: true,
    outDir: "build",
    rollupOptions: {
      input: {
        index: "./pages/index.html",
        background: "./src/background.js",
        contentScript: "./src/contentScript.ts",
      },
      output: {
        entryFileNames: "[name].js",
        format: "iife",
        inlineDynamicImports: true,
      },
    },
  },
});
