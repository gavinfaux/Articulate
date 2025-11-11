# Articulate Marketplace Listing

[![Articulate Build](https://github.com/Shazwazza/Articulate/actions/workflows/build.yml/badge.svg)](https://github.com/Shazwazza/Articulate/actions/workflows/build.yml)

![Articulate](https://raw.githubusercontent.com/Shazwazza/Articulate/develop/assets/Logo.png?raw=true)

> A wonderful Blog engine built on Umbraco

_If you use and like Articulate please consider [becoming a GitHub Sponsor](https://github.com/sponsors/Shazwazza/)._

## Features

Supporting all the features you'd want in a blogging platform

* Categories & Tags
* Themes
* Multiple archives
* Live Writer support
* Markdown support
* Post from your mobile phone including photos direct from you camera
* Disqus or Facebook comment support (or build your own)
* Search
* Blogml import/export (including Disqus import)
* Customizable RSS feeds
* Customizable urls
* Author profiles

## Minimum requirements

* **Umbraco 13 LTS (maintenance)** - Articulate 5.x (security support until Dec 2025, EOL Dec 2026)
* **Umbraco 15.4.4+ / 16 / 17 (current)** - Articulate 6.x multi-targets `net9.0;net10.0` (Umbraco 15/16 on .NET 9, Umbraco 17 RC on .NET 10 previews)

## Installation notes

* **Umbraco 13 LTS:** install Articulate 5.x from the marketplace, run pending migrations, and save the `Articulate Image Picker` data type once to restore demo media (issue [#460](https://github.com/Shazwazza/Articulate/issues/460)).
* **Umbraco 15.4.4+ / 16 / 17:** install Articulate 6.x from NuGet. When building from source, run the development site with `dotnet run -f net9.0 --project src/Articulate.Tests.Website/Articulate.Tests.Website.csproj` (or `-f net10.0` for Umbraco 17) and sign into the Umbraco backoffice to let migrations seed demo content.

## [Documentation](https://github.com/Shazwazza/Articulate/wiki)

Docs on installation, creating posts, customizing/creating themes, etc...

## [Discussions](https://our.umbraco.org/projects/starter-kits/articulate/discussions)

Please post to this Umbraco discussions forum to discuss Articulate, it's features and functionality. Do not post issues here; file them via the [Articulate GitHub issues list](https://github.com/Shazwazza/Articulate/issues)

## [Issues](https://github.com/Shandem/Articulate/issues)

If you have any issues, please post them here on GitHub

## [Releases](https://github.com/Shazwazza/Articulate/releases)

See here for the list of releases and their release notes

## Contributing

1. Clone/fork the repository and open `src/Articulate.sln` in Visual Studio or Rider.
1. Build once to restore NuGet packages. For the backoffice client, run `pnpm install` inside `src/Articulate.Api.Management/Client`.
1. Use the development site for day-to-day testing:  
   `dotnet run -f net9.0 --project src/Articulate.Tests.Website/Articulate.Tests.Website.csproj`  
   (`-f net10.0` when validating Umbraco 17). Complete the Umbraco installer; migrations seed the Articulate schema and demo content automatically.
1. When editing the Vite client, run `pnpm run dev` (or `pnpm run build` / `pnpm run build:release` to refresh the `dist/` assets that ship inside the package).
1. Use `pwsh build/build.ps1` (Windows) or `bash build/build.sh` (Linux/WSL) to reproduce the release build: the scripts restore, build `net9.0/net10.0`, and pack the `Articulate`, `Articulate.Core`, `Articulate.Api.Management`, and `Articulate.StaticAssets` NuGet packages into `build/Release/`.

Now you're all set! Edit code, rebuild, and refresh the test site to validate changes end-to-end.

### Changing Umbraco Articulate schema/data elements

If you need to make changes to the underlying Umbraco schema (doc types, data types, etc...) or the installed package's content/media, then you will need
to re-create the Articulate package in the back office with all required dependencies and then re-save the package.zip file and commit it to the repository.

## Copyright & Licence

&copy; 2025 by Shannon Deminick

This is free software and is licensed under the [The MIT License (MIT)](http://opensource.org/licenses/MIT)

