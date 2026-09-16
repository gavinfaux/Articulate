# Docker development

The Docker runner provides a local Umbraco 18 site. It uses HTTPS on port `18443` and HTTP on port `8080`.

```text
dotnet run --file docker/run.cs -- docker-build
dotnet run --file docker/run.cs -- docker-dev --reset
dotnet run --file docker/run.cs -- docker-status
```

Use `--skip-smoke` to skip the authenticated smoke checks. Browsers must accept Caddy's development certificate. Use `docker-ca` to install that certificate locally.
