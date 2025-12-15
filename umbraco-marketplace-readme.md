# Articulate (Umbraco Marketplace)

[![Articulate Build](https://github.com/Shazwazza/Articulate/actions/workflows/build.yml/badge.svg)](https://github.com/Shazwazza/Articulate/actions/workflows/build.yml)

![Articulate](https://raw.githubusercontent.com/Shazwazza/Articulate/develop/assets/Logo.png?raw=true)

> A wonderful Blog engine built on Umbraco

---
_❤️ If you use and like Articulate please consider [becoming a GitHub Sponsor](https://github.com/sponsors/Shazwazza/) ❤️_

## Features

Supporting all the features you'd want in a blogging platform
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

## Supported versions

- Umbraco 15.4.4+, 16, 17 (Articulate 6 on .NET 9/10).
- Umbraco 13 LTS (maintenance) uses Articulate 5.x.

## Install

- NuGet: `dotnet add package Articulate`
- After install, sign into the Umbraco backoffice to run migrations and seed demo content.

## Learn more

- Full README and dev guide: `README.md`
- Issues & discussions: <https://github.com/Shazwazza/Articulate/issues>

Development/build details (mise, pnpm, client assets) are documented in `README.md` (see “Getting started” for pwsh and bash examples). The marketplace package already includes the backoffice assets—no extra build steps are required for consumers.
