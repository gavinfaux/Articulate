# Articulate 6.0.0-beta Release Notes

## Overview

Articulate 6 is a major upgrade: modern .NET/Umbraco targets, a rewritten backoffice (Lit + TypeScript + Vite), and a modular package layout. This beta is feature complete; feedback will shape the GA release.

**Previous:** 5.1.1  
**Current:** 6.0.0-beta  
**Release type:** Prerelease

## Highlights

- **Frameworks:** Multi-targets .NET 9/10; tested on Umbraco 15.4.4+, 16, and 17.
- **Containers:** Two hardened Compose targets: `docker-compose.net9.yml` (Umbraco 15/16 on .NET 9) and `docker-compose.net10.yml` (Umbraco 17 on .NET 10). Both stacks can run side-by-side using distinct ports (8080/8090) and project isolation.
- **Backoffice rewrite:** AngularJS replaced with Lit + Vite + TypeScript; API is OpenAPI-described and ships a typed client.
- **Tooling:** Standardizes on Vite + ESLint + Prettier for the backoffice client.
- **Modular packages:**  
  - `Articulate` (themes + views + static assets via `Articulate.StaticAssets`)  
  - `Articulate.Core` (models, controllers, services)  
  - `Articulate.Api.Management` (backoffice extension + management API)  
  - `Articulate.StaticAssets` (all static web assets)  
- **Modern theming:** `IViewLocationExpander` resolves `Views/Articulate` overrides first, then bundled themes.
- **Build UX:** `mise run build` / `build-client` use the PowerShell shim; bash-first tasks `build-bash` / `build-client-bash` are available for WSL/Linux/macOS.

### Container security & improvements

- **Images are digest-pinned** for reproducible builds:
  - .NET 9 runtime `mcr.microsoft.com/dotnet/aspnet@sha256:91fe9dd2ca985f5029bf5954f4758e3573d31dfc0f5bb42f1d08779ad5ca3c51` (bookworm-slim) and SDK `@sha256:38c0e3b634152d870819138c03a6eefeff382efc1dd2feff77e041396820bdd1`.
  - .NET 10 runtime `mcr.microsoft.com/dotnet/nightly/aspnet:10.0@sha256:4d01aa096b4844215fee067cc2c2113a5ed8186558c5827b8d8f57dc074750dd` (noble base nightly) and SDK `@sha256:65e1d762871120bcbaacbee69f65dc222210d3716a9dcf14665ebfb107527c8c` (noble base nightly).
- **CVE-2025-45582 (GNU tar) mitigated** by swapping `tar` for `bsdtar` and purging GNU tar in runtime images.
- **CVE-2025-8941 (pam_namespace LPE in linux-pam) mitigated** in the .NET 10 runtime by diverting and removing `/lib/x86_64-linux-gnu/security/pam_namespace.so`; SDK stage unchanged.
- **Runtime hardening**: non-root UID 1654, read-only root filesystem, capabilities dropped (only `NET_BIND_SERVICE` kept), `no-new-privileges`, tmpfs for `/tmp`, healthcheck hitting `/umbraco`.
- **Side-by-Side Support**: Both stacks now run concurrently, isolated by Docker Compose project names.
  - **Net9 Stack:** HTTP `http://localhost:8080`, HTTPS `https://localhost:8443` (SQL Server port `14339` if `mssql` profile active).
  - **Net10 Stack:** HTTP `http://localhost:8090`, HTTPS `https://localhost:8450` (SQL Server port `14330` if `mssql` profile active).
- **Data Persistence**: Both stacks correctly persist SQLite databases (`articulate16_net9_db`, `articulate17_net10_db`) and media (`articulate16_net9_media`, `articulate17_net10_media`) across container restarts.
- **Auto-Publish**: The container correctly identifies Articulate migrations and auto-publishes the blog tree on first run, making URLs like `/`, `/tags`, `/search` immediately `200 OK`.
- **Build/run commands** (with `mise`):  
  - Umbraco 15/16 (.NET 9): `mise run docker-up-build`  
  - Umbraco 17 (.NET 10): `mise run docker10-up-build`
- **Connection strings**: Docker site templates include default SQLite DSNs. Override `ConnectionStrings__umbracoDbDSN` for SQL Server or custom paths.
- **Debug**: `mise run docker-debug` / `mise run docker10-debug` to start in Debug mode (Development environment + Debug build).
- **Models mode override**: Pass `MODELS_MODE` (default `Nothing`) to request `SourceCodeManual`/`SourceCodeAuto` during local debugging.
- **Reset behavior**: `mise run docker-reset` / `docker10-reset` remove corresponding MSSQL and SQLite data volumes for a fresh install.

## Hot reload (Razor + RCL assets)

