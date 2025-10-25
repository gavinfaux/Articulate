[![Articulate Build](https://github.com/Shazwazza/Articulate/actions/workflows/build.yml/badge.svg)](https://github.com/Shazwazza/Articulate/actions/workflows/build.yml)

![Articulate](https://raw.githubusercontent.com/Shazwazza/Articulate/develop/assets/Logo.png?raw=true)

> A wonderful Blog engine built on Umbraco

---
_❤️ If you use and like Articulate please consider [becoming a GitHub Sponsor](https://github.com/sponsors/Shazwazza/) ❤️_

## Installation

Two support tracks are available depending on the Umbraco version you run.

### Umbraco 13 LTS (maintenance mode)

Articulate 5.x remains available for Umbraco 13, which is in security maintenance until **December 2025** and reaches end of life in **December 2026**. The package still installs from the Umbraco marketplace.

- After installing, open the Packages section (`umbraco/section/packages/view/installed`) and run any pending migrations.
- Save the `Articulate Image Picker` data type once to fix bundled demo media (issue [#460](https://github.com/Shazwazza/Articulate/issues/460)). This step is only required on Umbraco 13.
- For long-term projects consider upgrading to Umbraco 15+ where Articulate 6 receives active feature work.

_Need help?_ Head over to [Articulate on GitHub](https://github.com/Shazwazza/Articulate) for extra tips, known issues and fixes.

### Umbraco 15.4.4+ / 16 / 17 (current track)

Articulate 6 targets Umbraco 15.4.4+, 16, and 17 (preview) via a multi-targeted Razor Class Library.

- Install the package on Umbraco 15/16 from NuGet or source and follow any migration prompts in the Packages section.
- When building from source, run the test site `dotnet run -f net9.0 --project src/Articulate.Tests.Website/Articulate.Tests.Website.csproj` (or `-f net10.0` for Umbraco 17) and sign into the Umbraco backoffice to finish setup.

## Features

Supporting all the features you'd want in a blogging platform

- Categories & Tags
- Themes
- Multiple archives
- Live Writer support
- Markdown support
- Post from your mobile phone including photos direct from you camera
- Disqus or Facebook comment support (or build your own)
- Search
- Blogml import/export (including Disqus import)
- Customizable RSS feeds
- Customizable urls
- Author profiles
- AI/LLM-friendly content negotiation (Accept: text/markdown or text/plain)

## Routes & Endpoints (high level)

- Search: `/{searchUrlName}` (configurable on root node)
- Tags/Categories:
  - Index: `/{tagsUrlName}` / `/{categoriesUrlName}`
  - Filtered list: `/{tagsUrlName}/{tag}` / `/{categoriesUrlName}/{tag}`
  - RSS: `/{tagsUrlName}/{tag}/rss` / `/{categoriesUrlName}/{tag}/rss`
- RSS: `/rss`, `/rss/xslt`, `/author/{authorId}/rss`
- OpenSearch: `/opensearch/{id}`
- RSD: `/rsd/{id}`
- Live Writer Manifest: `/wlwmanifest/{id}`
- MetaWeblog: `/metaweblog/{id}`

Note: the legacy front‑end “Markdown Editor” route `/a-new` does not expose an editor in v6. It temporarily 302‑redirects to the blog home. Use the backoffice Markdown editor (Articulate.Api.Management) to compose and publish posts.

## Minimum requirements

- Articulate 5.x (maintenance): Umbraco 13 LTS (security support through Dec 2025, EOL Dec 2026)
- Articulate 6.x (current): Umbraco 15.4.4+ and 16 on .NET 9; Umbraco 17 (beta) on .NET 10 previews

## [Documentation](https://github.com/Shazwazza/Articulate/wiki)

Docs on installation, creating posts, customising/creating themes, etc...

## [Issues](https://github.com/Shandem/Articulate/issues)

If you have any issues, please post them here on GitHub

## [Releases](https://github.com/Shazwazza/Articulate/releases)

See here for the list of releases and their release notes

## [Community Discussions](https://forum.umbraco.com/)

- Please use the Umbraco forums to ask questions and discuss Articulate, it's features and functionality.
- Do not post issues here, post them [here](https://github.com/Shazwazza/Articulate/issues) on GitHub

## Contributing

1. Clone/fork the repository.
1. Open `src/Articulate.sln` in Visual Studio or Rider (the solution multi-targets `net9.0;net10.0`).
1. Build once to restore NuGet packages and pnpm-managed client assets.
1. Use the test site for development:  
   `dotnet run -f net9.0 --project src/Articulate.Tests.Website/Articulate.Tests.Website.csproj`  
   (`-f net10.0` when validating Umbraco 17).
1. Complete the Umbraco installer and sign in; migrations seed the Articulate schema and demo content automatically.

Changes to the Razor Class Library or client code hot-reload through the test site (see the Developer Experience section below).

### Developer Experience (hot reload)

For a fast local loop when editing Razor, HTML, CSS, and JS:

- Backend + Razor hot reload (same origin):
  - `dotnet watch run --project src/Articulate.Tests.Website`
  - In Development, the test website is configured to:
    - Use Razor runtime compilation for .cshtml
    - Auto-reload the browser for static assets and views

- Backoffice client HMR (Vite):
  - From `src/Articulate.Api.Management/Client`
    - `pnpm install`
    - `pnpm run dev`
  - Use alongside the test website for HMR of the backoffice extension.
  - Use `pnpm run build` to emit assets into `wwwroot/App_Plugins/Articulate/BackOffice` when validating a full .NET build or packing.
  - `pnpm run lint` and `pnpm run check` help keep the client codebase healthy during edits.
  - Vite now bundles/minifies theme static assets into per-theme `dist/` folders (e.g. `Themes/VAPOR/dist/css/vapor.css`) and compiles the mobile Markdown editor into `MarkdownEditor/dist/`, eliminating the Visual Studio Bundler & Minifier dependency. Author CSS/JS under `Themes/*/src/` and `MarkdownEditor/src/`; Razor views use ASP.NET Core environment tag helpers to load those source files in Development and the bundled assets in Production, so remember to run `pnpm run build` before deploying/starting with `ASPNETCORE_ENVIRONMENT=Production`. CSS minification prefers Lightning CSS when installed (`pnpm add -D lightningcss`) and falls back to esbuild otherwise.

See docs/development-dx.md for details and tips.

### Tooling prerequisites (Node/pnpm)

- The backoffice client (Lit + TypeScript) uses pnpm. Local development requires Node 22+ and pnpm 10.17+.
- A root `.nvmrc` pins Node 22; run `nvm use` (or your preferred version manager such as `fnm` or `volta`) in the repo root to match CI. On Windows, `nvm-windows` works well.
- You can enable pnpm via corepack (recommended):
  - `npm corepack enable`
  - `npm corepack prepare pnpm@latest --activate`
- CI installs pnpm using `pnpm/action-setup`; no extra steps required there.
- The `Articulate.Api.Management` project invokes pnpm restore/build from MSBuild during .NET builds; see docs.
- The client project ships `src/Articulate.Api.Management/Client/.npmrc` to align pnpm behaviour (peer resolution, hoisting) with CI; keep it in place when reinstalling dependencies.

### Visual Studio setup

- Opening the solution in Visual Studio honours the repo `global.json` (baseline 9.0.100 with `rollForward: "latestMajor"` and `allowPrerelease: true`). Install a 9.0.1xx SDK locally so VS picks the latest .NET 9, and enable preview SDKs in VS only when you want to build/run the net10 TFM.
- Optional preview builds rely on the .NET 10 RC SDK; enable “Use previews of the .NET SDK” in VS when you need to target net10 locally.
- The repository ships a `.vsconfig` requesting:
  - `Microsoft.VisualStudio.Workload.NetWeb`
  - `Microsoft.NetCore.Component.SDK.9.0`
  - `Microsoft.NetCore.Component.SDK.Preview`
  Opening the folder in VS 2022/next prompts to install those components, ensuring .NET 9 is present and preview SDKs are available when you opt in.

### Build & Pack (multi-target .NET 9/10)

- Projects target both `net9.0` and `net10.0`. Run `pwsh build/build.ps1` (or `dotnet build`/`dotnet pack`) in Release mode to compile and create NuGet packages.
- `global.json` keeps 9.0.100 as the baseline but allows roll-forward to newer (preview) SDKs, so `dotnet` or Visual Studio can load the .NET 10 tooling when installed.
- GitHub Actions mirrors this flow with `dotnet restore`, `dotnet build`, and `dotnet pack` against the solution.
- If a future preview regresses static web-asset packing, fall back to manual `Content`/`ContentWithTargetPath`/`EmbeddedResource` packing; see docs/development-dx.md.

### Repository Guides

- Developer onboarding & architecture: `docs/developer-onboarding.md`
- Hot reload & HMR tips: `docs/development-dx.md`
- v5 → v6 API differences: `docs/breaking-changes-v5-v6.md`
- Automation/AI reference: `AGENTS.md`
- AI/LLM content negotiation + CDN setup: `docs/ai-content-negotiation.md`

### Changing Umbraco Articulate schema/data elements

If you need to make changes to the underlying Umbraco schema (doc types, data types, etc...) or the installed package's content/media, then you will need
to re-create the Articulate package in the back office with all required dependencies and then re-save the package.zip file and commit it to the repository.

## Copyright & Licence

&copy; 2025 by Shannon Deminick

This is free software and is licensed under the [The MIT License (MIT)](http://opensource.org/licenses/MIT)
