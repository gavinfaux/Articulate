import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  build: {
    lib: {
      entry: "src/entrypoints/entrypoint.ts",
      formats: ["es"],
    },
    outDir: "../wwwroot/App_Plugins/Articulate",
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      external: [/^@umbraco-cms/]
//      onwarn: () => { },
    },
  },
  plugins: [tsconfigPaths()],
  base: "/App_Plugins/Articulate/"
});
