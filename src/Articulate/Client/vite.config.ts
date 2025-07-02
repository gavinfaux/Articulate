import * as fs from 'fs';
import * as path from 'path';
import { defineConfig } from "vite";

const pkg = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'package.json'), 'utf-8'));

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
      sourcemap: mode === 'development',
      rollupOptions: {
        external: [/^@umbraco/],
      },
    },
    define: {
      '__BUILD_DATE__': JSON.stringify(new Date().toISOString()),
      __PACKAGE_VERSION__: JSON.stringify(pkg.version),
    },
  };
});
