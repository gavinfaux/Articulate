import { defineConfig, type Plugin } from "vite";
import path from "node:path";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { mkdir, writeFile, unlink, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import { build as esbuildBuild } from "esbuild";
import { minify as terserMinify } from "terser";
import * as lightningcss from "lightningcss";
import tsconfigPaths from "vite-tsconfig-paths";

// --- CONSTANTS & PATHS ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. UI (Current Project)
const UI_ROOT = __dirname;
const UI_ENTRY = path.resolve(UI_ROOT, "src/main.ts"); 
const UI_OUT = path.resolve(UI_ROOT, "..", "wwwroot/App_Plugins/Articulate/BackOffice");
const PACKAGE_ROOT = path.resolve(UI_ROOT, "..", "wwwroot/App_Plugins/Articulate");

// 2. WEB (External Project)
const WEB_ROOT = path.resolve(UI_ROOT, "..", "..", "Articulate.Web");
const WEB_THEMES = path.resolve(WEB_ROOT, "wwwroot/App_Plugins/Articulate/Themes");
const WEB_MARKDOWN = path.resolve(WEB_ROOT, "wwwroot/App_Plugins/Articulate/MarkdownEditor");

// --- UTILS ---
const collectFiles = (dir: string, ext: string): string[] => {
  if (!existsSync(dir)) return [];
  const entries = readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name));
  return entries.flatMap(entry => {
    if (entry.name.startsWith(".") || entry.name === "dist") return [];
    const fullPath = path.join(dir, entry.name);
    return entry.isDirectory() 
      ? collectFiles(fullPath, ext) 
      : (path.extname(entry.name).toLowerCase() === ext ? [fullPath] : []);
  });
};

// Helper to clean directories (rm -rf)
const cleanDir = async (dir: string) => {
    if (existsSync(dir)) {
        await rm(dir, { recursive: true, force: true });
    }
};

// --- PLUGIN: ASSET BUILDER (Themes + Markdown) ---
const sideCarAssetsPlugin = (): Plugin => {
  let mode = "development";
  return {
    name: 'side-car-assets',
    configResolved(c) { mode = c.mode; },
    async buildStart() {
       const isProd = mode === "production";
       
       // --- A. BUILD THEMES ---
       if (existsSync(WEB_THEMES)) {
         console.log(`[side-car] Scanning Themes...`);
         const dirs = readdirSync(WEB_THEMES, { withFileTypes: true })
            .filter(d => d.isDirectory() && !d.name.startsWith("."));

         for (const dir of dirs) {
            const themeName = dir.name;
            const assetsRoot = path.join(WEB_THEMES, themeName, "assets");
            const srcDir = path.join(assetsRoot, "src");
            const vendorDir = path.join(assetsRoot, "vendor");
            const outDir = path.join(assetsRoot, "dist");

            if (!existsSync(srcDir)) continue;

            // CLEAN: Wipe the dist folder before rebuilding
            await cleanDir(outDir);

            await buildBundle({
                name: `${themeName} CSS`,
                inputs: [...collectFiles(vendorDir, ".css"), ...collectFiles(srcDir, ".css")],
                output: path.join(outDir, "css", `${themeName.toLowerCase()}.min.css`),
                type: 'css', isProd
            });

            await buildBundle({
                name: `${themeName} JS`,
                inputs: [...collectFiles(vendorDir, ".js"), ...collectFiles(srcDir, ".js")],
                output: path.join(outDir, "js", `${themeName.toLowerCase()}.min.js`),
                type: 'js', isProd
            });
         }
       }

       // --- B. BUILD MARKDOWN EDITOR ---
       if (existsSync(WEB_MARKDOWN)) {
          console.log(`[side-car] Building Markdown Editor...`);
          const assetsRoot = path.join(WEB_MARKDOWN, "assets");
          const outDir = path.join(assetsRoot, "dist");
          const srcDir = path.join(assetsRoot, "src"); 
          
          // CLEAN: Wipe dist folder
          await cleanDir(outDir);

          await buildBundle({
              name: "MD Editor CSS",
              inputs: collectFiles(assetsRoot, ".css"),
              output: path.join(outDir, "css", "md-editor.min.css"),
              type: 'css', isProd
          });

          const entry = path.join(srcDir, "js", "md-editor.js");
          if (existsSync(entry)) {
              await buildEsbuildBundle({
                  name: "MD Editor JS",
                  entry,
                  output: path.join(outDir, "js", "md-editor.min.js"),
                  isProd
              });
          }
       }
    }
  }
};

