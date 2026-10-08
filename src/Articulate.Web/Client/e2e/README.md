# HTTP E2E tests

Run Playwright against the packaged Docker sites. Tests use HTTP requests, not a browser. They delete their posts and restore root configuration after each test.

## Start isolated sites

Run from the repository root. Use only these test resources, not `art_v17` or `art_v18`:

| Lane | Project and volume prefix | Image | HTTPS / HTTP ports |
| --- | --- | --- | --- |
| v17 | `art_e2e_v17` | `articulate-e2e:v17` | 19443 / 9080 |
| v18 | `art_e2e_v18` | `articulate-e2e:v18` | 19444 / 9081 |

```sh
env COMPOSE_PROJECT_NAME=art_e2e_v17 COMPOSE_VOLUME_PREFIX=art_e2e_v17 IMAGE_TAG=articulate-e2e:v17 CADDY_HTTPS_PORT=19443 CADDY_HTTP_PORT=9080 ARTICULATE_TEST_SITE_CLIENT_SECRET=articulate-test-site-secret mise exec node@24.18.1 pnpm@11.19.0 -- dotnet run --file docker/run.cs -- docker-dev --lane v17 --skip-smoke --clean
env COMPOSE_PROJECT_NAME=art_e2e_v18 COMPOSE_VOLUME_PREFIX=art_e2e_v18 IMAGE_TAG=articulate-e2e:v18 CADDY_HTTPS_PORT=19444 CADDY_HTTP_PORT=9081 ARTICULATE_TEST_SITE_CLIENT_SECRET=articulate-test-site-secret mise exec node@24.18.1 pnpm@11.19.0 -- dotnet run --file docker/run.cs -- docker-dev --lane v18 --skip-smoke --clean
```

Build one lane at a time. `--clean` is required when switching lanes. For a fresh site, publish starter content once before testing:

```sh
env UMBRACO_PUBLIC_URL=https://localhost:19443/ ARTICULATE_TEST_SITE_CLIENT_SECRET=articulate-test-site-secret mise exec node@24.18.1 pnpm@11.19.0 -- node docker/smoke.mjs publish
```

For v18, use `https://localhost:19444/`. This setup reloads Umbraco's cache. Run it before tests, never during a test.

## Install and run

Install dependencies:

```sh
mise exec node@24.18.1 pnpm@11.19.0 -- pnpm --dir src/Articulate.Web/Client install --frozen-lockfile
```

Run both lanes sequentially or select one:

```sh
env ARTICULATE_TEST_SITE_CLIENT_SECRET=articulate-test-site-secret mise exec node@24.18.1 -- dotnet run --file build/test.cs -- e2e --lane all
env ARTICULATE_TEST_SITE_CLIENT_SECRET=articulate-test-site-secret mise exec node@24.18.1 -- dotnet run --file build/test.cs -- e2e --lane v17
env ARTICULATE_TEST_SITE_CLIENT_SECRET=articulate-test-site-secret mise exec node@24.18.1 -- dotnet run --file build/test.cs -- e2e --lane v18
```

To run Playwright directly, set the test URL and secret:

```sh
env ARTICULATE_E2E_BASE_URL=https://localhost:19443 ARTICULATE_TEST_SITE_CLIENT_SECRET=articulate-test-site-secret mise exec node@24.18.1 pnpm@11.19.0 -- pnpm --dir src/Articulate.Web/Client run test:e2e
env ARTICULATE_E2E_BASE_URL=https://localhost:19444 ARTICULATE_TEST_SITE_CLIENT_SECRET=articulate-test-site-secret mise exec node@24.18.1 pnpm@11.19.0 -- pnpm --dir src/Articulate.Web/Client run test:e2e
```

Reports are in `src/Articulate.Web/Client/e2e-report-<lane>`; test artefacts are in `e2e-results-<lane>`. Open a report with `dotnet run --file build/test.cs -- report --lane v17` or `--lane v18`. Playwright prints the local URL. Stop it with Ctrl+C.

