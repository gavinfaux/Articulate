# Articulate E2E tests

Run from the repository root with the selected .NET SDK, Node and [Client dependencies installed](../src/Articulate.Web/Client/e2e/README.md#install-and-run):

```text
dotnet run --file build/test.cs -- fresh [--lane v17|v18|all]
dotnet run --file build/test.cs -- fresh --lane v19 --nuget-source <local-cms-feed>
dotnet run --file build/test.cs -- e2e [--lane v17|v18|all]
dotnet run --file build/test.cs -- report --lane v17|v18|v19
dotnet run --file build/test.cs -- help
```

`fresh` defaults to `all` (v17 and v18 only). v19 is explicit and local-only: build its Release Articulate and Sample packages with `--lane v19 --sample`; `version-v19.txt` supplies 9.0.0-alpha1 with the current commit suffix (for example `9.0.0-alpha1.g<commit>`). The existing `ARTICULATE_PACKAGE_VERSION` override remains available. Use a .NET 11 SDK and a locally built CMS feed passed via `--nuget-source <local CMS feed>`. Do not commit that machine-specific feed path. It copies the existing packaged-site scaffold, overrides only its generated candidate TFM to net11.0, adds the supplied feed to that candidate's NuGet config, and restores into a candidate-owned package cache.

All lanes run the same package smoke check (net11.0 assemblies for v19). v19 readiness polls the owned published document GUID in the CMS `PublishedContent` index; v17/v18 retain their `ExternalIndex` readiness check. Preparation publishes and confirms starter content, restarts the host in Production, then verifies the temporary post is removed before tests. The shared 11-test suite runs with no retries. The runner stops its own process and deletes its own temporary directory on success or failure. Host logs remain under `.temp/art_e2e_native_<lane>_<id>/`; Playwright reports and test artefacts use the same candidate name under `src/Articulate.Web/Client/e2e-report-*` and `e2e-results-*`. Neither certificate trust stores nor existing sites are changed.

See [CI jobs and E2E](../BUILD.md#ci-jobs-and-e2e) for workflow selection and uploads.

Local `--lane all` runs are sequential and stop on failure. `NODE_BIN` and `DOTNET_BIN` can select existing executables without changing PATH.

`e2e` tests sites that are already running. It does not build packages or start sites. Only these dedicated manual-test URLs are allowed:

| Lane | Test URL |
| --- | --- |
| v17 | `https://localhost:19443` |
| v18 | `https://localhost:19444` |

Manual-site reports are in `src/Articulate.Web/Client/e2e-report-<lane>`; test artefacts are in `e2e-results-<lane>`. `report` opens the manual-site report (or, if absent, the newest fresh/candidate report for the lane) on an available loopback port. Playwright prints the URL. Stop it with Ctrl+C.

See the [E2E guide](../src/Articulate.Web/Client/e2e/README.md) for optional Docker deployment checks and manual-site setup. Do not use the normal `art_v17` or `art_v18` sites.
