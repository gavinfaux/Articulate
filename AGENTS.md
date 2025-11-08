# Repository Guidelines

This guide supports automation agents and human contributors working in the Articulate codebase.

## Project Structure & Module Organization
- `src/Articulate/` – core Umbraco blog engine (C#).
- `src/Articulate.Web/` – Razor Class Library (RCL); themes live under `wwwroot/App_Plugins/Articulate/Themes/*`.
- `src/Articulate.Api.Management/` – management API; backoffice client in `Client/` (Vite + TypeScript).
- `src/Articulate.UnitTests/` – xUnit test suites.
- `src/Articulate.Tests.Website/` – demo site for local validation.
- Projects target `net9.0;net10.0` (Umbraco 15/16 on net9, Umbraco 17 on net10). Use `-f net9.0` / `-f net10.0` with `dotnet` commands when testing specific TFMs. Package ranges: net9.0 → `[15.4.4,17.0.0)`, net10.0 → `[17.0.0-beta,18.0.0)`.

## Build, Test, and Development Commands
- Build all TFMs: `dotnet build src/Articulate.sln --configuration Release`
- Build single TFM: `dotnet build src/Articulate.sln -f net9.0 -c Release` (or `-f net10.0`)
- Test (all): `dotnet test src/Articulate.UnitTests/Articulate.UnitTests.csproj`
- Test single TFM: `dotnet test src/Articulate.UnitTests/Articulate.UnitTests.csproj -f net9.0` (or `-f net10.0`)
- Run demo (Umbraco 15/16): `dotnet run -f net9.0 --project src/Articulate.Tests.Website/Articulate.Tests.Website.csproj`
- Run demo (Umbraco 17): `dotnet run -f net10.0 --project src/Articulate.Tests.Website/Articulate.Tests.Website.csproj`
- Backoffice client: `cd src/Articulate.Api.Management/Client && pnpm install && pnpm run dev`
- Build client assets (Vite): `pnpm run build` (outputs to `src/Articulate.Api.Management/wwwroot/...` and theme/MarkdownEditor `dist/`)
- Lint/check client: `pnpm run lint` / `pnpm run check`
- Clean: `dotnet clean src/Articulate.sln --configuration Release`
- Pack: `dotnet pack src/Articulate.sln --output build/Release --configuration Release`
- Release pipeline: `pwsh build/build.ps1` (restores → cleans → builds → packs all TFMs)

### Build script flags and environment
- `build/build.sh` (Linux/WSL):
  - Parallel by default; auto‑detects CPU count. Override with `MAXCPU=<N>`.
  - Client assets: skipped by default. Enable with `ENABLE_CLIENT_BUILD=1`.
  - WSL‑aware: warns when building from `/mnt/*` and suggests cloning into the distro’s ext4 (e.g., `~/src/...`).
- `build/build.ps1` (Windows):
  - Parallel by default; uses all logical cores. Override with `set MAXCPU=<N>` before running.
  - Client assets: skipped by default. Enable with `set ENABLE_CLIENT_BUILD=1`.
  - Prints a note if running against `\\wsl$` paths and suggests using the Linux script inside WSL.

## Coding Style & Naming Conventions
- C#: .NET 9/10, C# latest, nullable warnings as errors, implicit usings, 4‑space indent.
  - Private fields: `_camelCase`; public members: `PascalCase`; prefer expression-bodied members.
  - StyleCop analyzers enforced.
- TypeScript: ES2020 target, 2‑space indent, single quotes, Prettier formatting; ESLint for linting.

## Testing Guidelines
- Framework: xUnit with descriptive names like `MethodUnderTest_ShouldExpectedBehavior`.
- Run: `dotnet test` (optionally `-f net9.0` or `-f net10.0`).
- Aim for unit coverage of new logic; sanity‑check UI via the demo site.

## Commit & Pull Request Guidelines
- Commits: short, imperative (e.g., `Fix markdown auth refresh`). Reference issues in body.
- PRs: describe behavior changes, link issues, attach test evidence (`dotnet test`, `pnpm run lint/build`), and screenshots for theme/backoffice UI changes. Call out migrations/breaking impacts.

## Security & Configuration Tips
- Toolchains: `.nvmrc` → Node 22 (`nvm use`), pnpm 10.17+, `global.json` pins .NET 9.0.100 with roll‑forward.
- Frontend bundles: Vite emits theme assets to `Themes/*/dist/` and Markdown editor to `MarkdownEditor/dist/`. In Production, Razor uses environment tag helpers with `asp-append-version`. Run `pnpm run build` before packaging/deploying.

### Node version managers (nvm vs fnm)
- The repo includes `.nvmrc` (Node 22). You can use either:
  - `nvm` (widely used), or
  - `fnm` (Fast Node Manager) — recommended for speed and cross‑platform ergonomics.
- Example with `fnm`:
  - Install: `curl -fsSL https://fnm.vercel.app/install | bash`
  - Restart your shell, then in repo root: `fnm use` (respects `.nvmrc`), then `corepack enable && corepack prepare pnpm@10.17.0 --activate`.

## Notes for Automation/Agents
- Follow existing structure; avoid unrelated changes. Prefer surgical patches and add tests near modified code. Keep build/test commands green across both TFMs.
- When running scripted tasks, respect multi-targeting: validate both `net9.0` and `net10.0` builds/tests where feasible.
- Theme and Markdown editor source assets now live under `Themes/*/src/**` and `MarkdownEditor/src/**`; regenerating bundles requires `pnpm run build` before packaging or Release builds.
- The legacy `/a-new/` front-end route currently issues a 302 redirect via `src/Articulate/Controllers/MarkdownEditorController.cs`. Remove that shim if you need to restore the SPA controller in `Articulate.Web`.

### Cross‑platform workflow (WSL + Windows)
- For fastest local builds, keep two clones:
  - WSL clone under ext4, e.g. `~/src/Articulate6-wip` → use `bash build/build.sh`.
  - Windows clone on a local NTFS drive, e.g. `F:\int\Articulate6-wip` → use `pwsh build/build.ps1`.
- Keep them in sync via Git (commit/push in one, `git pull` in the other).
- Reason: WSL builds under `/mnt/*` are I/O‑limited; ext4 in the distro is much faster for metadata‑heavy steps (NuGet/pnpm/Razor).
