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
- The scripts clean, restore, build, and pack the current Articulate projects for .NET 9 and .NET 10.
- The packable NuGet package is produced by `src/Articulate.Web/Articulate.Web.csproj` (`PackageId=Articulate`). If you change packaged runtime dependencies, re-run `dotnet pack src/Articulate.Web/Articulate.Web.csproj -c Release -o build/Release` before validating source-built or Docker-based installs.
- The Docker build now selects the newest `Articulate.*.nupkg` in `build/Release` by modified time and ignores `.snupkg` files.
- After rebuilding the Docker image, recreate the `articulate` service so it actually runs the new image: `docker compose up -d --force-recreate --no-deps articulate`.
- If the Docker back office still appears stale after a rebuild, open `https://localhost:18443/App_Plugins/Articulate/BackOffice/articulate-backoffice.js` and confirm the imported `dashboard.element-*.js` hash matches the files inside the running container.
- The default unattended Docker backoffice user is `admin@localhost` with password `@rticulate` and display name `Jane Doe`. Override with `UMBRACO_USER_NAME`, `UMBRACO_USER_EMAIL`, and `UMBRACO_USER_PASSWORD` when needed.

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
