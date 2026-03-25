# Articulate

[![Articulate Build](https://github.com/Shazwazza/Articulate/actions/workflows/build.yml/badge.svg)](https://github.com/Shazwazza/Articulate/actions/workflows/build.yml)

![Articulate](https://raw.githubusercontent.com/Shazwazza/Articulate/develop/assets/Logo.png?raw=true)

> A wonderful Blog engine built on Umbraco

---
_❤️ If you use and like Articulate please consider [becoming a GitHub Sponsor](https://github.com/sponsors/Shazwazza/) ❤️_

## Installation

Two support tracks are available depending on the Umbraco version you run.

### Umbraco 13 LTS (maintenance mode)

Articulate 5.x remains available for Umbraco 13, which is in security maintenance until **December 2025** and reaches end of life in **December 2026**. The package still installs from the Umbraco marketplace.

- After installing, open the Packages section (`umbraco/section/packages/view/installed`) and run any pending migrations.
- Save the `Articulate Image Picker` data type once to fix bundled demo media (issue [#460](https://github.com/Shazwazza/Articulate/issues/460)). This step is only required on Umbraco 13.
- For long-term projects consider upgrading to Umbraco 16+ where Articulate 6 receives active feature work.

_Need help?_ Head over to [Articulate on GitHub](https://github.com/Shazwazza/Articulate) for extra tips, known issues and fixes.

### Umbraco 16 (NET 9) & 17 (NET 10) (current track)

Articulate 6 targets Umbraco 16.5.1+ and 17.2.2+

- Install `Articulate` from NuGet (`dotnet add package Articulate`). The package includes the backoffice extension and static assets; no extra package references or manual copies required.
- When building from source, run the test site `dotnet run -f net9.0 --project src/Articulate.Tests.Website/Articulate.Tests.Website.csproj` (or `-f net10.0` for Umbraco 17) and sign into the Umbraco Back Office to finish setup.
- Migrating from 5.x: in place upgrade or export BlogML from your Articulate 5 site and import it into Articulate 6; media in `media/articulate` is not auto-migrated. During import you can map `postImage` to base64 or an attachment; other inline images must be moved manually (copy the folder, or consider an in-place package upgrade).

## Markdown Editor Authentication

The standalone Markdown editor uses Umbraco's built-in back-office OpenIddict endpoints with the authorization code flow and PKCE.

- `RedirectUris` are the allowed callback URLs after a successful sign-in.
- `PostLogoutRedirectUris` are the allowed final destinations after sign-out completes.
- The built-in sign-out endpoint is an endpoint the client calls. It is **not** itself a post-logout redirect URI.
- The editor requests a specific `post_logout_redirect_uri` during sign-out. Umbraco/OpenIddict will only honor it if it exists in `PostLogoutRedirectUris`.
- The editor keeps the access token in memory. Refreshing the page clears that token and requires the user to sign in again.

Minimal example:

```json
"Articulate": {
  "ManagementApi": {
    "OpenIddict": {
      "Client": {
        "Enabled": true,
        "ClientId": "umbraco-articulate",
        "DisplayName": "Articulate Markdown Editor",
        "RedirectUris": [
          "https://localhost:44366/a-new/"
        ],
        "PostLogoutRedirectUris": [
          "https://localhost:44366/"
        ]
      }
    }
  }
}
```

## BlogML External Image Import

Articulate treats external BlogML image import as an opt-in convenience feature for trusted hosts.

- If `Umbraco:CMS:Content:AllowedMediaHosts` is empty, external image downloads are disabled.
- BlogML posts still import normally; this only affects fetching the first external image attachment when `Import First Image from Post Attachments` is enabled.
- The backoffice importer preflights the selected BlogML file and shows:
  - the number of external image attachments
  - the unique external hosts referenced by the file
  - which of those hosts are currently blocked by `AllowedMediaHosts`
- Redirects are limited and revalidated on every hop. Redirect targets must still be allowlisted in `AllowedMediaHosts`, pass IP safety checks, and cannot downgrade from `https` to `http`.
- This supports common CDN-style redirects such as `images.example.com` redirecting to `cdn.example.com`, as long as both hosts are explicitly allowlisted.
- Downloads are validated against Umbraco upload rules and image file types, capped by size, and pinned to the validated IP address for the actual connection.

Production-oriented example:

```json
{
  "Articulate": {
    "MaxExternalImageBytes": 10485760,
    "AllowUnsafeLocalExternalImageHostsInDevelopment": false
  },
  "Umbraco": {
    "CMS": {
      "Runtime": {
        "Mode": "Production"
      },
      "Content": {
        "AllowedMediaHosts": [
          "images.example.com",
          "cdn.example.com"
        ]
      }
    }
  }
}
```

Local development example:

```json
{
  "Articulate": {
    "MaxExternalImageBytes": 10485760,
    "AllowUnsafeLocalExternalImageHostsInDevelopment": true
  },
  "Umbraco": {
    "CMS": {
      "Runtime": {
        "Mode": "BackofficeDevelopment"
      },
      "Content": {
        "AllowedMediaHosts": [
          "localhost"
        ]
      }
    }
  }
}
```

Notes:

- `AllowUnsafeLocalExternalImageHostsInDevelopment` is ignored when `Umbraco:CMS:Runtime:Mode` is `Production`.
- Only add hosts you control or strongly trust.
- `localhost`, loopback, and private-network targets remain blocked unless the development-only override is enabled.

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
- Extensible API + modern build tooling aligned with current .NET/Umbraco releases (DI-friendly codebase, multi-target net9/net10, pnpm/Vite client pipeline)

## Minimum requirements

- Articulate 5.x (maintenance): Umbraco 13 LTS (security support through Dec 2025, EOL Dec 2026)
- Articulate 6.x (current): Umbraco 16.5.1+ on .NET 9; Umbraco 17.2.2+ on .NET 10

## [Documentation](https://github.com/Shazwazza/Articulate/wiki)

Docs on installation, creating posts, customizing/creating themes, etc...

## [Issues](https://github.com/Shazwazza/Articulate/issues)

If you have any issues, please post them here on GitHub

## [Releases](https://github.com/Shazwazza/Articulate/releases)

See here for the list of releases and their release notes

## [Community Discussions](https://forum.umbraco.com/tag/packages)

- Please use the Umbraco forums to ask questions and discuss Articulate, it's features and functionality.
- Do not post issues here, post them to [Articulate/issues](https://github.com/Shazwazza/Articulate/issues) on GitHub

## Development

Local development and contributor setup lives in [DEVELOP.md](DEVELOP.md).

## Copyright & License

&copy; 2025 by Shannon Deminick

This is free software and is licensed under the [The MIT License (MIT)](http://opensource.org/licenses/MIT)
