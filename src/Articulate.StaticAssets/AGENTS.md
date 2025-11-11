# Static Assets - Scoped Guide

Scope: applies to `src/Articulate.StaticAssets/**`.

## Purpose

- Hosts packaged static assets consumed by the solution.
- Do not hand-edit build outputs; regenerate via client builds where applicable.

## Build

- Build both TFMs: `dotnet build src/Articulate.StaticAssets/Articulate.StaticAssets.csproj -f net9.0 -c Release` and `-f net10.0`.

## Validation Checklist

- Assemblies/package contents align with generated client assets.

