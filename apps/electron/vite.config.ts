import { builtinModules } from "node:module";
import { defineConfig } from "vite-plus";
import { resolve } from "node:path";

/**
 * Electron main / preload run in Node, so `electron` and every Node builtin
 * must stay external instead of being bundled into `dist`.
 */
const external = ["electron", ...builtinModules, ...builtinModules.map((name) => `node:${name}`)];

export default defineConfig({
  fmt: {},
  lint: {
    jsPlugins: [{ name: "vite-plus", specifier: "vite-plus/oxlint-plugin" }],
    rules: { "vite-plus/prefer-vite-plus-imports": "error" },
    options: { typeAware: true, typeCheck: true },
  },
  resolve: {
    alias: {
      "@main": resolve(__dirname, "src/main"),
      "@preload": resolve(__dirname, "src/preload"),
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    target: "node22",
    sourcemap: true,
    minify: false,
    // Two entry points -> dist/main/index.cjs + dist/preload/index.cjs.
    // CommonJS keeps `__dirname` working in the main process, and Electron
    // loads a `.cjs` preload as CommonJS even though this package is `type: module`.
    lib: {
      entry: {
        main: "src/main/index.ts",
        preload: "src/preload/index.ts",
      },
      formats: ["cjs"],
      fileName: (_format, entryName) => `${entryName}/index.cjs`,
    },
    rollupOptions: {
      external,
      output: {
        entryFileNames: "[name]/index.cjs",
        chunkFileNames: "chunks/[name]-[hash].cjs",
        assetFileNames: "assets/[name]-[hash][extname]",
      },
    },
  },
});
