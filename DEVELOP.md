# Articulate Development

## Requirements

- .NET 9.0 SDK
- .NET 10.0 SDK
- Node.js 24+ with `corepack enable pnpm`
- Optional: Nerdbank.GitVersioning CLI (`dotnet tool install -g nbgv`), only needed for Release builds
- IDE: Visual Studio 2026, JetBrains Rider, or Visual Studio Code
- Shell: PowerShell 5+, PowerShell 7+, or Bash (WSL/Linux)

## First Run

1. Clone or fork the repository.
2. Prime the site and solution so the Back Office client extension and asset bundles are built.

PowerShell:

```powershell
$env:ENABLE_CLIENT_BUILD='true'; $env:BUILD_CONFIGURATION='Debug'; ./build/build.ps1
```

Bash:

```bash
ENABLE_CLIENT_BUILD=true BUILD_CONFIGURATION=Debug ./build/build.sh
```

This restores NuGet and npm packages, builds the Back Office client, builds the theme and Markdown editor dist bundles, builds the .NET solution, and produces NuGet packages.

3. Open `src/Articulate.sln`.
4. Set `Articulate.Tests.Website` as the startup project.
5. Start `Articulate.Tests.Website` and complete the Umbraco installer.
6. The Articulate package migrations will run and install the required schema and content items.

## Docker Modes

The Compose stack now supports two explicit runtime states through `UMBRACO_RUNTIME_MODE`:

- `BackofficeDevelopment` for local dev and agent runs. This enables the dev-only automation bootstrap so the API user and client credentials can be provisioned automatically after install and migrations.
- `Production` for the production-style check. This disables automation bootstrap and keeps the stack honest about what content was already published in the data volume.

Recommended benchmark flow:

1. Start with an empty Docker volume set in `BackofficeDevelopment` by running the dev script with `RESET_DOCKER_VOLUMES=true`.
2. Use `AUTOPUBLISH_MODE=api` for the primary dev lane: unattended install and package migrations run, automation bootstrap provisions credentials, and `build/docker-site/smoke.mjs` publishes/verifies the Articulate content tree.
3. In the real package import path, Articulate should migrate first and `Articulate.Theme.Sample` should migrate second so the sample content can import cleanly.
4. Verify `/` returns `200` and record the timing.
5. Re-run the same volume set in `Production` to confirm the published content still serves without any dev-only automation.

Optional test paths:

- `AUTOPUBLISH_MODE=api` keeps the current dev publish loop where `smoke.mjs` calls the Management API directly.
- `AUTOPUBLISH_MODE=plugin` is the confirm-only harness for the real package-side opt-in path; it requires `AUTOPUBLISH_PACKAGE_ZIP` to point at a zip whose `package.xml` contains `<Documents>` or `<MediaItems>`, such as `src/Articulate.Theme.Sample/Packaging/package.zip`, then verifies state through the Management API plus the public root.
- `AUTOPUBLISH_MODE=none` skips publish/confirm entirely if you only want the container boot.
- `RESET_DOCKER_VOLUMES=true` runs `docker compose down -v` before the dev script starts the stack. Use it for empty-DB QA, not for normal iterative runs.

## Client Development

From `src/Articulate.Web/Client`:

```bash
pnpm install
pnpm run build
pnpm run generate:api
```

`pnpm run generate:api` requires the Umbraco site to be running and regenerates the typed client after API changes.

## Build And Pack

| Shell | Command |
| --- | --- |
| Windows PowerShell | `./build/build.ps1` |
| Bash / WSL / Linux | `./build/build.sh` |

- For WSL/Linux, make the script executable first with `chmod u+x ./build/build.sh`.
- `BUILD_CONFIGURATION=Debug` is the default for local builds; Release is the default in packaging flows.
- `ENABLE_CLIENT_BUILD=true` enables local TypeScript Back Office client builds.
- `PACK_SAMPLE_THEME=true` forces packing `Articulate.Theme.Sample`; local builds pack it by default, but CI skips it unless explicitly enabled.
- The scripts clean, restore, build, and pack the current Articulate projects for .NET 9 and .NET 10.
- The packable NuGet package is produced by `src/Articulate.Web/Articulate.Web.csproj` (`PackageId=Articulate`). Packages are written under `build/$(Configuration)` by default.
- If you change packaged runtime dependencies or client/static assets, regenerate the Docker inputs before validating source-built or Docker-based installs:
  - `dotnet pack src/Articulate.Web/Articulate.Web.csproj -c Release`
  - `dotnet pack src/Articulate.Theme.Sample/Articulate.Theme.Sample.csproj -c Release`
- Keep `Articulate` and `Articulate.Theme.Sample` at the same package version in `build/Release`; the Docker site restores both using the selected Articulate package version, and the Sample package is the canonical opt-in example for the auto-publish flow.
- The Dockerfile selects the newest `Articulate.[0-9]*.nupkg` in `build/Release` by modified time and ignores `.snupkg` files and theme packages when choosing the version.
- Rebuilding the image is not enough on its own. A running Compose service can remain on an older image/container. Use `docker compose up -d --build --force-recreate articulate`, or run both steps explicitly:
  - `docker compose build articulate`
  - `docker compose up -d --force-recreate --no-deps articulate`
- The default image tag is `articulate-local:chiseled`; the Compose container name will still be project/service based, for example `articulate-pr-articulate-1`.
- To run the Umbraco 16 / .NET 9 line, set `TARGET_FRAMEWORK=net9.0`, `UMBRACO_CMS_VERSION=[16.5.1,17.0.0)`, keep `DOTNET_SDK_VERSION=10.0.201` unless `global.json` changes, set `DOTNET_ASPNET_VERSION=9.0`, and use a matching `IMAGE_TAG` such as `articulate-local:net9`.
- If the Docker back office still appears stale after a rebuild, check the running container, not just the image:
  - `docker compose ps`
  - `docker exec articulate-pr-articulate-1 /bin/sh -c "find /app -path '*App_Plugins/Articulate/BackOffice/articulate-backoffice.js' -o -path '*App_Plugins/Articulate/umbraco-package.json'"`
  - `Invoke-WebRequest https://localhost:18443/App_Plugins/Articulate/BackOffice/articulate-backoffice.js -SkipCertificateCheck`
- The default unattended Docker backoffice user is `admin@localhost` with password `@rticulate` and display name `Jane Doe`. Override with `UMBRACO_USER_NAME`, `UMBRACO_USER_EMAIL`, and `UMBRACO_USER_PASSWORD` when needed.
- Set `UMBRACO_RUNTIME_MODE=BackofficeDevelopment` for dev/agent automation, or `UMBRACO_RUNTIME_MODE=Production` for the production-style smoke test.

## Back Office Client Builds

`EnableClientBuild` defaults to `false` so Visual Studio background builds do not clash with Vite output. When you need to rebuild the client during packaging or local validation, set `ENABLE_CLIENT_BUILD=true` inline with the build command:

PowerShell:

```powershell
$env:ENABLE_CLIENT_BUILD='true'; ./build/build.ps1
```

Bash:

```bash
ENABLE_CLIENT_BUILD=true ./build/build.sh
```

## Schema And Data

If you change the underlying Umbraco schema, installed content, or media, recreate the Articulate package in the back office with its dependencies, then resave `package.zip` and commit it.
