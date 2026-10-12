# Build

Articulate 8.x targets Umbraco 18. The repository uses the .NET 10 SDK, Node 24.x, pnpm 11.19.0 and the `nbgv` CLI.

## Build

```text
dotnet run --file build/build.cs -- build --client true --tests --sample --clean
node build/smoke-package.mjs build/Release
```

The Articulate and sample packages are written to `build/Release`. Use `build --clean` to remove local build outputs. The sample package is used by native and Docker test hosts; it is not a release package.

## Native HTTP E2E

Install Client dependencies with the frozen lock file, then run the 11-test suite against a fresh packaged host:

```text
pnpm --dir src/Articulate.Web/Client install --frozen-lockfile
dotnet run --file build/build.cs -- build --client true --sample --clean
dotnet run --file build/test.cs -- fresh
```

`fresh` inspects and restores the exact package archives outside the checkout, runs the existing test-site project as a native .NET process, and prepares content before Playwright. It needs no Docker or browser binaries. The runner owns a temporary database, HTTPS certificate, credentials and loopback port; it stops its process and removes the temporary host on success or failure. Host logs remain under `.temp/art_e2e_native_v18_<id>/`. Reports and test artifacts remain in `src/Articulate.Web/Client/e2e-report-*` and `e2e-results-*`.

`dotnet run --file build/test.cs -- e2e` tests a manually started test site at `https://localhost:19444`; it does not start or build a site. `dotnet run --file build/test.cs -- report` serves the newest v18 report on a loopback port. Do not run tests against the normal local site.

## CI jobs and E2E

CI builds, unit-tests and inspects the v18 packages on every workflow run. Fresh-site E2E is opt-in for routine runs: select the workflow-dispatch input, add the `e2e` pull-request label, or set the repository variable `E2E=true`. Release branches, pull requests targeting release branches and `v*` tags always run E2E. Package publication waits for any selected E2E run to pass; failed or cancelled E2E blocks publication. Native host logs and Playwright reports are retained for one day.

## Client

```text
pnpm --dir src/Articulate.Web/Client/v18 run check
pnpm --dir src/Articulate.Web/Client/v18 run build
pnpm --dir src/Articulate.Web/Client/v18 run lint
```

The checked-in API client is generated from the v18 Swagger document. Start the test website, then run:

```text
pnpm --dir src/Articulate.Web/Client/v18 run generate:api
```

Review generated routes and wire formats before replacing `common/src/api`.

## Lock files

The packable projects use `packages.lock.json`. Restore updates are local only:

```text
dotnet restore ./src/Articulate.sln -p:RestoreLockedMode=false --force-evaluate
```

## Local site

```text
dotnet run --file build/build.cs -- site --reset
```

Set `UseTinyMceUmbraco` in `Directory.Build.props.user` when the test website needs TinyMCE. Docker remains an optional local deployment check; it is not required for unit tests or HTTP E2E.
