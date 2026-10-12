# Docker development

The Docker runner provides an optional local Umbraco 17 site. It uses HTTPS on port `18443` and HTTP on port `8080`.

```text
dotnet run --file docker/run.cs -- docker-build
dotnet run --file docker/run.cs -- docker-dev --reset
dotnet run --file docker/run.cs -- docker-status
```

Use `--skip-smoke` to skip authenticated content preparation. Browsers must accept Caddy's development certificate. Use `docker-ca` only if you want to trust that certificate locally.

`docker/run.cs` evaluates the Umbraco and ImageSharp versions from the repository's package properties and passes them to Compose and the Docker build. The standalone test host pins ImageSharp 3.2.0 and ImageSharp.Web 3.3.0 and excludes package build assets. The five narrow NuGet audit suppressions are passed into its isolated restore. No package floors or client versions are overridden by Docker settings.

## Native packaged-host E2E

CI runs the shared 11-test HTTP suite on an isolated native host with `dotnet run --file build/test.cs -- fresh`. This does not start Docker. The runner inspects the Release packages, restores the exact archives into a temporary site, checks package hashes and confirms the packaged host resolves the pinned ImageSharp versions and only the five approved audit suppressions.

Use the [E2E guide](../src/Articulate.Web/Client/e2e/README.md) for local commands, fixture cleanup, report paths and coverage. Docker remains available for manual container and Caddy checks.
