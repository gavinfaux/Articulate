# Articulate Development

## Requirements

- .NET 10.0 SDK
- Node.js 24+ with `corepack enable pnpm` (the workspace pins pnpm 11.9.0)
- Optional: Nerdbank.GitVersioning CLI (`dotnet tool install -g nbgv`), only needed for release builds
- IDE: Visual Studio 2026, JetBrains Rider, or Visual Studio Code
- Shell: PowerShell 7+ preferred (`pwsh`), PowerShell 5+, or Bash (WSL/Linux)

Use `build/build.cs` for repo-owned build, site, and Docker tasks. `build/help.md`
and [BUILD.md](BUILD.md) are the command and CI references.

## First run

1. Clone or fork the repository.

   **Windows devs**: this repo uses LF-only line endings (enforced by
   `.gitattributes`). NuGet and dotnet tools default to CRLF on Windows, which
   produces spurious diffs after every `dotnet restore`. Run once after
   cloning to normalise on commit and keep the index clean:

   ```bash
   git config core.autocrlf input
   ```

2. Build the solution and Back Office client:

   ```bash
   dotnet run --file build/build.cs -- build --configuration Debug --client true
   ```

   This restores, builds (including the Back Office client and theme/Markdown
   editor dist bundles), and produces NuGet packages.

   ### Local-only overrides

   Both `.actrc` (local `act` settings) and `Directory.Build.props.user` (local
   MSBuild property overrides) are gitignored. Examples:

   ```text
   # .actrc
   --env ACT=true
   ```

   ```xml
   <!-- Directory.Build.props.user -->
   <Project>
     <PropertyGroup>
       <ArticulatePackageLane>v18</ArticulatePackageLane>
       <EnableClientBuild>false</EnableClientBuild>
     </PropertyGroup>
   </Project>
   ```

   `Directory.Build.props.user` is imported automatically by MSBuild when present
   and is useful for persisting a default lane or disabling client builds for
   faster local iteration.
3. Start the test website:

   ```powershell
   dotnet run --file build/build.cs -- site --lane v17
   ```

   Or open `src/Articulate.sln`, set `Articulate.Tests.Website` as the startup
   project, and start it. The default lane is Umbraco 17; pass
   `-p:ArticulatePackageLane=v18` to run Umbraco 18.
4. Complete the Umbraco installer, then the Articulate package migrations will
   install the required schema and content items.

For the full build command, parameter, lane, lock file, and smoke test
reference, see [BUILD.md](BUILD.md).

### Switching Umbraco lanes locally

The local dev database is lane-specific: Umbraco does not down-grade schema
across major versions. If you started the test website with
`ArticulatePackageLane=v18` and then switch to `v17` (e.g. via
`Directory.Build.props.user` or the IDE's launch profile), point v17 at a
**fresh** database and let it migrate. Do not reuse the v18 DB or schema
checks will fail. Back up any local content first.

## Client development

The Back Office client is a pnpm workspace at `src/Articulate.Web/Client` with
shared implementation under `common/` and lane packages under `v17/` and `v18/`.

Install once:

```bash
cd src/Articulate.Web/Client
pnpm install
```

Work in the required lane:

```bash
cd v17   # or v18
pnpm run check     # tsc --noEmit
pnpm run build     # tsc && vite build
pnpm run lint
```

`pnpm run build` also regenerates the built-in theme `assets/dist` bundles and
the Markdown editor assets, not just the Back Office client.

`pnpm run generate:api` regenerates that lane's typed client (`../common/src/api/<lane>/`)
from a running Umbraco site. The v17 script reads Swagger JSON; the v18 script
reads the native OpenAPI JSON.
The shared generator runs from `Client/scripts`, so its runtime dependencies
belong in the `Client` workspace package.

The client floor must match the Umbraco floor for the lane. The current floors
are `^17.5.3` for v17 and `^18.0.2` for v18. Update the matching lane
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

```powershell
dotnet run --file build/build.cs -- site --lane v17
```

Use `--reset` to delete the local `umbraco` data folder before starting.

Run Docker commands through `dotnet run --file build/build.cs -- help`.
For Docker runtime details such as ports, credentials, runtime modes, smoke
expectations, and the Umbraco MCP integration, see
[`build/docker-site/README.md`](build/docker-site/README.md).

## Back Office client builds

`EnableClientBuild` defaults to `false` so Visual Studio background builds do
not clash with Vite output. When you need to rebuild the client during packaging
or local validation, pass `--client true` (or set `ENABLE_CLIENT_BUILD=true`
inline). A bare `--client` flag falls back to the env/default.

```powershell
dotnet run --file build/build.cs -- build --client true
```

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

### Property editors

The Markdown editor and other Articulate property editors live in
`src/Articulate.Web/PropertyEditors/`. To override behavior, subclass the
existing editor and re-register through your own composer.

### Importers

`src/Articulate/ImportExport/BlogMlImporter.cs` is the reference
implementation for BlogML import. The BlogML safety rules around image
allowlisting and SSRF apply to any custom importer you add — keep the
`AllowedMediaHosts` and `MaxImportImageBytes` configuration knobs in mind.

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
