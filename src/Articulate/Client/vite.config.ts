import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { outputPath } from "./config.outputPath.js";

export default defineConfig(({ mode }) => {
  return {
    build: {
      lib: {
        entry: "src/bundle.manifests.ts",
        formats: ["es"],
        fileName: "articulate",
      },
      outDir: outputPath, //"../wwwroot/App_Plugins/Articulate/BackOffice",
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
