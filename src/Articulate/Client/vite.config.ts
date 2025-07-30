import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ mode }) => {
  return {
    build: {
      lib: {
        entry: "src/bundle.manifests.ts",
        formats: ["es"],
        fileName: "articulate",
      },
      outDir: "../wwwroot/App_Plugins/Articulate/Backoffice",
      emptyOutDir: true,
      sourcemap: true,
      rollupOptions: {
        external: [/^@umbraco/],
        onwarn: () => { },
      },
    },
    plugins: [tsconfigPaths()]
  };
});
