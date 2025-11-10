# Articulate (Core) – Scoped Guide

Scope: applies to `src/Articulate/**`.

## Build & Test

- Build both TFMs: `dotnet build src/Articulate/Articulate.csproj -f net9.0 -c Release` and `-f net10.0`.
- Run unit tests: `dotnet test src/Articulate.UnitTests/Articulate.UnitTests.csproj -f net9.0` (and `-f net10.0`).

## Coding & API

- Follow repo style: nullable enabled, StyleCop, `_camelCase` fields, `PascalCase` public members.
- Keep public API stable; prefer additive changes. If breaking, update docs and call out in PR.
- Respect multi-targeting package ranges noted in root `AGENTS.md`.

## Areas of Caution

- View location and routing: changes in `Components/ArticulateViewLocationExpander` and routing affect RCL resolution. Add tests near changes.
- Caching/refreshers: handlers under `Components/*RefresherHandler.cs` impact cache coherence; validate via demo site.

## Validation Checklist

- Builds green on net9.0 and net10.0.
- Unit tests pass across both TFMs.
- Demo site serves expected routes if you touched routing/content negotiation.
