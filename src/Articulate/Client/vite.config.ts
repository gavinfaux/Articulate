import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { defineConfig, Plugin } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

const outputPath = "../wwwroot/App_Plugins/Articulate/Backoffice"
const versioningPlugin = (command: string, mode: string): Plugin => {
  let version = "0.0.0-dev";
  const umbracoPackageJson = "umbraco-package.json";

  return {
    name: "articulate-versioning",
    config: () => {
      if (command !== "build" || mode !== "production") {
        return;
      }
      try {
        const gitRoot = execSync("git rev-parse --show-toplevel", { encoding: "utf8" }).trim();
        version = execSync("nbgv get-version -v SemVer2", { encoding: "utf8", cwd: gitRoot }).trim();
        console.log(`Using version ${version} from nbgv`);
      } catch (e) {
        console.error("Could not get version from nbgv, using local version");
      }
      return {
        define: {
          "import.meta.env.APP_VERSION": JSON.stringify(version),
        },
      };
    },
    closeBundle: () => {
      if (command !== "build" || mode !== "production") {
        return;
      }
      console.log(`Updating ${umbracoPackageJson} version to ${version}`);
      const packageJsonPath = path.join(outputPath, umbracoPackageJson);

      if (!fs.existsSync(packageJsonPath)) {
        console.error(`Could not find ${packageJsonPath}`);
        return;
      }

      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
      packageJson.version = version;
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

      const newPath = path.resolve(outputPath, "..", umbracoPackageJson);
      fs.renameSync(packageJsonPath, newPath);
      console.log(`Moved ${packageJsonPath} to ${newPath}`);
    },
  };
};

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  return {
    build: {
      lib: {
        entry: "src/bundle.manifests.ts",
        formats: ["es"],
        fileName: "articulate",
      },
      outDir: outputPath, 
      emptyOutDir: true,
      sourcemap: true,
      rollupOptions: {
        external: [/^@umbraco/],
        output: {
          entryFileNames: `[name].js`,
          chunkFileNames: `[name].js`,
          assetFileNames: `[name].[ext]`,
        },
      },
    },
    plugins: [tsconfigPaths(), versioningPlugin(command, mode)],
  };
});
