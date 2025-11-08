# Development DX: Hot Reload + HMR

This repository supports a fast inner loop for Razor views, HTML, CSS, and JS when working on Articulate.

## Prerequisites

- .NET 9 and 10rc SDK
- Node 22+ and pnpm 10.17+
- Node version manager:
  - The repo includes `.nvmrc` (Node 22); use `nvm` or `fnm` (Fast Node Manager).
  - `fnm` quickstart: `curl -fsSL https://fnm.vercel.app/install | bash`, restart shell, then run `fnm use` in the repo root.
- Enable pnpm via corepack (recommended):
  - `corepack enable`
  - `corepack prepare pnpm@10.17.0 --activate`
- Visual Studio: opening the repo offers to apply `.vsconfig`, which installs the ASP.NET workload plus .NET 9 SDK and (optional) preview SDK component.

### Backend + Razor hot reload (same origin)

Run the test website with Hot Reload; in Development it enables:

- Razor runtime compilation for `.cshtml`
- LiveReload for static assets (css/js/images/json)

Commands:

```
dotnet watch run --project src/Articulate.Tests.Website
```

Navigate to `https://localhost:44366/`.

Notes:

- This setup avoids a separate proxy/port so auth callbacks, cookies and management API calls remain on the same origin.
- Development-only packages/middleware are conditioned to Debug/Development builds and are not used in production.
- To prevent automatic live reload run `dotnet watch` with the `--no-hot-reload` argument, use when manual reload is preferable DX.

### Verifying AI/LLM Content Negotiation locally

You can test the text variants against the test site using `curl`:

```
curl -I -H "Accept: text/markdown" https://localhost:44366/blog/my-post
curl -I -H "Accept: text/plain"    https://localhost:44366/blog/my-post
curl -I                            https://localhost:44366/blog/my-post
```

Expect headers:

- `X-Content-Variant: md|txt|html`
- `Vary: X-Content-Variant`
- `Cache-Control: public, max-age=0, s-maxage=120` (posts) or `60` (lists)

Body checks:

```
curl -H "Accept: text/markdown" https://localhost:44366/blog/my-post
curl -H "Accept: text/plain"    https://localhost:44366/blog/my-post
curl -H "Accept: text/markdown" "https://localhost:44366/blog/archive?p=1"
```

### CDN normalization quick start (Strategy B)

In production behind a CDN, normalize the request header `X-Content-Variant` at the edge and include it in the cache key.

- Cloudflare: Transform Rule to set `X-Content-Variant` (md/txt/html) from `Accept`; Cache Rule adds it to cache key.
- CloudFront: Lambda@Edge viewer‑request sets `x-content-variant`; cache policy includes the header.
- Fastly: VCL sets `req.http.X-Content-Variant` and appends to `req.hash`.

See `docs/ai-content-negotiation.md` for full examples. Origin already varies by `X-Content-Variant` and emits `s-maxage` so no appsettings changes are required.

### Backoffice client HMR (Vite)

Enable pnpm package manager (one‑time setup)

```bash
corepack enable
corepack prepare pnpm@10.17.0 --activate

```

Run in parallel for the backoffice extension (Lit + TypeScript):

```
cd src/Articulate.Api.Management/Client
pnpm install
pnpm run dev
```

Tips:

- Use `pnpm run build` to emit assets into `wwwroot/App_Plugins/Articulate/BackOffice` when validating a full .NET build or packing.
- `pnpm run lint` and `pnpm run check` help keep the client codebase healthy during edits.
- Vite now bundles and minifies theme assets into `Themes/*/dist/` and compiles the Markdown editor into `MarkdownEditor/dist/` on build/dev, replacing the Visual Studio Bundler & Minifier extension. Author CSS/JS under `Themes/*/src/` and `MarkdownEditor/src/`; Development serves those source files while Production serves the bundled output—run `pnpm run build` before deploying or running with `ASPNETCORE_ENVIRONMENT=Production`. When the optional `lightningcss` package is installed (`pnpm add -D lightningcss`) the plugin uses it for CSS minification; otherwise it falls back to esbuild.
- The client `.npmrc` (checked into `src/Articulate.Api.Management/Client`) aligns pnpm peer handling with CI; leave it untouched when reinstalling dependencies.

