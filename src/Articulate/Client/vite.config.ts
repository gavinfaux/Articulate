import { defineConfig } from "vite";

export default defineConfig(({ mode }) => {
  return {
    build: {
      lib: {
        entry: "src/bundle.manifests.ts",
        formats: ["es"],
        fileName: "articulate",
      },
      outDir: "../App_Plugins/Articulate/BackOffice/",
      emptyOutDir: true,
      sourcemap: mode === "development",
      rollupOptions: {
        external: [/^@umbraco/],
      },
    },
  };
});
