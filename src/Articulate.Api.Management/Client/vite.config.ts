import { execSync } from "child_process";
import fs, { promises as fsp } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { build as esbuildBuild, transform as esbuildTransform } from "esbuild";
import { defineConfig, Plugin } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type LightningWarning = import("lightningcss").Warning;
type EsbuildMessage = import("esbuild").Message;

const projectRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(projectRoot, "..", "..");
const webProjectRoot = path.resolve(projectRoot, "..", "Articulate.Web");
const outputPath = path.resolve(projectRoot, "wwwroot/App_Plugins/Articulate/BackOffice");

const resolveWebAsset = (relativePath: string) => path.resolve(webProjectRoot, relativePath);
const relativeToRepo = (absolutePath: string) => path.relative(repoRoot, absolutePath);

type BundleMode = "concat" | "bundle";

type BundleDefinition = {
  name: string;
  loader: "css" | "js";
  output: string;
  mode: BundleMode;
  inputs: string[];
  entry?: string;
};

const themesRoot = resolveWebAsset("wwwroot/App_Plugins/Articulate/Themes");
const markdownEditorRoot = resolveWebAsset("wwwroot/App_Plugins/Articulate/MarkdownEditor");

const isCssFile = (filePath: string) => path.extname(filePath).toLowerCase() === ".css";
const isJsFile = (filePath: string) => path.extname(filePath).toLowerCase() === ".js";

const collectFiles = (dir: string, predicate: (file: string) => boolean): string[] => {
  if (!fs.existsSync(dir)) {
    return [];
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name));
  const results: string[] = [];

  for (const entry of entries) {
    if (entry.name.startsWith(".")) {
      continue;
    }

    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (entry.name === "dist") {
        continue;
      }
      results.push(...collectFiles(fullPath, predicate));
    } else if (predicate(fullPath)) {
      results.push(fullPath);
    }
  }

  return results;
};

const getThemeBundles = (): BundleDefinition[] => {
  if (!fs.existsSync(themesRoot)) {
    return [];
  }

  const bundles: BundleDefinition[] = [];
  const themeDirs = fs
    .readdirSync(themesRoot, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory() && !dirent.name.startsWith("."));

  for (const dirent of themeDirs) {
    const themePath = path.join(themesRoot, dirent.name);
    const themeKey = dirent.name.toLowerCase();

    const cssFromSrc = collectFiles(path.join(themePath, "src"), isCssFile);
    const cssFromAssets = collectFiles(path.join(themePath, "assets", "css"), isCssFile);
    const cssInputs = cssFromSrc.length > 0 ? cssFromSrc : cssFromAssets;

    if (cssInputs.length > 0) {
      bundles.push({
        name: `${dirent.name} CSS`,
        loader: "css",
        output: path.join(themePath, "dist/css", `${themeKey}.css`),
        mode: "concat",
        inputs: cssInputs,
      });
    }

    const jsFromSrc = collectFiles(path.join(themePath, "src"), isJsFile);
    const jsFromAssets = collectFiles(path.join(themePath, "assets", "js"), isJsFile);
    const jsInputs = jsFromSrc.length > 0 ? jsFromSrc : jsFromAssets;

    if (jsInputs.length > 0) {
      bundles.push({
        name: `${dirent.name} JS`,
        loader: "js",
        output: path.join(themePath, "dist/js", `${themeKey}.js`),
        mode: "concat",
        inputs: jsInputs,
      });
    }
  }

  return bundles;
};

const getMarkdownEditorBundles = (): BundleDefinition[] => {
  if (!fs.existsSync(markdownEditorRoot)) {
    return [];
  }

  const bundles: BundleDefinition[] = [];
  const markdownCssFromSrc = collectFiles(path.join(markdownEditorRoot, "src"), isCssFile);
  const markdownCssFromAssets = collectFiles(path.join(markdownEditorRoot, "assets", "css"), isCssFile);
  const cssInputs = markdownCssFromSrc.length > 0 ? markdownCssFromSrc : markdownCssFromAssets;

  if (cssInputs.length > 0) {
    bundles.push({
      name: "Markdown editor CSS",
      loader: "css",
      output: path.join(markdownEditorRoot, "dist/css/md-editor.css"),
      mode: "concat",
      inputs: cssInputs,
    });
  }

  const jsSourceDir = fs.existsSync(path.join(markdownEditorRoot, "src"))
    ? path.join(markdownEditorRoot, "src")
    : path.join(markdownEditorRoot, "assets", "js");
  const jsInputs = collectFiles(jsSourceDir, isJsFile);

  const entryCandidates = [
    path.join(markdownEditorRoot, "src", "md-editor.ts"),
    path.join(markdownEditorRoot, "src", "md-editor.js"),
    path.join(markdownEditorRoot, "src", "js", "md-editor.ts"),
    path.join(markdownEditorRoot, "src", "js", "md-editor.js"),
    path.join(markdownEditorRoot, "assets", "js", "md-editor.js"),
  ];
  const entryPoint = entryCandidates.find((entry) => fs.existsSync(entry));

  if (entryPoint) {
    const watchFiles = new Set(jsInputs.length > 0 ? jsInputs : [entryPoint]);
    watchFiles.add(entryPoint);

    bundles.push({
      name: "Markdown editor JS",
      loader: "js",
      output: path.join(markdownEditorRoot, "dist/js/md-editor.js"),
      mode: "bundle",
      inputs: Array.from(watchFiles),
      entry: entryPoint,
    });
  }

  return bundles;
};

