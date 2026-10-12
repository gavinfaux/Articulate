# Articulate HTTP E2E tests

Run from the repository root with .NET 10, Node 24 and the Client dependencies installed (see `src/Articulate.Web/Client/e2e/README.md`):

```text
dotnet run --file build/test.cs -- fresh
dotnet run --file build/test.cs -- e2e
dotnet run --file build/test.cs -- report
dotnet run --file build/test.cs -- help
```

`fresh` tests the built Articulate 8 package in an isolated native host. Build the Release package and sample theme first. The runner inspects the package archives, restores a copy of the existing packaged-site project outside the checkout, verifies the restored package hashes, and starts it directly with .NET. The host uses a temporary database, self-signed certificate, random credentials and free loopback HTTPS port. It does not use Docker or install browser binaries.

Preparation publishes and confirms starter content, restarts the host in Production, then verifies that a temporary post appears in `ExternalIndex` and is removed before testing. The shared 11-test suite runs with no retries. The runner stops its own process and deletes its own temporary directory on success or failure. Host logs remain under `.temp/art_e2e_native_v18_<id>/`; Playwright reports and test artefacts use the same candidate name under `src/Articulate.Web/Client/e2e-report-*` and `e2e-results-*`. Failure logs remain available if host startup or E2E fails.

`e2e` tests a manually started v18 site at `https://localhost:19444`; it does not build packages or start a site. Do not use the normal `art_v18` site. Reports are in `src/Articulate.Web/Client/e2e-report-v18`; `report` opens the latest fresh or manual-site report on an available loopback port. Playwright prints the URL. Stop the report server with Ctrl+C.

`NODE_BIN` and `DOTNET_BIN` can select existing executables without changing PATH. CI runs the same native fresh-host suite only when selected by the `e2e` PR label, repository variable, workflow-dispatch input or release ref; package uploads wait for selected E2E jobs to pass. See [CI jobs and E2E](../BUILD.md#ci-jobs-and-e2e).
