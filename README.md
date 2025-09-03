[![Articulate Build](https://github.com/Shazwazza/Articulate/actions/workflows/build.yml/badge.svg)](https://github.com/Shazwazza/Articulate/actions/workflows/build.yml)

![Articulate](https://raw.githubusercontent.com/Shazwazza/Articulate/develop/assets/Logo.png?raw=true)

> A wonderful Blog engine built on Umbraco

---
_❤️ If you use and like Articulate please consider [becoming a GitHub Sponsor](https://github.com/sponsors/Shazwazza/) ❤️_

## Installation

### Post installtion checks

- In the backoffice head over to the Packages section `umbraco/section/packages/view/installed` and check if there are pending migrations to run.

- **Umbraco 13+** To resolve an issue with the _example_ media not displaying correctly on frontend, in the data types section `umbraco/section/settings/workspace/data-type-root/edit/` select the `Articulate Image Picker` data type and hit save. This issue does not effect other media added to Articulate. See [this issue](https://github.com/Shazwazza/Articulate/issues/460) for more information.

_Need help?_ Head over to [Articulate on GitHub](https://github.com/Shazwazza/Articulate) for extra tips, known issues and fixes.

## Features

Supporting all the features you'd want in a blogging platform

- Categories & Tags
- Themes
- Multiple archives
- Live Writer support
- Markdown support
- Post from your mobile phone including photos direct from you camera
- Disqus or Facebook comment support (or build your own)
- Search
- Blogml import/export (including Disqus import)
- Customizable RSS feeds
- Customizable urls
- Author profiles

## Minimum requirements

- Articulate version 5+ is only compatible with Umbraco 10.1.0+
- Articulate version 6+ is only compatible with Umbraco 15.2.3+ (15.4.2 recommended) and 16+

## [Documentation](https://github.com/Shazwazza/Articulate/wiki)

Docs on installation, creating posts, customising/creating themes, etc...

## [Issues](https://github.com/Shandem/Articulate/issues)

If you have any issues, please post them here on GitHub

## [Releases](https://github.com/Shazwazza/Articulate/releases)

See here for the list of releases and their release notes

## [Community Discussions](https://forum.umbraco.com/)

- Please use the Umbraco forums to ask questions and discuss Articulate, it's features and functionality.
- Do not post issues here, post them [here](https://github.com/Shazwazza/Articulate/issues) on GitHub

## Contributing

1. Clone/fork the repository
1. Open the /src/Articulate.sln file
1. Build the solution (will also performa Nuget restore)
1. Ensure that Articulate.Web is set as the startup project
1. Start the Articulate.Web project
1. This will run the Umbraco installer, install as per normal
1. The Articulate package migrations will also execute and install all of the Articulate schema and content items

Now you're all set! Any source changes you wish to make just do that in Visual Studio, build the solution when you need to and the changes will be reflected in the website.

### Changing Umbraco Articulate schema/data elements

If you need to make changes to the underlying Umbraco schema (doc types, data types, etc...) or the installed package's content/media, then you will need
to re-create the Articulate package in the back office with all required dependencies and then re-save the package.zip file and commit it to the repository.

## Copyright & Licence

&copy; 2025 by Shannon Deminick

This is free software and is licensed under the [The MIT License (MIT)](http://opensource.org/licenses/MIT)