const gatherBundleDefinitions = (): BundleDefinition[] => [...getThemeBundles(), ...getMarkdownEditorBundles()];

let lightningCssModule: Awaited<typeof import("lightningcss")> | undefined;

try {
  lightningCssModule = await import("lightningcss");
  console.log("[articulate-static-assets] Lightning CSS detected; CSS bundles will use lightningcss.");
} catch (error) {
  const err = error as NodeJS.ErrnoException | undefined;
  if (err?.code === "ERR_MODULE_NOT_FOUND") {
    console.log(
      "[articulate-static-assets] lightningcss is not installed. Install it to enable Lightning CSS minification. Falling back to esbuild for CSS minification."
    );
  } else if (err) {
    console.log(
      `[articulate-static-assets] Failed to load lightningcss (${err.message}). Falling back to esbuild for CSS minification.`
    );
  } else {
    console.log(
      "[articulate-static-assets] Failed to load lightningcss (unknown error). Falling back to esbuild for CSS minification."
    );
  }
}

const staticAssetsPlugin = (): Plugin => {
  type ResolvedBundle = BundleDefinition & {
    output: string;
    inputs: string[];
    entry?: string;
  };

  let command: "build" | "serve" = "build";
  let bundles: ResolvedBundle[] = [];
  let bundleFiles = new Set<string>();

  const refreshBundles = () => {
    const definitions = gatherBundleDefinitions();
    bundles = definitions.map((bundle) => ({
      ...bundle,
      output: path.normalize(bundle.output),
      inputs: bundle.inputs.map((input) => path.normalize(input)),
      entry: bundle.entry ? path.normalize(bundle.entry) : undefined,
    }));

    bundleFiles = new Set(
      bundles.flatMap((bundle) => [...bundle.inputs, ...(bundle.entry ? [bundle.entry] : [])])
    );
  };

  const processBundle = async (bundle: ResolvedBundle) => {
    if (bundle.mode === "bundle") {
      if (!bundle.entry) {
        throw new Error(`Bundle "${bundle.name}" requires an entry point.`);
      }

      const result = await esbuildBuild({
        entryPoints: [bundle.entry],
        absWorkingDir: path.dirname(bundle.entry),
        bundle: true,
        minify: true,
        write: false,
        format: "esm",
        target: "es2020",
        legalComments: "inline",
        logLevel: "silent",
      });

      const outputFile = result.outputFiles?.[0];

      if (!outputFile) {
        throw new Error(`Bundle "${bundle.name}" did not produce any output.`);
      }

      await fsp.mkdir(path.dirname(bundle.output), { recursive: true });
      await fsp.writeFile(bundle.output, outputFile.text, "utf8");

      console.log(`[articulate-static-assets] wrote ${relativeToRepo(bundle.output)}`);

      result.warnings.forEach((warning) =>
        console.warn(`[articulate-static-assets] ${formatEsbuildWarning(warning)}`)
      );

      return;
    }

    const source = await Promise.all(
      bundle.inputs.map(async (inputPath) => {
        try {
          return await fsp.readFile(inputPath, "utf8");
        } catch (error) {
          throw new Error(
            `Failed to read static asset "${relativeToRepo(inputPath)}": ${(error as Error).message}`
          );
        }
      })
    );

    const combinedSource = source.join("\n");
    const { code, warnings } = await minifySource(combinedSource, bundle.loader, bundle.output);

    await fsp.mkdir(path.dirname(bundle.output), { recursive: true });
    await fsp.writeFile(bundle.output, code, "utf8");

    console.log(`[articulate-static-assets] wrote ${relativeToRepo(bundle.output)}`);

    warnings.forEach((warning) => console.warn(`[articulate-static-assets] ${warning}`));
  };

  const rebuildBundles = async (changedFile?: string) => {
    const normalizedChangedFile = changedFile ? path.normalize(changedFile) : undefined;
    const targets =
      normalizedChangedFile === undefined
        ? bundles
        : bundles.filter((bundle) =>
            [...bundle.inputs, ...(bundle.entry ? [bundle.entry] : [])].includes(normalizedChangedFile ?? "")
          );

    if (targets.length === 0) {
      return;
    }

    for (const bundle of targets) {
      await processBundle(bundle);
    }
  };

  const rebuildWithHandling = async (changedFile: string | undefined, failOnError: boolean) => {
    try {
      await rebuildBundles(changedFile);
    } catch (error) {
      console.error("[articulate-static-assets] bundle generation failed", error);
      if (failOnError) {
        throw error;
      }
    }
  };

  return {
    name: "articulate-static-assets",
    configResolved(resolved) {
      command = resolved.command;
    },
    async buildStart() {
      refreshBundles();
      for (const bundle of bundles) {
        for (const input of [...bundle.inputs, ...(bundle.entry ? [bundle.entry] : [])]) {
          this.addWatchFile(input);
        }
      }

      if (command === "serve") {
        await rebuildWithHandling(undefined, false);
      }
    },
    async handleHotUpdate({ file }) {
      if (command !== "serve") {
        return;
      }

      const normalized = path.normalize(file);
      if (!bundleFiles.has(normalized)) {
        return;
      }

      refreshBundles();
      for (const bundle of bundles) {
        for (const input of [...bundle.inputs, ...(bundle.entry ? [bundle.entry] : [])]) {
          this.addWatchFile(input);
        }
      }

      await rebuildWithHandling(normalized, false);
    },
    async closeBundle() {
      if (command === "build") {
        refreshBundles();
        await rebuildWithHandling(undefined, true);
      }
    },
  };
};

