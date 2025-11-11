# Demo Website - Scoped Guide

Scope: applies to `src/Articulate.Tests.Website/**`.

## Run

- Umbraco 15/16 (net9.0): `dotnet run -f net9.0 --project src/Articulate.Tests.Website/Articulate.Tests.Website.csproj`
- Umbraco 17 (net10.0): `dotnet run -f net10.0 --project src/Articulate.Tests.Website/Articulate.Tests.Website.csproj`

## Purpose

- Smoke-test routing, views, property editors, and management endpoints.
- Use for quick manual validation after changes to core/Web/API or client assets.

## Validation Checklist

- Site boots and renders blog routes.
- Backoffice features load when relevant.

