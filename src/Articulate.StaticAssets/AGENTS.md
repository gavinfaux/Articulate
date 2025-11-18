# Static Assets - Scoped Guide

Scope: applies to `src/Articulate.StaticAssets/**`.

## Purpose

- Hosts packaged static assets consumed by the solution.
- Orchestrates the client build (Vite) via MSBuild targets.
- Mirrors theme and Markdown editor assets from `Articulate.Web` into the static assets package.
- Do not hand-edit build outputs; regenerate via client builds where applicable.

## Client Build Process

The `BuildBackofficeClient` target (in `.csproj`) runs `pnpm install && pnpm run build:release` to:

1. Compile TypeScript backoffice client (Lit + TS).
2. Copy static assets from `Client/public` to the build output.
3. Write a build stamp (`build/ClientAssets/BackofficeClient.stamp`) to track completion for other TFMs.
4. Emit a generated asset manifest (`build/ClientAssets/BackofficeClient.assets.cache`) listing every file Vite produced so MSBuild can detect when hashed filenames change.

**Key behaviors:**

- **Serialized TFM builds**: Build scripts run TFMs sequentially (net9.0 first, then net10.0) to ensure proper client build ordering.
- **Designated client build**: Client build runs only for `ClientBuildTargetFramework` (default: `net9.0`) to prevent Vite race conditions.
- **Shared cache**: Client assets are cached at repo level (`build/ClientAssets/`) to avoid redundant Vite runs.
- **Incremental build**: MSBuild's `Inputs`/`Outputs` mechanism ensures:
  - net9.0 runs Vite if inputs are newer than the stamp.
  - net10.0 skips Vite and reuses the cached assets.
- **Stale-asset cleanup**: `CleanBackofficeStaticAssets` and `CleanMirroredStaticAssets` wipe the BackOffice/Markdown/Themes mirrors right before rebuild/sync, guaranteeing `ResolveStaticWebAssetsInputs` sees a fresh file list.
- **Control via `ENABLE_CLIENT_BUILD`**: Set to `false` to skip the client build (e.g., `export ENABLE_CLIENT_BUILD=false`).

## Build

- Build both TFMs: `dotnet build src/Articulate.StaticAssets/Articulate.StaticAssets.csproj -f net9.0 -c Release` and `-f net10.0`.
- Or use the release scripts (recommended):
  - Windows: `pwsh build/build.ps1`
  - Linux/WSL: `bash build/build.sh`
  - Both scripts are fully aligned: same parallelism, client build control, and error handling.

## Validation Checklist

- Assemblies/package contents align with generated client assets.
- Client build stamp exists at `build/ClientAssets/BackofficeClient.stamp` after a full build.
- No EPERM or file-not-found errors during parallel TFM builds.
