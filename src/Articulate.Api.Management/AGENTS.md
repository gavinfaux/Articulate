# Articulate.Api.Management (Server) - Scoped Guide

Scope: applies to `src/Articulate.Api.Management/**` excluding `Client/`.

## Build

- Build both TFMs: `dotnet build src/Articulate.Api.Management/Articulate.Api.Management.csproj -f net9.0 -c Release` and `-f net10.0`.

## API Surface

- Attributes under `Attributes/*` define route metadata; keep routes stable.
- Swagger/OpenAPI setup under `Options/` and `Swagger/`; verify operation IDs if renaming.
- Property editors and value converters must remain backward compatible for existing data types.

## Client Assets Integration

- Backoffice client lives in `Client/`. Build via `pnpm run build` (see `Client/AGENTS.md`).
- Build outputs land in `wwwroot/App_Plugins/Articulate/BackOffice/` and are consumed by `Articulate.StaticAssets` during packaging.
- **Note**: The client build is orchestrated by `Articulate.StaticAssets` via MSBuild targets (not by this project). See `src/Articulate.StaticAssets/AGENTS.md` for details on the automatic client build process.

## Validation Checklist

- Builds green on both TFMs.
- Demo site can hit management endpoints when run against matching Umbraco version.