- Use `dotnet watch -f net9.0 --project src/Articulate.Tests.Website/Articulate.Tests.Website.csproj` (or `-f net10.0`) for Razor views and static assets hot reloading.
- Static web assets ship from `Articulate.StaticAssets` (see `src/Articulate.StaticAssets/Articulate.StaticAssets.csproj`); `Articulate.Web` and `Articulate.Api.Management` deliberately disable implicit static web assets to avoid duplication. `StaticWebAssetBasePath` defaults to `/` via `Directory.Build.props`.
- Hot reload needs project references: keep the RCLs referenced as projects while developing. If you are testing the packaged `Articulate.StaticAssets` nupkg, `dotnet watch` cannot see source files; temporarily swap back to a `ProjectReference`, or unpack the nupkg and work from that source instead.
- Set `DOTNET_WATCH_SUPPRESS_BROWSER_REFRESH=1` for metadata-only hot reload without automatic browser refresh.
- Watcher limits: `dotnet watch` monitors source/Razor/project files. If you hit OS watcher caps (`ENOSPC`/`FSW buffer overflow`), raise `fs.inotify.max_user_watches` or use `DOTNET_USE_POLLING_FILE_WATCHER=1`.
- Tooling is now pinned via `mise` (node 24.x, pnpm 10.20.0, dotnet tool nbgv). First-time setup: `pwsh -NoLogo -File ./mise-activate.ps1`, then `mise install` and `mise run init`; CI can use `mise install --locked`.
- `pnpm run dev` / `pnpm run watch` (from `src/Articulate.Api.Management/Client`) use a custom Vite pipeline that minifies CSS/JS. Production builds use `pnpm run build:release`.
- Full .NET build with client: set `ENABLE_CLIENT_BUILD=true` on `build/build.ps1` (or `mise run build-client`). Build mode still follows `BUILD_CONFIGURATION`: Debug → `pnpm run build`; Release/CI → `pnpm run build:release`.
- Vite plugins of note (see `src/Articulate.Api.Management/Client/vite.config.ts`): `staticAssetsPlugin()` rebuilds theme/Markdown bundles; `versioningPlugin()` stamps package versions; `umbracoPackagePlugin()` moves `umbraco-package.json` for discovery.
- Backoffice client HMR (Vite): from `src/Articulate.Api.Management/Client` run `pnpm install`, then `pnpm run dev`; use alongside the test website for HMR of the backoffice extension.

### Client dev quickstart

From `src/Articulate.Api.Management/Client`:

```powershell
pnpm install
pnpm run dev          # Vite backoffice (Lit) dev server
pnpm run generate:api # Requires the Umbraco site running; regenerates typed client after API changes
pnpm run build:release # Production bundles (terser + stamping); use pnpm run build for dev-mode bundles
```

## Build & pack (multi-target .NET 9/10)

| Script                        | Command                              |
| ----------------------------- | ------------------------------------ |
| Windows CMD / PowerShell      | `pwsh -NoLogo -File build/build.ps1` |
| Bash / WSL / Linux / macOS    | `./build/build.sh`                   |

> WSL/Linux first-time setup: ensure the script is executable with `chmod u+x ./build/build.sh` before running it.

- Optional envs:
  - `BUILD_CONFIGURATION=Debug` (default is `Release`)
  - `ENABLE_CLIENT_BUILD=true` to build the TS backoffice client locally (defaults to false locally, true in CI)
- Defaults: Debug uses `pnpm run build`; Release/CI uses `pnpm run build:release`; both respect `BUILD_CONFIGURATION`.
- Both scripts clean, restore, build, and pack `Articulate`, `Articulate.Web`, `Articulate.Api.Management`, and `Articulate.StaticAssets` for .NET 9 and 10.

### Optional: regenerate the backoffice client during the build

`EnableClientBuild` defaults to `false` to avoid Visual Studio background builds clashing with the Vite output. When you explicitly need to rebuild the backoffice bundles (for example before packaging), set `ENABLE_CLIENT_BUILD=true` inline with the build command:

- PowerShell: `$env:ENABLE_CLIENT_BUILD='true'; ./build/build.ps1`
- CMD: `set ENABLE_CLIENT_BUILD=true && pwsh -NoLogo -File build\build.ps1`
- Bash: `ENABLE_CLIENT_BUILD=true ./build/build.sh`

## Changing Umbraco Articulate schema/data elements

If you change Umbraco schema/content/media (doc types, data types, etc.), re-create the Articulate package in the back office with all required dependencies, then re-save the `package.zip` and commit it.

## Migration notes (from 5.x)

1.  Backup your Umbraco instance (DB + media).
2.  Upgrade Umbraco to 15.4.4+ (or 16/17).
3.  Install/update to `Articulate` 6.0.0-beta via NuGet (brings dependencies).
4.  Re-run Articulate package migrations if prompted; verify post-install checks in README.
5.  Export BlogML from Articulate 5 and import into Articulate 6; media in `media/articulate` is not auto-migrated.
6.  Re-test custom themes and API consumers against new asset locations and endpoints.

Media migration notes:

- BlogML import offers an option to map `postImage` to base64 or to an attachment; pick the one that suits your editors.
- Additional inline images stored under `media/articulate` are not migrated automatically—copy the files over (keeping paths) or perform an in-place Umbraco package upgrade if you need existing media preserved.

## Known issues

- Facebook Comments will be discontinued on February 10, 2026, therefore the Facebook comment partial has been removed.
- Expect layout tweaks in the Lit backoffice during beta polish.
- If Hot Reload misses a change after adding new files, restart `dotnet watch` (rare after the latest plugin refresh logic).
- Occasional dev hiccup: after running shell builds, the next Visual Studio build can fail once; a second VS build typically succeeds.

Recommended actions:

- Test custom themes/extensions early; adjust for the new API surface and asset paths.
- Validate third-party API consumers against the reorganized management endpoints.
- Plan extra testing time for migration complexity and third-party integration updates.

## Links

- README (quickstart, setup): `README.md`
- Client quickstart: `src/Articulate.Api.Management/README.txt`
- Issues: <https://github.com/Shazwazza/Articulate/issues>
- Docs/Wiki: <https://github.com/Shazwazza/Articulate/wiki>

**Release date:** December 2025  
**Compatibility:** Umbraco 15.4.4+, 16, 17  
**License:** MIT  
**Repository:** <https://github.com/Shazwazza/Articulate>
