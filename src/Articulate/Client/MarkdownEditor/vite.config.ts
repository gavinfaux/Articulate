/// <reference types="vite/client" />
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  build: {
    // The output directory for the build, relative to the project root.
    outDir: "../../App_Plugins/Articulate/Assets",
    // Generate a manifest file for server-side integration.
    manifest: false,
    // Suppress the "outDir is not inside project root" warning and clean the dir.
    emptyOutDir: true,

    // Disable minification for easier debugging.
    minify: false,
    // Enable sourcemaps for debugging.
    sourcemap: mode === "development",

    rollupOptions: {
      // Explicitly set the entry point to our script, ignoring index.html.
      input: "src/main.ts",
      output: {
        // Output files directly into outDir without an 'assets' subdirectory.
        // We are disabling hashing to have predictable file names for the .cshtml.
        entryFileNames: `[name].js`,
        chunkFileNames: `[name].js`,
        assetFileNames: `[name].[ext]`,
      },
    },
  },
}));
