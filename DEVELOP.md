# Articulate Development

## Requirements

- .NET 10.0 SDK
- Node.js 24+ with `corepack enable pnpm` (the workspace pins pnpm 11.19)
- Nerdbank.GitVersioning CLI (`dotnet tool install -g nbgv`) for default package-version resolution; CI supplies the version explicitly
- IDE: Visual Studio 2026, JetBrains Rider, or Visual Studio Code
- Shell: PowerShell 7+ preferred (`pwsh`), PowerShell 5+, or Bash (WSL/Linux)

Use `build/build.cs` for repo-owned build, client, and test-site tasks.
`build/help.md` and [BUILD.md](BUILD.md) are the command and CI references.

## First run

1. Clone or fork the repository.

   **Windows devs**: this repo uses LF-only line endings (enforced by
   `.gitattributes`). NuGet and dotnet tools default to CRLF on Windows, which
   produces spurious diffs after every `dotnet restore`. Run once after
   cloning to normalise on commit and keep the index clean:

   ```text
   git config core.autocrlf input
   ```

   To verify SSH-signed commits locally, create an allowed-signers file at
   `~/.config/git/articulate-allowed-signers` and set the repository-local
   trust path. The `~` form works across Windows, macOS, and Linux:

   ```text
   git config --local gpg.ssh.allowedSignersFile "~/.config/git/articulate-allowed-signers"
   ```

   Keep this file outside the repository; it contains trusted public keys for
   local verification only.

