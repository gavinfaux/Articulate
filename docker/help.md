# Docker utility

The Docker utility runs the Umbraco 18 test stack.

```text
dotnet run --file docker/run.cs -- docker-build [--clean] [--tag image:tag]
dotnet run --file docker/run.cs -- docker-dev [--clean] [--reset] [--skip-smoke] [--reuse-packages]
dotnet run --file docker/run.cs -- docker-prod [--skip-smoke]
dotnet run --file docker/run.cs -- docker-down [--volumes|--purge]
dotnet run --file docker/run.cs -- docker-status
dotnet run --file docker/run.cs -- docker-test [--keep] [--skip-smoke]
dotnet run --file docker/run.cs -- docker-ca
```
