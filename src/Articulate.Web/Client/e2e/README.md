# HTTP E2E tests

The shared Playwright suite checks the packaged v17 application through HTTP. It uses request fixtures, not a browser. The suite runs with one worker and no retries. Tests remove their own content and restore the root settings they change.

## Fresh native host

Build the Release packages, including the sample theme, then run from the repository root:

```sh
dotnet run --file build/test.cs -- fresh
```

The runner inspects the packages in `build/Release`, copies the packaged-site project to a unique temporary directory, restores the exact package archives, checks their hashes and starts the host directly with .NET. It uses a temporary database, a self-signed localhost certificate, a random secret and a free HTTPS port. It does not use Docker or install a browser.

Before the suite starts, the runner publishes and confirms starter content, restarts the host in Production, then publishes a temporary post. It waits for that post's exact key in `ExternalIndex`, deletes the post and verifies removal. It stops only its own host and removes its temporary directory on success or failure.

Host logs remain under `.temp/art_e2e_native_v17_<id>/`. Playwright reports and test artefacts remain under `src/Articulate.Web/Client/e2e-report-*` and `e2e-results-*`. These outputs are ignored by Git.

## Manual site

`e2e` tests an already-running dedicated site at `https://localhost:19443`. It does not build packages or start the site:

```sh
dotnet run --file build/test.cs -- e2e
```

Do not point it at the normal development site. The runner accepts only that manual URL or an internally verified fresh-host candidate.

## Reports

Open the manual-site report, or the newest fresh-host report when there is no manual report:

```sh
dotnet run --file build/test.cs -- report
```

Playwright prints the local report URL. Stop the report server with Ctrl+C. Set `NODE_BIN` or `DOTNET_BIN` to select existing executables without changing global defaults.

## Coverage

The 11-test suite covers:

- Giscus CSS response, cache policy, allowed and disallowed CORS origins, anonymous requests and missing themes.
- Publishing and unpublishing a post, RSS limits, tag/category listings and scoped feeds.
- Public search, pagination, URL routing, route refresh and publish-time route-collision veto.
- VAPOR search-result link extraction.
- Theme changes and restoration.

Tests exercise the packaged HTTP host. They do not mock the Umbraco APIs or require browser installation. The native runner's package restore checks ImageSharp 3.2.0, ImageSharp.Web 3.3.0 and exactly the five approved audit suppressions.

See [CI jobs and E2E](../../../../BUILD.md#ci-jobs-and-e2e) for workflow selection and artifact retention. See the [Docker guide](../../../../docker/README.md) for optional container checks; the native fresh runner does not require Docker.
