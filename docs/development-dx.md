## Development DX: Hot Reload + HMR

This repository supports a fast inner loop for Razor views, HTML, CSS, and JS when working on Articulate.

### Prerequisites

- .NET 9 SDK
- Node 22+ and pnpm 10.17+
- A checked-in `.nvmrc` pins Node 22; run `nvm use` (or another version manager) from the repo root so local tooling matches CI.
- Enable pnpm via corepack (recommended):
  - `npm corepack enable`
  - `npm corepack prepare pnpm@latest --activate`
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

Enable pnpm package manager (on time setup)

```bash
npm corepack enable
corepack enable pnpm

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

- The `src/Articulate.Api.Management/Articulate.Api.Management.csproj` integrates pnpm into the .NET build:
  - Restore step runs `pnpm install` (CI uses `--frozen-lockfile`).
  - Build step runs `pnpm run build` (or `build:release` in CI/Release).
  - Non‑CI Debug builds continue on client build errors for faster iteration; CI/Release fails on client build errors.
  - Ensure Node/pnpm are available locally; CI installs pnpm automatically.
- Run `pwsh build/build.ps1` (or `dotnet build`/`dotnet pack`) to reproduce the Release build locally; the script mirrors the CI pipeline using the SDK resolved from `global.json`.

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

