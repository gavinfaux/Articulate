# Articulate.Web (RCL + Themes) - Scoped Guide

Scope: applies to `src/Articulate.Web/**`.

## Build

- Build both TFMs: `dotnet build src/Articulate.Web/Articulate.Web.csproj -f net9.0 -c Release` and `-f net10.0`.

## Themes & Assets

- Themes live under `wwwroot/App_Plugins/Articulate/Themes/*`.
- Theme sources: `Themes/*/src/**` -> bundles: `Themes/*/dist/**`.
- Markdown editor sources: `MarkdownEditor/src/**` -> bundle: `MarkdownEditor/dist/**`.
- Build assets via client: from `src/Articulate.Api.Management/Client`, run `pnpm install && pnpm run build`.
- Razor uses env tag helpers with `asp-append-version`; ensure `dist/` exists for Release/pack.

## Markdown Editor SPA

- A legacy redirect for `/a-new/` lives in `src/Articulate/Controllers/MarkdownEditorController.cs`.
- If restoring the SPA controller here, remove that shim and wire routes in this project.

## Validation Checklist

- RCL builds on both TFMs.
- Any theme changes produce fresh `dist/` assets.