### Client build integration

- MSBuild does not invoke pnpm/Vite by default. The client assets are built with Vite and committed under `src/Articulate.Web/wwwroot/App_Plugins/Articulate/**/dist/**`.
- To rebuild assets during packaging, use the build scripts with an opt‑in flag:
  - Windows: `set ENABLE_CLIENT_BUILD=1 && build\build.ps1`
  - Linux/WSL: `ENABLE_CLIENT_BUILD=1 bash build/build.sh`
- Or run it manually during development:
  - `cd src/Articulate.Api.Management/Client && pnpm install && pnpm run build` (dev) or `pnpm run build:release` (prod bundling)
- Packaging pulls from the `dist/` folders (see `src/Articulate.StaticAssets/Articulate.StaticAssets.csproj`). If you change theme or Markdown editor sources, rebuild to refresh those folders before packing.

### Build scripts (Windows, Linux/WSL) and flags

- Windows PowerShell: `build/build.ps1`
  - Parallel MSBuild; uses all cores by default. Override workers: `set MAXCPU=8`.
  - Client assets: skipped by default. Enable: `set ENABLE_CLIENT_BUILD=1`.
  - Prints a note if the repo is under `\\wsl$` suggesting to build inside WSL for speed.
- Linux/WSL Bash: `build/build.sh`
  - Parallel MSBuild; auto‑detects CPU. Override workers: `export MAXCPU=8`.
  - Client assets: skipped by default. Enable: `export ENABLE_CLIENT_BUILD=1`.
  - WSL‑aware: warns if building from `/mnt/*` and recommends cloning under `~/src/...` (ext4) for faster I/O.

Both scripts restore once at solution level, build both TFMs with maximum parallelism, and pack these projects into `build/Release`: `Articulate.Core`, `Articulate`, `Articulate.Api.Management`, and `Articulate.StaticAssets`.

### Cross‑platform local workflow (dual clone)

- For consistently fast local builds, keep two clones:
  - WSL/distro ext4 clone: `~/src/Articulate6-wip` → run `bash build/build.sh`.
  - Windows NTFS clone: `F:\int\Articulate6-wip` → run `pwsh build/build.ps1`.
- Keep them in sync via Git (`git pull` in each). WSL builds from `/mnt/*` are slower due to drvfs; using the distro’s ext4 typically yields 2–5× faster restore/build for metadata‑heavy steps.

### Regenerating the client SDK (optional)

If OpenAPI changes, regenerate the typed client:

```
cd src/Articulate.Api.Management/Client
pnpm run generate:api
```

## Preview .NET 10 packaging options

Until the .NET 10 SDK regains full static web asset packing for Razor Class Libraries, keep the primary NuGet build on .NET 9.0.100 and consider these fallback approaches if future work needs to publish net10.0 assets early:

- Add `<Content Include="wwwroot\**\*.*" Pack="true" PackagePath="contentFiles/any/any" />` so client files ship as plain content files.
- Use `<ContentWithTargetPath>` to map assets back into `_content/<PackageId>` manually when the static-web-assets pipeline is unavailable.
- Mirror the theme embedding pattern with `<EmbeddedResource Include="wwwroot\App_Plugins\**" ...>` for assets that must always be present.
- Apply a conditional fallback (`Condition="'$(TargetFramework)' == 'net10.0'"`) that only uses manual packing on preview TFMs, retaining the default static-web-asset flow for .NET 9.
- Explicitly include pnpm output (`wwwroot/App_Plugins/**`) so backoffice bundles are copied even if the SDK omits them.

Revert to the standard static web asset configuration once a stable .NET 10 SDK fixes the regression.
