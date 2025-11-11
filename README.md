# Articulate

[![Articulate Build](https://github.com/Shazwazza/Articulate/actions/workflows/build.yml/badge.svg)](https://github.com/Shazwazza/Articulate/actions/workflows/build.yml)

![Articulate](https://raw.githubusercontent.com/Shazwazza/Articulate/develop/assets/Logo.png?raw=true)

> A wonderful Blog engine built on Umbraco

---
_❤️ If you use and like Articulate please consider [becoming a GitHub Sponsor](https://github.com/sponsors/Shazwazza/) ❤️_

## Contents

- [Tooling prerequisites (Node/pnpm)](#tooling-prerequisites-nodepnpm)
- [Build & Pack (multi-target .NET 9/10)](#build--pack-multi-target-net-910)
- [Script options](#script-options)
- [WSL + Windows workflow (fast local builds)](#wsl--windows-workflow-fast-local-builds)

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

- Install `Articulate` from NuGet (`dotnet add package Articulate`). The package now ships a transitive dependency on `Articulate.StaticAssets`, so the `/App_Plugins/Articulate/**` files light up automatically—no extra package references or manual copies required.
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
- BlogML import/export (including Disqus import)
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

Docs on installation, creating posts, customizing/creating themes, etc...

## [Issues](https://github.com/Shandem/Articulate/issues)

If you have any issues, please post them here on GitHub

## [Releases](https://github.com/Shazwazza/Articulate/releases)

See here for the list of releases and their release notes

## [Community Discussions](https://forum.umbraco.com/)

- Please use the Umbraco forums to ask questions and discuss Articulate, it's features and functionality.
- Do not post issues here, post them to [Articulate/issues](https://github.com/Shazwazza/Articulate/issues) on GitHub

## Contributing

1. Clone/fork the repository.
1. Open `src/Articulate.sln` in Visual Studio or Rider (the solution multi-targets `net9.0;net10.0`).
1. Build once to restore NuGet packages and pnpm-managed client assets.
1. Use the test site for development:  
   `dotnet run -f net9.0 --project src/Articulate.Tests.Website/Articulate.Tests.Website.csproj`  
   (`-f net10.0` when validating Umbraco 17).
1. Complete the Umbraco installer and sign in; migrations seed the Articulate schema and demo content automatically.

Changes to the Razor Class Library or client code hot-reload through the test site (see the Developer Experience section below).

> **New:** Commits now run automated checks. Husky + lint-staged lint any staged TypeScript files and rebuild the client bundle when `Client/src/**` changes. GitLeaks also scans staged content for secrets via the official GitHub Action in CI. Install pnpm (Node 22+) and the [GitLeaks CLI](https://github.com/gitleaks/gitleaks/releases) locally so hooks and the `.ps1`/`.sh` builds can run `gitleaks detect --redact` outside CI. Set `SKIP_GITLEAKS=1` if you need to skip the local scan temporarily (for example, when the CLI is unavailable in a sandbox).

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

- The backoffice client (Lit + TypeScript) uses pnpm. Install Node 22+ and pnpm 10.17+ before building.
- Node version managers:
  - The repo includes `.nvmrc` (Node 22). You can use `nvm`, but `fnm` (Fast Node Manager) is a quicker, cross‑platform alternative.
  - `fnm` quickstart: `curl -fsSL https://fnm.vercel.app/install | bash`, restart shell, then run `fnm use` in the repo root (respects `.nvmrc`).
  - Enable pnpm: `corepack enable && corepack prepare pnpm@10.17.0 --activate`.
- Corepack users should run `corepack enable` / `corepack prepare pnpm@<version>` manually prior to invoking the build. The repository no longer bootstraps pnpm automatically.
- CI installs pnpm using `pnpm/action-setup`; no extra steps required there.
- The `Articulate.Api.Management` project invokes pnpm restore/build from MSBuild during .NET builds; ensure pnpm is available on your PATH.
- Nerdbank.GitVersioning CLI (`nbgv`) stamps the client bundle version. Install it once with `dotnet tool install --global nbgv --add-source https://api.nuget.org/v3/index.json` (or `dotnet tool update --global nbgv ...`) and ensure `~/.dotnet/tools` is on your PATH. WSL users who hit `No NuGet sources are defined or enabled` should add nuget.org via `dotnet nuget add source https://api.nuget.org/v3/index.json -n nuget.org` before installing the tool.

### Visual Studio setup

- Opening the solution in Visual Studio honours the repo `global.json` (baseline 9.0.100 with `rollForward: "latestMajor"` and `allowPrerelease: true`). Install a 9.0.1xx SDK locally so VS picks the latest .NET 9, and enable preview SDKs in VS only when you want to build/run the net10 TFM.
- Optional preview builds rely on the .NET 10 RC SDK; enable “Use previews of the .NET SDK” in VS when you need to target net10 locally.
- The repository ships a `.vsconfig` requesting:
  - `Microsoft.VisualStudio.Workload.NetWeb`
  - `Microsoft.NetCore.Component.SDK.9.0`
  - `Microsoft.NetCore.Component.SDK.Preview`
  Opening the folder in VS 2022/next prompts to install those components, ensuring .NET 9 is present and preview SDKs are available when you opt in.

### Build & Pack (multi-target .NET 9/10)

- Projects target both `net9.0` and `net10.0`. Run `pwsh build/build.ps1` (Windows) or `bash build/build.sh` (Linux/WSL) to compile and create NuGet packages.
- These scripts are committed with `chmod +x`, so clones on native Linux/WSL filesystems (e.g. `~/src/...`) keep the execute bit. If you clone under `/mnt/*` (NTFS) the bit is dropped and you'll need to run `chmod +x build/build.sh build/build.ps1` once; otherwise the shell script fails with `permission denied`.
- `global.json` keeps 9.0.100 as the baseline but allows roll-forward to newer (preview) SDKs, so `dotnet` or Visual Studio can load the .NET 10 tooling when installed.
- GitHub Actions mirrors this flow by invoking `build/build.ps1`, ensuring the same serialized Core → API → Web build order with `--no-dependencies`.
- If a future preview regresses static web-asset packing, fall back to manual `Content`/`ContentWithTargetPath`/`EmbeddedResource` packing; see docs/development-dx.md.

#### Script options

- Common: builds are parallel and pack `Articulate`, `Articulate.Core`, `Articulate.Api.Management`, and `Articulate.StaticAssets` into `build/Release`. The `Articulate` package now depends on `Articulate.StaticAssets` automatically via the project graph—no extra flags or manual restores required.
- Windows (`build/build.ps1`):
  - Override CPU workers: `set MAXCPU=8` (default = all cores)
  - Enable client assets build: `$env:ENABLE_CLIENT_BUILD = 'true'` (or `set ENABLE_CLIENT_BUILD=true`)
- Linux/WSL (`build/build.sh`):
  - Override CPU workers: `export MAXCPU=8` (default = auto‑detect)
  - Enable client assets build: `export ENABLE_CLIENT_BUILD=true`
  - WSL tip: if the repo is under `/mnt/*`, the script prints a performance warning. Clone under `~/src/...` for faster I/O.

Client/Vite build

- MSBuild does not run pnpm/Vite automatically. Packages include the committed `dist/` outputs under `src/Articulate.Web/wwwroot/App_Plugins/Articulate/**/dist/**`.
- To regenerate assets as part of a build: set `ENABLE_CLIENT_BUILD=true` when invoking the build scripts.
- To rebuild manually: `cd src/Articulate.Api.Management/Client && pnpm install && pnpm run build` (or `build:release`).
- Pre-commit hooks automatically lint staged `.ts/.tsx` files and run `pnpm run build` when client source changes. Install pnpm + GitLeaks locally; if you intentionally need to bypass the hooks, commit with `HUSKY=0 git commit ...`.

### WSL + Windows workflow (fast local builds)

- For best performance keep two clones:
  - WSL ext4 clone (e.g. `~/src/Articulate6-wip`) → `bash build/build.sh`
  - Windows NTFS clone (e.g. `F:\int\Articulate6-wip`) → `pwsh build/build.ps1`
- Sync via Git (`git pull`). WSL builds from `/mnt/*` are slow due to drvfs; building from the distro’s ext4 is 2–5× faster for metadata‑heavy steps.

### Repository Guides

- Developer onboarding & architecture: `docs/developer-onboarding.md`
- Hot reload & HMR tips: `docs/development-dx.md`
- v5 → v6 API differences: `docs/breaking-changes-v5-v6.md`
- Automation/AI reference: `AGENTS.md`
- AI/LLM content negotiation + CDN setup: `docs/ai-content-negotiation.md`

### Changing Umbraco Articulate schema/data elements

If you need to make changes to the underlying Umbraco schema (doc types, data types, etc...) or the installed package's content/media, then you will need
to re-create the Articulate package in the back office with all required dependencies and then re-save the package.zip file and commit it to the repository.

## Copyright & License

&copy; 2025 by Shannon Deminick

This is free software and is licensed under the [The MIT License (MIT)](http://opensource.org/licenses/MIT)
