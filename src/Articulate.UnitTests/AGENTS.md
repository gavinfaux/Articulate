# Unit Tests - Scoped Guide

Scope: applies to `src/Articulate.UnitTests/**`.

## Run

- All TFMs: `dotnet test src/Articulate.UnitTests/Articulate.UnitTests.csproj`
- Single TFM: `dotnet test src/Articulate.UnitTests/Articulate.UnitTests.csproj -f net9.0` (or `-f net10.0`).

## Conventions

- xUnit naming: `MethodUnderTest_ShouldExpectedBehavior`.
- Keep tests deterministic and isolated. Prefer unit tests over integration.
- Add tests near modified logic (e.g., view location provider, routing, helpers).

## Validation Checklist

- Tests pass on both TFMs.
- New behavior covered by focused tests.
