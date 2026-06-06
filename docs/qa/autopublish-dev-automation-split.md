# Autopublish / Dev Automation Split QA

Repo-local QA notes for the migration-only boundary.

## Verification

- Command: `dotnet test src\Articulate.Tests\Articulate.Tests.csproj --no-restore`
- Result: passed
- .NET 9 target: 126 tests passed
- .NET 10 target: 128 tests passed

## Runtime audit

- Fresh dev cold start with `UMBRACO_RUNTIME_MODE=BackofficeDevelopment` reached healthy in `00:00:05.4456236`.
- Package migrations completed in `826ms` on the same cold start.
- `build/docker-site/smoke.mjs publish` published the root with descendants after publishing its children with descendants and completed in `00:00:07.1747777` from token request to `Root is live`.
- Production-style restart with `UMBRACO_RUNTIME_MODE=Production` came back healthy and served `https://localhost:18443/` as `200` without automation bootstrap.
- Fresh empty-DB Docker boot imported `Articulate` before `Simple`, then published `Articulate` roots and sample content during the real package import path.
- Startup logs showed `Package migration completed for Articulate`, then `Starting package migration for Simple`, then `Published root node ID 1069 for content type 'Articulate' after package import.`

## Notes

- The package no longer relies on the old migration-executed publish handler.
- The `AutoPublishOnStartup` option is back as the tiny package-side opt-in gate.
- The new auto-publish handler only runs when the embedded `package.zip` contains publishable content.
- The publish-validation handler remains in place for explicit publish-time validation.
- Dev automation still runs through automation bootstrap plus `build/docker-site/smoke.mjs publish` when you want a manual publish/verify loop, but the package-side opt-in path is now proven in the real package import logs.
- `Articulate.Theme.Sample` is the concrete opt-in package example.
- Test output included existing NuGet vulnerability warnings for `OpenMcdf` and `Umbraco.Cms`; those were not introduced by this change.
