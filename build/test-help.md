# Articulate E2E tests

Run from the repository root with .NET 10, Node on PATH and [Client dependencies installed](../src/Articulate.Web/Client/e2e/README.md#install-and-run):

```text
dotnet run --file build/test.cs -- e2e [--lane v17|v18|all]
dotnet run --file build/test.cs -- report --lane v17|v18
dotnet run --file build/test.cs -- help
```

`e2e` defaults to `all`. It runs v17 then v18 and stops on failure. Sites must already be running. The runner does not install dependencies, build packages or start sites.

| Lane | Test URL |
| --- | --- |
| v17 | `https://localhost:19443` |
| v18 | `https://localhost:19444` |

Reports are in `src/Articulate.Web/Client/e2e-report-<lane>`; test artefacts are in `e2e-results-<lane>`.

`report` opens an existing report on an available loopback port. Playwright prints the URL. Stop it with Ctrl+C.

See the [E2E guide](../src/Articulate.Web/Client/e2e/README.md) for site setup and cleanup. Do not use the normal `art_v17` or `art_v18` sites.