The config accepts only HTTPS localhost ports 19443 and 19444. Certificate checks are disabled only for Playwright requests. Tests run with one worker, no retries and a 20-second polling limit. They do not reload the app cache or restart the site.

Check the test types:

```sh
mise exec node@24.18.1 pnpm@11.19.0 -- pnpm --dir src/Articulate.Web/Client/v17 exec tsc --ignoreConfig --noEmit --strict --target ES2022 --module NodeNext --moduleResolution NodeNext --types node ../e2e/publishing-rss.spec.ts ../e2e/giscus-theme.spec.ts
```

## PowerShell setup

Set the same test resources before starting v17:

```powershell
$env:COMPOSE_PROJECT_NAME = 'art_e2e_v17'; $env:COMPOSE_VOLUME_PREFIX = 'art_e2e_v17'; $env:IMAGE_TAG = 'articulate-e2e:v17'; $env:CADDY_HTTPS_PORT = '19443'; $env:CADDY_HTTP_PORT = '9080'; $env:ARTICULATE_TEST_SITE_CLIENT_SECRET = 'articulate-test-site-secret'
mise exec node@24.18.1 pnpm@11.19.0 -- dotnet run --file docker/run.cs -- docker-dev --lane v17 --skip-smoke --clean
$env:UMBRACO_PUBLIC_URL = 'https://localhost:19443/'
mise exec node@24.18.1 pnpm@11.19.0 -- node docker/smoke.mjs publish
mise exec node@24.18.1 -- dotnet run --file build/test.cs -- e2e --lane v17
```

For v18, use the table's v18 values, set `UMBRACO_PUBLIC_URL` to `https://localhost:19444/`, and change `--lane v17` to `--lane v18`.

## Coverage

The site needs a published Articulate root, its Articles archive and the VAPOR theme.

| Area | Checks |
| --- | --- |
| Publishing | Draft returns 404; published post appears in HTML and RSS; unpublished route returns 404. |
| RSS | `maxItems=2` returns both test posts; `maxItems=0` returns one. |
| Taxonomy | Three published posts use the live `Umbraco.Tags` JSON-array schemas and distinct tag/category groups. Exact title/URL sets and nonmatching-post exclusions are checked in tag/category listings and scoped RSS; fixture posts are deleted and owned tag records are reported. |
| Search | Title/body matches; drafts and non-matches excluded; 200-character and 10-token limits; quote escaping; two-page capacity, disjoint exact title/URL pairs and complete fixture union. Pagination temporarily sets the dedicated root pageSize to 2, then restores its full saved values, variants and template. |
| Search routing | Page-one redirect; reserved index names use published content. |
| Route refresh | Publishing `searchUrlName` changes a warmed route without a reload. |
| Themes | Publishing a theme change serves the rendered CSS URL; original configuration restored. |
| Giscus | Packaged CSS, one-hour cache, reflected allowed-origin CORS, anonymous wildcard CORS without `Vary: Origin`, and missing-theme fallback. |

One helper test checks that VAPOR extraction returns only each preview's `h1.post-title` link, not read-more, excerpt or sidebar links. Search tests do not cover other themes or distinguish AND from OR queries. RSS tests do not check feed freshness after unpublish.

## Teardown

Only remove the dedicated project and volumes. Repeat with `--lane v18` as needed.

```sh
env COMPOSE_PROJECT_NAME=art_e2e_v17 COMPOSE_VOLUME_PREFIX=art_e2e_v17 IMAGE_TAG=articulate-e2e:v17 CADDY_HTTPS_PORT=19443 CADDY_HTTP_PORT=9080 dotnet run --file docker/run.cs -- docker-down --lane v17 --volumes
env COMPOSE_PROJECT_NAME=art_e2e_v18 COMPOSE_VOLUME_PREFIX=art_e2e_v18 IMAGE_TAG=articulate-e2e:v18 CADDY_HTTPS_PORT=19444 CADDY_HTTP_PORT=9081 dotnet run --file docker/run.cs -- docker-down --lane v18 --volumes
```
