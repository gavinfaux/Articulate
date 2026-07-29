# Articulate Build

The canonical reference for the build system and CI pipeline. For day-to-day
developer setup, see [DEVELOP.md](DEVELOP.md).

`build/build.cs` is the sole repo-owned entry point for local and CI build and
Docker tasks:

```text
dotnet run --file build/build.cs -- help
dotnet run --file build/build.cs -- help <command>
```

Docker CA trust also stays on the same runner:

```text
dotnet run --file build/build.cs -- docker-ca
```

The CLI help is the canonical command/option reference, including defaults and
environment requirements. Environment variables remain supported for CI and
local overrides.

## Build parameters

| Parameter                    | Default                                | Description                                                                                                                                                                                                                |
|------------------------------|----------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `--lane`                     | `v17`                                  | Package lane: `v17` (Articulate 6.1 for Umbraco 17) or `v18` (Articulate 7.0 for Umbraco 18).                                                                                                                              |
| `--configuration`            | `Release`                              | Build configuration: `Debug` or `Release`.                                                                                                                                                                                 |
| `--tests`                    | `true` in CI, otherwise `false`        | Run `dotnet test` after build.                                                                                                                                                                                             |
| `--client`                   | `true` in CI/Release, `false` in Debug | Enable the TypeScript Back Office client build (Vite + tsc).                                                                                                                                                               |
| `--sample`                   | `true` locally, `false` in CI          | Also pack `Articulate.Theme.Sample`. The sample .nupkg is consumed locally by the Docker pipeline (see `build/docker-site/ArticulateDockerSite.csproj`); it is **not** published and is excluded from CI artifact uploads. |
| `--clean`                    | `false`                                | Wipe `src/**/bin` and `obj`, `build/ClientAssets`, and client `node_modules`. `BuildAsync` always invalidates the per-lane `BackOffice` assets and Vite stamp before each build (see [Package lanes](#package-lanes)).     |
| `ARTICULATE_PACKAGE_VERSION` | calculated                             | Optional explicit package-version override. v17 uses NBGV; v18 uses `version-v18.txt` plus NBGV metadata.                                                                                                            |

The packable package is produced by `src/Articulate.Web/Articulate.Web.csproj`
(`PackageId=Articulate`). Packages are written under `build/$(Configuration)/v17`
or `build/$(Configuration)/v18`.

Because both lanes share project `bin`/`obj` directories and static-web-asset
paths, always run full-solution lane builds sequentially and with `-m:1`
(`build/build.cs` already does this internally).

## Common build commands

Local debug build with the Back Office client:

```powershell
dotnet run --file build/build.cs -- build --configuration Debug --client true
```

v17 release package with sample theme:

```powershell
dotnet run --file build/build.cs -- build --lane v17 --sample
```

v18 release package with sample theme:

```powershell
dotnet run --file build/build.cs -- build --lane v18 --sample
```

CI / release build for both lanes:

```powershell
# Run once per lane; each run cleans shared outputs first.
dotnet run --file build/build.cs -- build --lane v17 --clean --client true --tests --sample
dotnet run --file build/build.cs -- build --lane v18 --clean --client true --tests --sample
```

## Package lanes

| Lane  | Package line     | Umbraco support | Target framework | Output folder       |
|-------|------------------|-----------------|------------------|---------------------|
| `v17` | Articulate 6.1.x | Umbraco 17.5.3+   | `net10.0`        | `build/Release/v17` |
| `v18` | Articulate 7.0.x | Umbraco 18.0.2+   | `net10.0`        | `build/Release/v18` |

The lanes produce separate NuGet packages because Umbraco 17 and 18 extension
points are not binary-compatible. Do not cross-install (Articulate 6 ↔ Umbraco 18,
or Articulate 7 ↔ Umbraco 17).

`version.json` defines the Articulate 6.1 version through NBGV.
`version-v18.txt` defines the Articulate 7 base version. The build runner
appends NBGV commit metadata when present: a v18 base of `7.0.0` produces
`7.0.0.gabcdef`. Change the text file to advance the v18 release; callers do
not normally pass a version.

Both lanes share `wwwroot/App_Plugins/Articulate/BackOffice/`, so each lane
build clears that output and its per-lane Vite stamp before rebuilding. This
prevents one lane's Backoffice assets from leaking into the other lane's
package.

Client source and tooling are shared under `src/Articulate.Web/Client/common/`.
The lane folders retain only package metadata, generated API output, and small
compatibility adapters; the Markdown property editor uses Umbraco's native
Markdown input.

## NuGet lock files

The two shipped packages use lock files (opt-in via `RestorePackagesWithLockFile=true`):

- `src/Articulate.Web/packages.v17.lock.json`, `…packages.v18.lock.json`
- `src/Articulate.Theme.Sample/packages.v17.lock.json`, `…packages.v18.lock.json`

CI and the build script use `--locked-mode`, so these files must be checked in
and kept current.

### After any version bump

When you change a centralized version in `Directory.Packages.props` (e.g. the
Umbraco floor), regenerate the lock files for both lanes.
Run from the repo root:

```powershell
dotnet restore ./src/Articulate.sln -p:ArticulatePackageLane=v17 -p:RestoreLockedMode=false --force-evaluate
dotnet restore ./src/Articulate.sln -p:ArticulatePackageLane=v18 -p:RestoreLockedMode=false --force-evaluate
```

`--force-evaluate` re-evaluates NuGet sources and props without rebuilding the
MSBuild graph, so a CPM-only change still triggers a fresh dependency resolve.
`-p:RestoreLockedMode=false` is required because the in-tree lock files pin
the previous floor.

Current floors in `Directory.Packages.props`:

| Lane | Package | Floor |
|------|---------|-------|
| `v17` | `Umbraco.Cms.*` | `[17.5.3,18.0.0)` |
| `v18` | `Umbraco.Cms.*` | `[18.0.2,19.0.0)` |
| `v17` | `TinyMCE.Umbraco` | `[17.5.0,18.0.0)` |
| `v18` | `TinyMCE.Umbraco` | `[18.0.0,19.0.0)` |

### Back Office client floors

The Back Office client package must meet the Umbraco floor for its lane.

| Lane | Client package floor |
|------|----------------------|
| `v17` | `@umbraco-cms/backoffice ^17.5.3` |
| `v18` | `@umbraco-cms/backoffice ^18.0.2` |

The client package is a development dependency. It is not included in the
Articulate NuGet package. Umbraco supplies the Back Office runtime.

To update a client floor:

1. Change the matching lane `package.json`.
2. Run `pnpm install` from `src/Articulate.Web/Client`.
3. Check the updated `pnpm-lock.yaml` file.
4. Run the client checks for the affected lane.
5. Run the full lane build and package smoke test.

Do not regenerate the Articulate API client for an Umbraco package update
unless an Articulate endpoint contract changed. Regenerate both lane clients
after a shared Articulate route, model, authorization, or OpenAPI change.

`build.cs` resolves `UmbracoCmsPackageVersion` and `TinyMceUmbracoPackageVersion`
from `Directory.Packages.props` via `dotnet msbuild -getProperty` (see
`Env.GetUmbracoCmsPackageVersionRange` / `Env.GetTinyMceUmbracoPackageVersionRange`),
so the docker site picks up the same floors automatically — no second edit
needed in `build.cs` or `Dockerfile`.

### TinyMCE opt-in (dev / test sites only)

TinyMCE.Umbraco is included only when `UseTinyMceUmbraco=true` is set at build
time, and only in the two non-packable consumers:

- `build/docker-site/ArticulateDockerSite.csproj` — dev docker site
- `src/Articulate.Tests.Website/Articulate.Tests.Website.csproj` — test website

The dist `Articulate.nupkg` and `Articulate.Theme.Sample.nupkg` do **not**
include TinyMCE.Umbraco and do **not** reference it; consumers install it
separately if they want it.

To enable TinyMCE in the test website (the typical local-dev path), add
`<UseTinyMceUmbraco>true</UseTinyMceUmbraco>` to `Directory.Build.props.user`
next to your `ArticulatePackageLane` line. CPM picks the right version per lane.

To enable TinyMCE in the docker site:

```powershell
$env:USE_TINYMCE_UMBRACO = 'true'
dotnet run --file build/build.cs -- docker-dev --lane v17
```

The runtime migration in `src/Articulate/Migrations/Upgrade/V_6_0_0/MigrateArticulateRichText.cs`
probes for the TinyMCE assembly via reflection and branches behavior based on
whether TinyMCE is installed at runtime — no compile-time reference, so the
dist package's detection code works whether or not TinyMCE is present.

Test projects and the test website float; they do not need lock files.

The lock files are restore-time inputs for `<RestoreLockedMode>` and never ship
in the published package — both packable `.csproj` files exclude
`packages.*.lock.json` via `<Content Remove>`. The [package smoke test](#package-smoke-test)
fails the build if a lock file reappears in any `*.nupkg`.

## Package smoke test

`build/smoke-package.mjs` opens each `build/Release/<lane>/*.nupkg` and
`*.snupkg`, extracts key files, and verifies the package is well-formed. CI runs
it after both lanes pack and before artifact upload; a failed check skips the
workflow upload so leaks never reach GitHub Actions artifacts.

Run it locally after a build:

```bash
node build/smoke-package.mjs build/Release/v17 build/Release/v18
```

What it checks for `Articulate.<ver>.nupkg`:

- Root files: `LICENSE`, `README.md`, `icon.png`.
- `.nuspec` parses; `id=Articulate`; has the `net10.0` dependency group with
  `Umbraco.Cms.Web.Website` + `Umbraco.Cms.Api.Management`.
- Ships only `staticwebassets/` for client assets (no legacy `content/` or
  `contentFiles/any/{tfm}/` paths).
- Built-in theme assets include `src` and `vendor` files as well as generated
  `dist` bundles. The Sample RCL package is checked separately.
- `lib/net10.0/`: `Articulate.Web.dll` + `.xml`, `Articulate.dll` + `.xml`.
- `build/`: `Articulate.targets`, `Articulate.props`, and the
  `Microsoft.AspNetCore.StaticWebAssets*.props` files.
- `umbraco-package.json` parses and declares a back-office entry.
- BackOffice bundles present (entrypoint, articulate-backoffice.js, dashboard,
  theme-picker, markdown editor) and all four theme preview PNGs
  (`theme-{material,mini,phantom,vapor}.png`).
- `MarkdownEditor` assets (`md-editor.min.css`, `md-editor.min.js`).
- Each shipped theme (Material, Mini, Phantom, VAPOR) has its `*.min.css` (and
  the JS bundles that exist).
- `Articulate.dll` contains every embedded resource under
  `Articulate.Packaging.*` — `author.jpg`, `banner.jpg`, `logo.png`,
  `package.zip` (Starter Kit installer), `post1.jpg`, `post2.jpg`.
- `Articulate.Web.dll` exposes the `Articulate.Theme://` logical-name prefix
  (used by `ArticulateThemeRepository.CopyThemeAsync`) and at least 50
  occurrences of `App_Plugins_Articulate_Themes_*` (compiled razor views).
- No `packages.*.lock.json` anywhere in the archive.

What it checks for `Articulate.Theme.Sample.<ver>.nupkg`:

- Root files, no lock files, single `.nuspec` with `id=Articulate.Theme.Sample`
  and a dependency on `Articulate`.
- `lib/net10.0/Articulate.Theme.Sample.dll` present.
- `staticwebassets/.../Themes/Sample/assets/{css/site.css,js/site.js}` present.

What it checks for `Articulate.<ver>.snupkg`:

- `lib/net10.0/Articulate.Web.pdb` present and non-trivial (> 50 KB).
