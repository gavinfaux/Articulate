/// <reference types="vite/client" />
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  build: {
    // The output directory for the build, relative to the project root.
    outDir: "../../App_Plugins/Articulate/Assets",
    // Manifest is not needed when using Smidge for cache busting.
    manifest: false,
    // Suppress the "outDir is not inside project root" warning and clean the dir.
    emptyOutDir: true,

    // Disable minification for easier debugging.
    minify: true,
    // Enable sourcemaps for debugging.
    sourcemap: mode === "development",

    rollupOptions: {
      input: "src/main.ts",
      output: {
        // Use predictable filenames without hashes for Smidge to handle.
        entryFileNames: `[name].js`,
        chunkFileNames: `[name].js`,
        assetFileNames: `[name].[ext]`,
      },
    },
  },
}));
