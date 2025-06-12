import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  build: {
    lib: {
      entry: {
        articulate: "src/entrypoints/entrypoint.ts",
        "theme-picker.element": "src/components/theme-picker.element.ts",
      },
      formats: ["es"],
      fileName: (format, entryName) => `${entryName}.js`,
    },
    outDir: "../App_Plugins/Articulate/BackOffice/",
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      external: [/^@umbraco-cms/],
    },
  },
  plugins: [tsconfigPaths()],
  base: "/App_Plugins/Articulate/BackOffice/",
});