const formatEsbuildWarning = (warning: EsbuildMessage) =>
  `${warning.text}${warning.location?.file ? ` (${warning.location.file})` : ""}`;

const formatLightningWarning = (warning: LightningWarning) => {
  if (warning.type === "warning" && warning.loc) {
    const { line, column, source } = warning.loc;
    const from = source ? `${source}:${line}:${column}` : `${line}:${column}`;
    return `${warning.message} (${from})`;
  }

  return warning.message;
};

const stripBom = (content: string) => content.replace(/^\uFEFF/, "");
const stripCssCharset = (content: string) =>
  content.replace(/@charset\s+(['"]).*?\1\s*;/gi, "");

const minifySource = async (
  source: string,
  loader: "css" | "js",
  outputFile: string
): Promise<{ code: string; warnings: string[] }> => {
  let preparedSource = stripBom(source);

  if (loader === "css") {
    preparedSource = stripCssCharset(preparedSource);
  }

  if (loader === "css" && lightningCssModule) {
    const result = lightningCssModule.transform({
      filename: path.basename(outputFile),
      code: Buffer.from(preparedSource, "utf8"),
      minify: true,
    });

    const warnings = result.warnings?.map((warning) => formatLightningWarning(warning)) ?? [];

    return {
      code: Buffer.from(result.code).toString("utf8"),
      warnings,
    };
  }

  const result = await esbuildTransform(preparedSource, {
    loader,
    minify: true,
    legalComments: "inline",
    target: loader === "js" ? ["es2020"] : undefined,
  });

  return {
    code: result.code,
    warnings: result.warnings.map((warning) => formatEsbuildWarning(warning)),
  };
};

// Get version from nbgv, running from the solution root
const getVersion = (command: string, mode: string): string | undefined => {
  if (command !== "build" || mode !== "production") {
    return "0.0.0-local";
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

// Move umbraco-package.json from BackOffice folder up one level to the Articulate folder, this is required for Umbraco to find the package manifest
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

// Stamp umbraco-package.json and package.json with the version on release
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
      const pnpmCommand = `pnpm version ${version} --allow-same-version --no-git-tag-version`;
      execSync(pnpmCommand, { encoding: "utf8" });
    },
  };
};

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  build: {
    lib: {
      entry: "src/bundle.manifests.ts",
      formats: ["es"],
      fileName: "articulate",
    },
    outDir: outputPath,
    emptyOutDir: true,
    sourcemap: true,
    ...(mode === "production"
      ? {
          minify: "terser" as const,
          terserOptions: {
            compress: {
              ecma: 2020,
              passes: 2,
              drop_console: true,
              drop_debugger: true,
            },
            format: {
              comments: false,
            },
          },
        }
      : {
          minify: "esbuild" as const,
        }),
    rollupOptions: {
      external: [/^@umbraco/],
    },
  },
  plugins: [tsconfigPaths(), staticAssetsPlugin(), versioningPlugin(), umbracoPackagePlugin()],
}));