// --- BUNDLE HELPERS ---
async function buildBundle({ name, inputs, output, type, isProd }: any) {
    if (!inputs.length) return;
    
    let code = inputs.map((f: string) => readFileSync(f, "utf8")).join("\n");
    
    if (type === 'css' && isProd) {
        code = code.replace(/^\uFEFF/, "").replace(/@charset\s+(['"]).*?\1\s*;/gi, "");
        const res = lightningcss.transform({
            filename: path.basename(output),
            code: Buffer.from(code),
            minify: true,
            targets: { chrome: 120, safari: 17, firefox: 120 }
        });
        code = res.code.toString();
    } else if (type === 'js') {
        if (isProd) {
            const res = await terserMinify(code, { ecma: 2020, compress: { passes: 2 }, format: { comments: false } });
            code = res.code || code;
        } else {
            const res = await esbuildBuild({
                stdin: { contents: code, resolveDir: path.dirname(inputs[0]), loader: 'js' },
                bundle: false, minify: false, write: false, target: "es2020"
            });
            code = res.outputFiles[0].text;
        }
    }

    await mkdir(path.dirname(output), { recursive: true });
    await writeFile(output, code);
    console.log(`  [${name}] Built`);
}

async function buildEsbuildBundle({ name, entry, output, isProd }: any) {
    const res = await esbuildBuild({
        entryPoints: [entry],
        bundle: true,
        minify: isProd,
        write: false,
        outfile: output,
        target: "es2020",
        format: "esm",
        sourcemap: isProd ? false : "inline"
    });
    
    const code = res.outputFiles.find(x => x.path === output || x.path.endsWith('.js'))?.text;
    if (code) {
        await mkdir(path.dirname(output), { recursive: true });
        await writeFile(output, code);
        console.log(`  [${name}] Built`);
    }
}

// --- PLUGIN: VERSIONING ---
const versioningPlugin = (): Plugin => {
  let version = "0.0.0-dev";
  let isGitVersion = false;
  let mode: string;
  return {
    name: "versioning",
    config: (_, c) => {
      mode = c.mode;
      if (c.command === "build" && mode === "production") {
        try {
          const gitRoot = execSync("git rev-parse --show-toplevel", { encoding: "utf8" }).trim();
          version = execSync("nbgv get-version -v SemVer2", { encoding: "utf8", cwd: gitRoot }).trim();
          isGitVersion = true;
          console.log(`[version] Detected: ${version}`);
        } catch { console.warn(`[version] Defaulting to dev.`); }
      }
      return { define: { "import.meta.env.APP_VERSION": JSON.stringify(version) } };
    },
    closeBundle: async () => {
        if (!isGitVersion || version === "0.0.0-dev") return;
        try {
            execSync(`pnpm version ${version} --allow-same-version --no-git-tag-version`, { stdio: 'ignore', cwd: UI_ROOT });
        } catch {}
    }
  };
};

// --- PLUGIN: MANIFEST MOVER ---
const umbracoPackagePlugin = (): Plugin => {
  const MANIFEST = "umbraco-package.json";
  return {
    name: "manifest-mover",
    closeBundle: async () => {
        const src = path.join(UI_OUT, MANIFEST);
        const dest = path.join(PACKAGE_ROOT, MANIFEST);
        if (existsSync(src)) {
            await mkdir(path.dirname(dest), { recursive: true });
            const content = await readFileSync(src);
            await writeFile(dest, content);
            await unlink(src);
            console.log(`[manifest] Moved to ${dest}`);
        }
    }
  };
};

export default defineConfig(({ mode }) => {
  const isProd = mode === "production";
  return {
    root: UI_ROOT,
    base: "/App_Plugins/Articulate/BackOffice/",
    build: {
      outDir: UI_OUT,
      emptyOutDir: true, // This cleans the BackOffice UI folder automatically
      lib: {
        entry: UI_ENTRY,
        formats: ["es"],
        fileName: "articulate-backoffice"
      },
      rollupOptions: { external: [/^@umbraco/] },
      sourcemap: true,
      minify: isProd ? "terser" : false,
      cssMinify: isProd ? 'lightningcss' : false,
    },
    plugins: [
      tsconfigPaths(),
      sideCarAssetsPlugin(),
      versioningPlugin(),
      umbracoPackagePlugin()
    ]
  };
});