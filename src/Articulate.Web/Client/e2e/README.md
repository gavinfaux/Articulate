# HTTP E2E tests

Playwright exercises the packaged application through HTTP. The suite uses one worker, no retries, and no browser installation. It restores fixture posts and root configuration in cleanup paths.

## Run on a fresh native host

Build the Release packages, including the sample theme, then run the isolated native host:

```text
dotnet run --file build/build.cs -- build --client true --sample --clean
dotnet run --file build/test.cs -- fresh
```

The runner inspects the exact package archives, restores the copied test-site project outside the checkout, and verifies restored package hashes. It prepares content, verifies `ExternalIndex`, deletes its temporary readiness post, and runs the shared 11-test suite against the packaged host in Production. It needs no Docker or browser binaries. It stops its own host and deletes the temporary host directory on success or failure.

Host logs remain under `.temp/art_e2e_native_v18_<id>/`. HTML reports and test artifacts remain in `src/Articulate.Web/Client/e2e-report-art_e2e_native_v18_<id>/` and `e2e-results-art_e2e_native_v18_<id>/`. Use `dotnet run --file build/test.cs -- report` to serve the latest report on loopback. Stop the server with Ctrl+C.

`NODE_BIN` and `DOTNET_BIN` can select existing executables without changing PATH.

## Manual site

`dotnet run --file build/test.cs -- e2e` tests the dedicated site at `https://localhost:19444`. It does not build packages or start a site. Do not run it against the normal local test site. To open the latest report, run the `report` command above.

Install Client dependencies before running tests:

```text
pnpm --dir src/Articulate.Web/Client install --frozen-lockfile
```

Run Playwright directly only when the dedicated manual site is already running:

```text
ARTICULATE_E2E_BASE_URL=https://localhost:19444 pnpm --dir src/Articulate.Web/Client run test:e2e
```

The config rejects other manual URLs. The native runner supplies its generated candidate name and verified HTTPS port. Certificate checks are disabled only for Playwright's localhost requests. Tests do not restart the host or reload its published-content cache.

## Coverage

The site needs a published Articulate root, its Articles archive and the VAPOR theme.

| Area | Checks |
| --- | --- |
| Publishing | Draft returns 404; published post appears in HTML and RSS; unpublishing removes its route. |
| RSS | `maxItems=2` returns two items; `maxItems=0` clamps to one. |
| Taxonomy | Tag and category listings and scoped feeds contain only matching published posts. |
| Search | Finds title and body matches; excludes drafts and non-matches; checks query limits, quoting, pagination, reserved indexes and page-one canonical redirects. |
| Route protection | Detects configured route collisions and verifies the prior public routes remain available. |
| Route refresh | Publishing a search URL change updates a warmed route without reloading the host. |
| Themes | The selected theme's stylesheet is served, and the original root configuration is restored. |
| Giscus | Packaged CSS, cache headers, allowed and anonymous CORS, untrusted origins and a missing-theme response. |

A helper test confirms that VAPOR search-result extraction returns one post-title link per card.

CI runs native E2E when selected by the `e2e` pull-request label, repository variable `E2E=true`, workflow-dispatch input or a release ref. It retains host logs and Playwright reports for one day. See [CI jobs and E2E](../../../../BUILD.md#ci-jobs-and-e2e).
