import { build, defineConfig } from "vite";
import react from "@vitejs/plugin-react";

async function buildAll() {
  const inputs = {
    index: "./pages/index.html",
    popup: "./pages/popup.html",
    background: "./src/background/background.ts",
    contentScript: "./src/contentScript/contentScript.ts",
  };

  await Object.entries(inputs).reduce(async function buildPair(
    prev,
    entry,
    index
  ) {
    await prev;
    const [name, input] = entry;

    await build(
      defineConfig({
        ...(index === 0 ? { publicDir: "./public" } : {}),
        plugins: [react()],
        build: {
          emptyOutDir: index === 0,
          outDir: "build",
          sourcemap: false,
          minify: true,
          rollupOptions: {
            input,
            output: {
              entryFileNames: "[name].js",
              format: "commonjs",
              inlineDynamicImports: true,
            },
          },
        },
      })
    );
  }, Promise.resolve());
}

buildAll();
