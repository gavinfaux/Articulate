# Articulate

[![Articulate Build](https://github.com/Shazwazza/Articulate/actions/workflows/build.yml/badge.svg)](https://github.com/Shazwazza/Articulate/actions/workflows/build.yml)

![Articulate](https://raw.githubusercontent.com/Shazwazza/Articulate/develop/assets/Logo.png?raw=true)

> A wonderful Blog engine built on Umbraco

---
_❤️ If you use and like Articulate please consider [becoming a GitHub Sponsor](https://github.com/sponsors/Shazwazza/)._

## Installation

Two support tracks are available depending on the Umbraco version you run.

### Umbraco 13 LTS (maintenance mode)

Articulate 5.x remains available for Umbraco 13, which is in security maintenance until **December 2025** and reaches end of life in **December 2026**. The package still installs from the Umbraco marketplace.

- After installing, open the Packages section (`umbraco/section/packages/view/installed`) and run any pending migrations.
- Save the `Articulate Image Picker` data type once to fix bundled demo media (issue [#460](https://github.com/Shazwazza/Articulate/issues/460)). This step is only required on Umbraco 13.
- For long-term projects consider upgrading to Umbraco 16+ where Articulate 6 receives active feature work.

_Need help?_ Head over to [Articulate on GitHub](https://github.com/Shazwazza/Articulate) for extra tips, known issues and fixes.

### Umbraco 15.4.4+ / 16 / 17 (current track)

Articulate 6 targets Umbraco 15.4.4, 16, and 17.

- Install `Articulate` from NuGet (`dotnet add package Articulate`). The package now ships a transitive dependency on `Articulate.StaticAssets`, so the `/App_Plugins/Articulate/**` files light up automatically-no extra package references or manual copies required.
- When building from source, run the test site `dotnet run -f net9.0 --project src/Articulate.Tests.Website/Articulate.Tests.Website.csproj` (or `-f net10.0` for Umbraco 17) and sign into the Umbraco Back Office to finish setup.
- Migrating from 5.x: in place upgrade or export BlogML from your Articulate 5 site and import it into Articulate 6; media in `media/articulate` is not auto-migrated. During import you can map `postImage` to base64 or an attachment; other inline images must be moved manually (copy the folder, or consider an in-place package upgrade).

## Features

- Categories & Tags
- Themes
- Multiple archives
- Live Writer support
- Markdown support
- Post from your mobile phone including photos direct from your camera
- Disqus comment support (or build your own)
- Search
- BlogML import/export (including Disqus import)
- Customizable RSS feeds
- Customizable URLs
- Author profiles
- Extensible API + modern build tooling aligned with current .NET/Umbraco releases (DI-friendly codebase, multi-target net9/net10, pnpm/Vite client pipeline)

## Minimum requirements

- Articulate 5.x (maintenance): Umbraco 13 LTS (security support through Dec 2025, EOL Dec 2026)
- Articulate 6.x (current): Umbraco 15.4.4+ and 16.0+ on .NET 9; Umbraco 17.0+ on .NET 10

## [Documentation](https://github.com/Shazwazza/Articulate/wiki)

Docs on installation, creating posts, customizing/creating themes, etc...

## [Issues](https://github.com/Shazwazza/Articulate/issues)

If you have any issues, please post them here on GitHub

## [Releases](https://github.com/Shazwazza/Articulate/releases)

See here for the list of releases and their release notes

## [Community Discussions](https://forum.umbraco.com/tag/packages)

- Please use the Umbraco forums to ask questions and discuss Articulate, it's features and functionality.
- Do not post issues here, post them to [Articulate/issues](https://github.com/Shazwazza/Articulate/issues) on GitHub

## Contributing

### Requirements

- .NET 9.0 SDK
- .NET 10.0 SDK
- Node.js 24+ with `corepack enable pnpm`
- [Optional] Nerdbank.GitVersioning CLI `dotnet tool install -g nbgv`; only required for 'Release' builds
- IDE: Visual Studio 2026 (Community Edition will suffice), JetBrains Rider
or Visual Studio Code (or your preferred fork 😄)
- Shell: powershell (v5), pwsh (v7) or bash (WSL/Linux)

1. Clone/fork the repository
2. Prime the site/solution to ensure Back Office Client extension is built (build output is not checked in)

- PowerShell: `$env:ENABLE_CLIENT_BUILD='true'; $env:BUILD_CONFIGURATION=Debug; ./build/build.ps1`
- Bash: `ENABLE_CLIENT_BUILD=true BUILD_CONFIGURATION=Debug ./build/build.sh`

  This will restore NuGet packages, npm packages, build Back Office Client, Theme/Markdown dist bundles, the .NET solution (and also produce NuGet packages)

1. Open the /src/Articulate.sln file
2. Ensure that Articulate.Test.Web is set as the startup project
3. Start the Articulate.Test.Web project
4. This will run the Umbraco installer, install as per normal
5. The Articulate package migrations will also execute and install all of the Articulate schema and content items

Now you're all set! Any source .NET changes you wish to make just do that in your IDE, build the solution when you need to and the changes will be reflected in the website. If your making Back Office extension changes you will need to rebuild the client via CLI or build script.

### Client development quickstart

From `src/Articulate.Api.Management/Client`:

```bash
pnpm install
pnpm run build # Development build of back office client and all Themes/Markdown Editor *dist* bundles
pnpm run generate:api # Requires the Umbraco site running; regenerates typed client after API changes
```

## Build & pack (multi-target .NET 9/10)

| Shell                | Command               |
| -------------------- | --------------------- |
| Windows PowerShell   | `./build/build.ps1`   |
| Bash / WSL / Linux   | `./build/build.sh`    |

- **WSL/Linux** first-time setup: ensure the script is executable with `chmod u+x ./build/build.sh` before running it.

- Optional envs:
  - `BUILD_CONFIGURATION=Debug` (default is `Release`)
  - `ENABLE_CLIENT_BUILD=true` to build the TS Back Office client locally (defaults to false locally, true in CI)
- Defaults: Debug uses `pnpm run build`; Release/CI uses `pnpm run build:release`; both respect `BUILD_CONFIGURATION`.
- Both scripts clean, restore, build, and pack `Articulate`, `Articulate.Web`, `Articulate.Api.Management`, and `Articulate.StaticAssets` for .NET 9 and 10.

### Optional: regenerate the Back Office client during the build

`EnableClientBuild` defaults to `false` to avoid Visual Studio background builds clashing with the Vite output. When you explicitly need to rebuild the Back Office bundles use the CLI `pnpm run build` or  (for example before packaging), set `ENABLE_CLIENT_BUILD=true` inline with the build command:

- PowerShell: `$env:ENABLE_CLIENT_BUILD='true'; ./build/build.ps1`
- Bash: `ENABLE_CLIENT_BUILD=true ./build/build.sh`

### Changing Umbraco Articulate schema/data elements

If you need to make changes to the underlying Umbraco schema (doc types, data types, etc...) or the installed package's content/media, then you will need
to re-create the Articulate package in the back office with all required dependencies and then re-save the package.zip file and commit it to the repository.

## Copyright & License

&copy; 2025 by Shannon Deminick

This is free software and is licensed under the [The MIT License (MIT)](http://opensource.org/licenses/MIT)
