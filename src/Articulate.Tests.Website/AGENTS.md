# Demo Website - Scoped Guide

Scope: applies to `src/Articulate.Tests.Website/**`.

## Run

- Umbraco 15/16 (net9.0): `dotnet run -f net9.0 --project src/Articulate.Tests.Website/Articulate.Tests.Website.csproj`
- Umbraco 17 (net10.0): `dotnet run -f net10.0 --project src/Articulate.Tests.Website/Articulate.Tests.Website.csproj`
- Optional runtime Razor hot-reload: set environment variable `Articulate__WatchRclViews=true` (debug builds only). Leave unset during installer passes to avoid front-end template compilation races.
- `dotnet watch --no-hotreload` only restarts the test site when its own files change; with `Articulate__WatchRclViews=true` it will pick up Razor view edits from the RCL on refresh, but BackOffice/theme/Markdown **assets** still need their pnpm/Vite watchers (see `src/Articulate.Api.Management/Client` and `Articulate.Web` readmes) to rebuild on change.

## Purpose

- Smoke-test routing, views, property editors, and management endpoints.
- Use for quick manual validation after changes to core/Web/API or client assets.
- Articulate package development: Razor views/themes and extensions, e.g. back office client, optional runtime Razor compilation (front end reload).

## Validation Checklist

- Site boots and renders blog routes.
- Backoffice features load when relevant.