2. Build the solution and Back Office client:

   ```text
   dotnet run --file build/build.cs -- build --configuration Debug --client true
   ```

   This restores, builds (including the Back Office client and theme/Markdown
   editor dist bundles), and produces NuGet packages.

   ### Local-only overrides

   For local CI workflow validation with `act`, see [Run CI locally with
   act](BUILD.md#run-ci-locally-with-act). `Directory.Build.props.user` remains
   a gitignored file for machine-specific MSBuild property overrides:

   ```xml
   <!-- Directory.Build.props.user -->
   <Project>
     <PropertyGroup>
       <ArticulatePackageLane>v17</ArticulatePackageLane>
       <EnableClientBuild>false</EnableClientBuild>
     </PropertyGroup>
   </Project>
   ```

   `Directory.Build.props.user` is imported automatically by direct MSBuild and
   IDE builds. The repository runners own their CLI defaults; use `--lane`,
   `--client`, or the documented environment variables when invoking
   `build/build.cs`.
3. Start the test website:

   ```text
   dotnet run --file build/build.cs -- site --lane v17
   ```

   Or open `src/Articulate.sln`, set `Articulate.Tests.Website` as the startup
   project, and start it. The default lane is Umbraco 17. For Visual Studio,
   set `<ArticulatePackageLane>v18</ArticulatePackageLane>` in the gitignored
   `Directory.Build.props.user` file. For direct CLI builds, pass
   `-p:ArticulatePackageLane=v18`.
4. Complete the Umbraco installer, then the Articulate package migrations will
   install the required schema and content items.

For the full build command, parameter, lane, lock file, and smoke test
reference, see [BUILD.md](BUILD.md).

For lane switching, including database, client-output, and `--clean` guidance,
see [BUILD.md](BUILD.md#switching-lanes).

## Client development

The Back Office client is a pnpm workspace at `src/Articulate.Web/Client` with
shared implementation under `common/` and lane packages under `v17/` and `v18/`.

Install once:

```text
cd src/Articulate.Web/Client
pnpm install
```

Work in the required lane:

```text
cd v17   # or v18
pnpm run check     # tsc --noEmit
pnpm run build     # tsc && vite build
pnpm run lint
```

`pnpm run build` also regenerates the built-in theme `assets/dist` bundles, Markdown editor assets, and committed vendor assets.

`pnpm run generate:api` regenerates that lane's typed client (`../common/src/api/<lane>/`)
from a running Umbraco site. The v17 script reads Swagger JSON; the v18 script
reads the native OpenAPI JSON.
The shared generator runs from `Client/scripts`, so its runtime dependencies
belong in the `Client` workspace package.

The client floor must match the Umbraco floor for the lane. The current floors
are `^17.6.0` for v17 and `^18.1.0` for v18. Update the matching lane
`package.json`, then run `pnpm install` from `Client`. Commit the lockfile
change with the package change.

An Umbraco package update does not require API regeneration. Regenerate both
lane clients after an Articulate endpoint contract change. Do not edit files
under `common/src/api/<lane>/` by hand.

Per-lane divergence lives in three places. A small dispatcher at
`common/src/lane-adapter.ts` reads a build-time `LANE` constant declared in
each lane's `ambient.d.ts` and returns the per-lane event class. The
generated API at `common/src/api/<lane>/` is selected by the `@api` alias
in each lane's `vite.config.ts`. The lane-root config files
(`tsconfig.json`, `vite.config.ts`, `package.json`, `eslint.config.mjs`,
`ambient.d.ts`) hold the rest of the per-lane differences. Add new per-lane
code through one of those paths, not by creating files under `v17/src/` or
`v18/src/`.
Management API security adds the standard `401` and `403` responses; do not
repeat them with `ProducesResponseType`, because duplicate response keys stop
OpenAPI generation. Declare only endpoint-specific responses.

## Test website

Start the test site directly from the build script:

```text
dotnet run --file build/build.cs -- site --lane v17
```

Use `--reset` to delete the local `umbraco` data folder before starting.

### Public tunnel for theme/Giscus review

When a public URL is needed to review theme or Giscus widget styling, expose
the default HTTPS test site with Cloudflare Tunnel:

```text
cloudflared tunnel --url https://localhost:44317 --no-tls-verify
```

Open the generated public URL for the review. The `--no-tls-verify` option is
needed because the local test site uses a development certificate.

To check the per-theme Giscus stylesheet endpoint through the public site, run:

```powershell
$css = Invoke-WebRequest `
    -Uri 'https://<cloudflared-public-url>/articulate/giscus-theme/VAPOR' `
    -Headers @{ Origin = 'https://giscus.app' }
$css.Content | Select-String 'Articulate "VAPOR" theme'
```

Run Docker commands through `dotnet run --file docker/run.cs -- help`.
For Docker runtime details such as ports, credentials, runtime modes, smoke
expectations, and the Umbraco MCP integration, see
[`docker/README.md`](docker/README.md).

## Back Office client builds

`EnableClientBuild` is `false` for Visual Studio background builds and Debug
builds. This avoids conflicts with the shared Back Office output directory.
Release and CI builds enable it.

For lane switching and full validation, see [BUILD.md](BUILD.md#switching-lanes).

The lane packages keep only their Umbraco dependency, generated `src/api/**`,
and small lane adapters. Shared source and client tooling live in
`src/Articulate.Web/Client/common/`. Run `pnpm run check`, `pnpm run build`, or
`pnpm run lint` from `Client/v17` or `Client/v18`; `pnpm run generate:api` uses
the matching lane endpoint and writes only to that lane's generated API folder.
The Articulate Markdown property editor wraps Umbraco's native
`umb-input-markdown`; do not copy the native editor into either lane.

For client extensions:

- Keep ordinary forms inside `<uui-form>`.
- Use `<umb-form-validation-message>` for native validation messages.
- Wrap generated Articulate API calls with `tryExecute()`.
- Pass `throwOnError: true` to generated calls.
- Render inline errors with `UmbApiError.problemDetails`.
- Disable automatic notifications when the form shows the error.
- Use `DocumentService` and `DocumentTypeService` from
  `@umbraco-cms/backoffice/external/backend-api` for Umbraco lookups.
- Use the native notification context for success messages.
- Keep generated API output in each lane's `src/api/**` folder. Put shared
  implementation in `common/`.

## Schema and data

If you need to make changes to the underlying Umbraco schema (doc types, data
types, etc...) or the installed package's content/media, then you will need
to re-create the Articulate package in the back office with all required
dependencies and then re-save the `package.zip` file and commit it to the
repository.

## Extending Articulate

Articulate ships as a NuGet package with extension points for theme authors,
controllers, API endpoints, importers, and the MetaWeblog provider. The
extension surfaces live across two projects:

```text
src/Articulate.Web/                  # The packable web project (controllers, views, backoffice TS workspace)
├── Client/                          # Backoffice TS workspace (common/ + v17/ + v18/)
├── Controllers/                     # MVC and API controllers
├── Models/                          # View models for themes
├── PropertyEditors/                 # Markdown editor and custom property editors
└── umbraco-package.json             # Backoffice manifest

src/Articulate/                      # The core library (shared services and migrations)
├── ImportExport/                    # BlogML import/export
├── MetaWeblog/                      # MetaWeblog provider for Live Writer
├── Components/                      # Umbraco composer registrations
├── Migrations/                      # Schema and data-type migrations
└── Models/                          # Domain models used by the core library
```

### Themes

For most sites, start with a built-in theme and copy it. See the
[Themes](https://github.com/Shazwazza/Articulate/wiki/Themes) and
[Creating a theme](https://github.com/Shazwazza/Articulate/wiki/Creating-a-theme)
wiki pages for the full authoring guide — folder layout, descriptor
registration, helper APIs, and the Razor model. Built-in copies retain source,
vendor, and generated theme assets; the Sample theme remains a separate RCL.
To add a new comment provider,
update the provider switch in `CommentsDisqus.cshtml` and document its
configuration in the
[Comments](https://github.com/Shazwazza/Articulate/wiki/Comments) wiki page.

### Custom controllers and API endpoints

- **Render controllers** in `src/Articulate.Web/Controllers/` extend
  `RenderController` for custom routes that resolve Umbraco content.
- **API controllers** in `src/Articulate.Web/Controllers/Api/` follow Umbraco's
  Management API conventions and surface in Swagger / OpenAPI.
- **MetaWeblog provider** lives in `src/Articulate/MetaWeblog/` for Live
  Writer and compatible desktop clients.

### Custom RSS feeds

The `customRssFeedUrl` blog property only changes the URL advertised by the
theme. To replace the generated feed, implement `IRssFeedGenerator` and
register it through an Umbraco composer:

```csharp
public class MyComposer : IComposer
{
    public void Compose(IUmbracoBuilder builder) =>
        builder.Services.AddSingleton<IRssFeedGenerator, MyRssFeedGenerator>();
}
```

`GetFeed(IMasterModel rootPageModel, IEnumerable<PostModel> posts)` returns the
feed content. The built-in controller still selects the posts and routes the
feed.

### Property editors

The Markdown editor and other Articulate property editors live in
`src/Articulate.Web/PropertyEditors/`. To override behavior, subclass the
existing editor and re-register through your own composer.

### Importers

`src/Articulate/ImportExport/BlogMlImporter.cs` is the reference
implementation for BlogML import. Any custom importer must apply the same
image allowlisting and SSRF protections. Use `AllowedMediaHosts` and
`MaxImportImageBytes` for those limits.

### Rich text compatibility

For the fuller rich-text upgrade and compatibility notes, see the wiki. The
code keeps `Umbraco.RichText` as the stable schema, and the `EditorUiAlias`
migration only runs when TinyMCE is not available. When `TinyMCE.Umbraco` is
installed for a lane, Articulate leaves that editor path alone on first boot.

### Backoffice extensions

`umbraco-package.json` is the backoffice manifest. To extend the backoffice,
follow [Umbraco's extension registry docs](https://docs.umbraco.com/umbraco-cms/extending/extension-registry)
and add shared implementation under `Client/common/`, with lane-specific
adapters only where the Umbraco APIs differ.
