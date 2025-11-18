# Development DX: Runtime Compilation + HMR

This repository supports a fast inner loop for Razor views, HTML, CSS, and JS when working on Articulate. Razor runtime compilation powers the .cshtml experience, which means .NET hot reload must stay disabled; refresh the browser manually after each Razor change.

## Prerequisites

- .NET 9.0.100 and .NET 10 (`10.0.0`) SDKs
- Node 22+ and pnpm 10.20+
- Node version manager:
  - The repo includes `.nvmrc` (Node 22); run `nvm use` for the standard flow so scripts/docs align.
  - Already using `fnm` (Fast Node Manager)? It remains compatible; just run `fnm use` in the repo root.
  - `fnm` quickstart (optional): `curl -fsSL https://fnm.vercel.app/install | bash`, restart shell, then run `fnm use` in the repo root.
- Enable pnpm via corepack (recommended):
  - `corepack enable`
  - `corepack prepare pnpm@10.20.0 --activate`
- Visual Studio: opening the repo offers to apply `.vsconfig`, which installs the ASP.NET workload plus .NET 9 SDK and the .NET 10 SDK component.

### Backend + Razor runtime compilation (same origin)

Run the test website with hot reload disabled; in Development it enables:

- Razor runtime compilation for `.cshtml`
- File watching for static assets (css/js/images/json) so you can rebuild bundles without restarting

Commands:

```bash
dotnet watch run --no-hot-reload --project src/Articulate.Tests.Website
```

Navigate to `https://localhost:44366/`.

Notes:

- Razor runtime compilation does not support .NET hot reload, so keep `--no-hot-reload` and manually refresh your browser after saving Razor files.
- This setup avoids a separate proxy/port so auth callbacks, cookies and management API calls remain on the same origin.
- Development-only packages/middleware are conditioned to Debug/Development builds and are not used in production.

### Verifying AI/LLM Content Negotiation locally

You can test the text variants against the test site using `curl`:

```bash
curl -I -H "Accept: text/markdown" https://localhost:44366/blog/my-post
curl -I -H "Accept: text/plain"    https://localhost:44366/blog/my-post
curl -I                            https://localhost:44366/blog/my-post
```

Expect headers:

- `X-Content-Variant: md|txt|html`
- `Vary: X-Content-Variant`
- `Cache-Control: public, max-age=0, s-maxage=120` (posts) or `60` (lists)

Body checks:

```bash
curl -H "Accept: text/markdown" https://localhost:44366/blog/my-post
curl -H "Accept: text/plain"    https://localhost:44366/blog/my-post
curl -H "Accept: text/markdown" "https://localhost:44366/blog/archive?p=1"
```

### CDN normalization quick start (Strategy B)

In production behind a CDN, normalize the request header `X-Content-Variant` at the edge and include it in the cache key.

- Cloudflare: Transform Rule to set `X-Content-Variant` (md/txt/html) from `Accept`; Cache Rule adds it to cache key.
- CloudFront: Lambda@Edge viewer-request sets `x-content-variant`; cache policy includes the header.
- Fastly: VCL sets `req.http.X-Content-Variant` and appends to `req.hash`.

See `docs/ai-content-negotiation.md` for full examples. Origin already varies by `X-Content-Variant` and emits `s-maxage` so no appsettings changes are required.

### Backoffice client HMR (Vite)

Enable pnpm package manager (one-time setup)

```bash
corepack enable
corepack prepare pnpm@10.20.0 --activate

```

Run in parallel for the backoffice extension (Lit + TypeScript):

```bash
cd src/Articulate.Api.Management/Client
pnpm install
pnpm run dev
```

Tips:

- Use `pnpm run build` to emit assets into `wwwroot/App_Plugins/Articulate/BackOffice` when validating a full .NET build or packing.
- `pnpm run lint` and `pnpm run check` help keep the client codebase healthy during edits.
- Vite now bundles and minifies theme assets into `Themes/*/dist/` and compiles the Markdown editor into `MarkdownEditor/dist/` on build/dev, replacing the Visual Studio Bundler & Minifier extension. Author CSS/JS under `Themes/*/src/` and `MarkdownEditor/src/`; Development serves those source files while Production serves the bundled output-run `pnpm run build` before deploying or running with `ASPNETCORE_ENVIRONMENT=Production`. Lightning CSS ships in the devDependencies for CSS minification; remove it (or skip install) to let the pipeline fall back to esbuild.
- The client `.npmrc` (checked into `src/Articulate.Api.Management/Client`) aligns pnpm peer handling with CI; leave it untouched when reinstalling dependencies.

### Client build integration

- **Automatic via MSBuild**: The `Articulate.StaticAssets` project orchestrates the client build through MSBuild targets. By default, `ENABLE_CLIENT_BUILD=true` (the default) runs `pnpm install && pnpm run build:release` during the build.
- **Sequential TFM builds**: Build scripts run TFMs sequentially (net9.0 first, net10.0 second) to ensure proper client build ordering and prevent asset hash conflicts.
- **Incremental & cached**: Client assets are cached at `build/ClientAssets/` to avoid redundant Vite runs. Only net9.0 builds the client; net10.0 reuses the cached stamp via MSBuild's `Inputs`/`Outputs` mechanism.
- **Skip client build**: To skip the client build (useful in CI or when assets are already built), set `ENABLE_CLIENT_BUILD=false`:
  - Windows: `set ENABLE_CLIENT_BUILD=false && build\build.ps1`
  - Linux/WSL: `ENABLE_CLIENT_BUILD=false bash build/build.sh`
- **Manual rebuild during development**:
  - `cd src/Articulate.Api.Management/Client && pnpm install && pnpm run build` (dev) or `pnpm run build:release` (prod bundling)
- **Theme and Markdown editor assets**: Vite bundles theme CSS/JS into `Themes/*/dist/` and the Markdown editor into `MarkdownEditor/dist/`. Packaging pulls from these `dist/` folders. If you change theme or Markdown editor sources, rebuild to refresh those folders before packing.

### Build scripts (Windows, Linux/WSL) and flags

For up-to-date build/pack flags and cross-platform notes, see `AGENTS.md` -> "Build, Test, and Development Commands". The script behavior (parallelism, `ENABLE_CLIENT_BUILD`, WSL tips) is maintained there to avoid duplication.

### Cross-platform local workflow (dual clone)

Refer to `AGENTS.md` -> "Cross-platform workflow (WSL + Windows)" for the canonical dual-clone guidance. This DX doc keeps the focus on hot-reload/HMR flows.

### Regenerating the client SDK (optional)

If OpenAPI changes, regenerate the typed client:

```bash
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
