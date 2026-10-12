# Articulate E2E tests

Run from the repository root with .NET 10, Node 24 and the Client dependencies installed:

```text
dotnet run --file build/test.cs -- fresh
dotnet run --file build/test.cs -- e2e
dotnet run --file build/test.cs -- report
dotnet run --file build/test.cs -- help
```

`fresh` inspects the Release packages in `build/Release`, copies the packaged-site host to a unique temporary directory, restores the exact archives, verifies the restored package hashes and starts the host directly with .NET. It uses a temporary database, a self-signed localhost certificate, a random secret and an available HTTPS port. It needs no Docker or browser installation.

The runner publishes starter content, confirms it, restarts the host in Production, then verifies that a temporary post appears in `ExternalIndex` and is removed before the shared 11-test Playwright suite runs. The suite has no retries. The runner stops only its own host and removes its temporary directory on success or failure. Host logs remain under `.temp/art_e2e_native_v17_<id>/`; reports and test artefacts remain under `src/Articulate.Web/Client/e2e-report-*` and `e2e-results-*`.

`e2e` tests the dedicated manual site at `https://localhost:19443`. It does not build packages or start a site. Do not use the normal development site. `report` opens the manual-site report, or the newest fresh-run report if no manual report exists. Stop the report server with Ctrl+C.

`NODE_BIN` and `DOTNET_BIN` can select existing executables without changing PATH. See [CI jobs and E2E](../BUILD.md#ci-jobs-and-e2e) and the [E2E guide](../src/Articulate.Web/Client/e2e/README.md) for setup and workflow selection.
