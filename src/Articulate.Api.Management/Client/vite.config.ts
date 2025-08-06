import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { defineConfig, Plugin } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
//import { outputPath } from "./config.outputPath.js";


const outputPath = "../wwwroot/App_Plugins/Articulate/BackOffice";

const getVersion = (command: string, mode: string): string | undefined => {
  if (command !== "build" || mode !== "production") {
    return;
  }
  try {
    const gitRoot = execSync("git rev-parse --show-toplevel", { encoding: "utf8" }).trim();
    const version = execSync("nbgv get-version -v SemVer2", { encoding: "utf8", cwd: gitRoot }).trim();
    console.log(`Using version ${version} from nbgv`);
    return version;
  } catch (e) {
    console.error("Could not get version from nbgv, using local version");
  }
  return "0.0.0-dev";
};

const umbracoPackagePlugin = (): Plugin => {
  const umbracoPackageJson = "umbraco-package.json";
  let command: string;
  let mode: string;
  return {
    name: "umbraco-package-plugin",
    config: (_config, { command: cmd, mode: m }) => {
      command = cmd;
      mode = m;
      return;
    },
    closeBundle: () => {
      if (command !== "build") {
        return;
      }
      const packageJsonPath = path.join(outputPath, umbracoPackageJson);

      if (!fs.existsSync(packageJsonPath)) {
        console.error(`Could not find ${packageJsonPath}`);
        return;
      }

       const newPath = path.resolve(outputPath, "..", umbracoPackageJson);
      fs.renameSync(packageJsonPath, newPath);
      console.log(`Moved ${packageJsonPath} to ${newPath}`);
    },
  };

}
const versioningPlugin = (): Plugin => {
  const umbracoPackageJson = "umbraco-package.json";
  let command: string;
  let mode: string;
  let version: string | undefined;

  return {
    name: "versioning-plugin",
    config: (_config, { command: cmd, mode: m }) => {
      command = cmd;
      mode = m;
      version = getVersion(command, mode);

      if (!version) {
        return;
      }

      return {
        define: {
          "import.meta.env.APP_VERSION": JSON.stringify(version),
        },
      };
    },
    closeBundle: () => {
      if (command !== "build" || mode !== "production" || !version) {
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

      // update package version for local NuGet package feed/tests
      console.log(`Updating package.json version to ${version}`);
      const npmCommand = `npm version ${version} --allow-same-version --no-git-tag-version`;
      execSync(npmCommand, { encoding: "utf8" });
    },
  };
};

// https://vitejs.dev/config/
export default defineConfig({
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
    },
  },
  plugins: [tsconfigPaths(), versioningPlugin(), umbracoPackagePlugin()],
});
