# Articulate

[![Articulate Build](https://github.com/Shazwazza/Articulate/actions/workflows/build.yml/badge.svg)](https://github.com/Shazwazza/Articulate/actions/workflows/build.yml)

![Articulate](https://raw.githubusercontent.com/Shazwazza/Articulate/develop/assets/Logo.png?raw=true)

> A wonderful Blog engine built on Umbraco

---
_❤️ If you use and like Articulate please consider [becoming a GitHub Sponsor](https://github.com/sponsors/Shazwazza/)._

Release notes: see [RELEASE_NOTES_v6.0.0.md](RELEASE_NOTES_v6.0.0.md) for 6.x highlights and breaking changes.

## Installation

Two support tracks are available depending on the Umbraco version you run.

### Umbraco 13 LTS (maintenance mode)

Articulate 5.x remains available for Umbraco 13, which is in security maintenance until **December 2025** and reaches end of life in **December 2026**. The package still installs from the Umbraco marketplace.

- After installing, open the Packages section (`umbraco/section/packages/view/installed`) and run any pending migrations.
- Save the `Articulate Image Picker` data type once to fix bundled demo media (issue [#460](https://github.com/Shazwazza/Articulate/issues/460)). This step is only required on Umbraco 13.
- For long-term projects consider upgrading to Umbraco 15+ where Articulate 6 receives active feature work.

_Need help?_ Head over to [Articulate on GitHub](https://github.com/Shazwazza/Articulate) for extra tips, known issues and fixes.

### Umbraco 15.4.4+ / 16 / 17 (current track)

Articulate 6 targets Umbraco 15.4.4, 16, and 17.

- Install `Articulate` from NuGet (`dotnet add package Articulate`). The package now ships a transitive dependency on `Articulate.StaticAssets`, so the `/App_Plugins/Articulate/**` files light up automatically-no extra package references or manual copies required.
- When building from source, run the test site `dotnet run -f net9.0 --project src/Articulate.Tests.Website/Articulate.Tests.Website.csproj` (or `-f net10.0` for Umbraco 17) and sign into the Umbraco backoffice to finish setup.
- Migrating from 5.x: export BlogML from your Articulate 5 site and import it into Articulate 6; media in `media/articulate` is not auto-migrated. During import you can map `postImage` to base64 or an attachment; other inline images must be moved manually (copy the folder, or consider an in-place package upgrade). See the migration notes in [RELEASE_NOTES_v6.0.0.md](RELEASE_NOTES_v6.0.0.md#migration-notes-from-5x).

## Features

- Categories & Tags
- Themes
- Multiple archives
- Live Writer support
- Markdown support
- Post from your mobile phone including photos direct from your camera
- Disqus or Facebook comment support (or build your own)
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

## [Community Discussions](https://forum.umbraco.com/)

- Please use the Umbraco forums to ask questions and discuss Articulate, it's features and functionality.
- Do not post issues here, post them to [Articulate/issues](https://github.com/Shazwazza/Articulate/issues) on GitHub

## Contributing

1. Clone/fork the repository.
2. (Recommended) Install [mise](https://mise.jdx.dev/) and run:

   ```bash
   # pwsh
   pwsh -NoLogo -File ./mise-activate.ps1
   mise install          # installs pinned node/pnpm/nbgv from mise.lock
   mise run init         # installs client deps (pnpm) after tools are available

   # bash/zsh
   eval "$(mise activate bash)"

   mise install
   mise run init

   ```

  Or without mise: install Node.js 24+, enable Corepack, and `pnpm -C src/Articulate.Api.Management/Client install --frozen-lockfile`.
3. Open `src/Articulate.sln` in Visual Studio or Rider (the solution multi-targets `net9.0;net10.0`).
4. Build once to restore NuGet packages and pnpm-managed client assets (e.g., `mise run build` for Debug, or `$env:BUILD_CONFIGURATION=Release; mise run build` / `BUILD_CONFIGURATION=Release mise run build` in bash). Use `ENABLE_CLIENT_BUILD=true` if you want the client built inside the .NET build.
   Backoffice client scripts live in `src/Articulate.Api.Management/Client` (e.g., `pnpm run dev`, `pnpm run build:release`).
5. Use the test site for development:  
   `dotnet run -f net9.0 --project src/Articulate.Tests.Website/Articulate.Tests.Website.csproj`  
   (`-f net10.0` when validating Umbraco 17).
6. Complete the Umbraco installer and sign in; migrations seed the Articulate schema and demo content automatically.

WSL/Linux users: mark the build script executable before running it with `chmod u+x ./build/build.sh`.

> **Local URL reminder:** The test site defaults to IIS Express `https://localhost:44366` when launched from Visual Studio, and to Kestrel `https://localhost:5001` when run via `dotnet run` (or VS Code). Keep the corresponding values in `appsettings*.json` (e.g., `UmbracoApplicationUrl`, backoffice host, OAuth redirect URIs) aligned with whichever port you use.

## Docker / Docker Compose

See `docker_readme.md` for the full, up-to-date Docker guide. We support both .NET 9 and .NET 10 environments which can run side-by-side.

- **net9 (Umbraco 16.x):** `mise run docker-up-build` (HTTP: 8080, HTTPS: 8443)
- **net10 (Umbraco 17.x):** `mise run docker10-up-build` (HTTP: 8090, HTTPS: 8450)

Remember to run `mise run build` (Release config) before building Docker images, as they consume the local NuGet packages.

### Changing Umbraco Articulate schema/data elements

If you need to make changes to the underlying Umbraco schema (doc types, data types, etc...) or the installed package's content/media, then you will need
to re-create the Articulate package in the back office with all required dependencies and then re-save the package.zip file and commit it to the repository.

## Cross-platform builds (mise)

- Windows/PowerShell: `mise run build` or `mise run build-client` (uses `build/mise-build.ps1` -> `build/build.ps1`).
- WSL/Linux/macOS (bash): `mise run build-bash` or `mise run build-client-bash` (uses `build/build.sh`).
Dev workflow (HMR, hot reload, build/pack scripts, schema changes): see [RELEASE_NOTES_v6.0.0.md](RELEASE_NOTES_v6.0.0.md#hot-reload-razor--rcl-assets).

## Copyright & License

&copy; 2025 by Shannon Deminick

This is free software and is licensed under the [The MIT License (MIT)](http://opensource.org/licenses/MIT)