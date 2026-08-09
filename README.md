# Articulate

[![Articulate Build](https://github.com/Shazwazza/Articulate/actions/workflows/build.yml/badge.svg)](https://github.com/Shazwazza/Articulate/actions/workflows/build.yml)

![Articulate](https://raw.githubusercontent.com/Shazwazza/Articulate/develop/assets/Logo.png?raw=true)

> A wonderful Blog engine built on Umbraco

---
_❤️ If you use and like Articulate please consider [becoming a GitHub Sponsor](https://github.com/sponsors/Shazwazza/) ❤️_

## Installation

Install the package version that matches your Umbraco installation. See the
[Installation guide](https://github.com/Shazwazza/Articulate/wiki/Installation)
for the compatibility matrix and version-specific commands.

## Features

Supporting all the features you'd want in a blogging platform:

- Categories & Tags
- Themes
- Multiple archives
- Live Writer support
- Markdown support
- Post from your mobile phone including photos direct from your camera
- Disqus and Giscus comment support (or build your own)
- Search
- BlogML import/export (including Disqus import)
- Customizable RSS feeds
- Customizable URLs
- Author profiles

## Upgrading

Back up your site, database, and media before upgrading.

On Umbraco 17 or 18, install [TinyMCE.Umbraco](https://github.com/ProWorksCorporation/TinyMCE-Umbraco) before first run to keep TinyMCE as your rich-text editor. Articulate migrates `Umbraco.RichText` to TipTap on first boot; the TinyMCE package must be present before that step.

See [Installation](https://github.com/Shazwazza/Articulate/wiki/Installation) and [Upgrading Articulate](https://github.com/Shazwazza/Articulate/wiki/Upgrading) for version selection, editor migration, BlogML guidance, and post-upgrade checks.

## Themes

Articulate includes ready-to-use themes and supports custom themes. You can
copy an existing theme as a starting point or install a theme supplied by
another package.

For copied themes, views belong under `Views/ArticulateThemes/{Theme}/Views/`
and assets under `wwwroot/App_Plugins/Articulate/Themes/{Theme}/assets/`.

See the [Themes wiki](https://github.com/Shazwazza/Articulate/wiki/Themes) for
the full theme layout, RCL theme packages, and Disqus configuration.

## Configuration

Articulate settings live in `appsettings.json` under the `Articulate` section.
See the [Configuration](https://github.com/Shazwazza/Articulate/wiki/Configuration)
and [Settings Reference](https://github.com/Shazwazza/Articulate/wiki/Settings-Reference)
wiki pages for the exact appsettings reference.

## Getting help

- [Documentation](https://github.com/Shazwazza/Articulate/wiki)
- [Settings reference](https://github.com/Shazwazza/Articulate/wiki/Settings-Reference)
- [Markdown editor authentication](https://github.com/Shazwazza/Articulate/wiki/Markdown-Editor-Authentication)
- [Releases](https://github.com/Shazwazza/Articulate/releases)
- [Report a bug](https://github.com/Shazwazza/Articulate/issues)
- [Community discussions](https://forum.umbraco.com/tag/packages)

Please use GitHub Issues for reproducible bugs and the Umbraco forum for usage
questions and general discussion.

## Contributing

Repository setup, builds, tests, and Docker workflows are documented in
[DEVELOP.md](DEVELOP.md).

## Copyright and license

&copy; 2026 Shannon Deminick

Articulate is free software licensed under the
[MIT License](https://opensource.org/licenses/MIT).
