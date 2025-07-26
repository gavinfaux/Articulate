import { defineConfig } from "vite";

export default defineConfig(({ mode }) => {
  return {
    build: {
      lib: {
        entry: "src/bundle.manifests.ts",
        formats: ["es"],
        fileName: "articulate",
      },
      outDir: "../wwwroot/App_Plugins/Articulate/",
      emptyOutDir: true,
      sourcemap: mode === "development",
      rollupOptions: {
        external: [/^@umbraco/],
      },
    },
  };
});
