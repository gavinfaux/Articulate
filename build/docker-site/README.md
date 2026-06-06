# Local HTTPS (Windows)

This repo uses Caddy to terminate TLS for the local Umbraco container.

The default `Caddyfile` uses `tls internal`, which generates a local CA and a server certificate. Browsers on Windows will show a TLS error until the local CA is trusted.

## Windows (PowerShell)

From the repo root:

1. Start containers:
   - `docker compose up -d`

2. Trust Caddy's local root CA (Current User by default):
   - `powershell -ExecutionPolicy Bypass -File .\build\docker-site\Trust-CaddyRootCA.ps1`

If you need machine-wide trust (admin required):

- `powershell -ExecutionPolicy Bypass -File .\build\docker-site\Trust-CaddyRootCA.ps1 -Scope LocalMachine`

Restart your browser and open `https://localhost:18443`.

- The script runs on the host and uses `docker cp` to export Caddy's internal root CA from the running `caddy` container.
- No bind mounts are required for certificate export.

## Debian/Ubuntu/WSL

From the repo root:

1. Start containers:
   - `docker compose up -d`

2. Trust Caddy's local root CA (system store; requires sudo):
   - `./build/docker-site/trust-caddy-root-ca.sh`

3. Run the repeatable dev/prod smoke helpers:
   - Bring up the dev stack (`BackofficeDevelopment`) and allow dev automation bootstrap plus script-driven publish/verify:
     - `ARTICULATE_DEV_AUTOMATION_CLIENT_SECRET=... ./build/docker-site/run-dev.sh`
     - `RESET_DOCKER_VOLUMES=true ARTICULATE_DEV_AUTOMATION_CLIENT_SECRET=... ./build/docker-site/run-dev.sh`
   - After completing dev work, run the production-style smoke test to validate the production configuration:
     - `UMBRACO_RUNTIME_MODE=Production ./build/docker-site/run-prod-smoke.sh`

   Note: `run-prod-smoke.sh` will set sensible defaults for `UMBRACO_PUBLIC_HOST` and `UMBRACO_PUBLIC_URL` if they are not provided. If running on a non-Linux host or using `host.docker.internal`, set `UMBRACO_PUBLIC_HOST`/`UMBRACO_PUBLIC_URL` explicitly before running the smoke script.
   The intended order is dev first, production second: dev mode bootstraps automation credentials and publishes/verifies content, then the production smoke recreates the container in `Production` and verifies that already-published content serves without automation bootstrap.
   The bash helpers bypass TLS validation only for loopback HTTPS URLs (`localhost`, `127.0.0.1`, `::1`) used by Caddy's local certificate. Non-loopback URLs use normal certificate validation.

4. Run the smoke helper directly when you already have a healthy dev container:
   - `ARTICULATE_DEV_AUTOMATION_CLIENT_SECRET=... node build/docker-site/smoke.mjs publish`
   - `ARTICULATE_DEV_AUTOMATION_CLIENT_SECRET=... node build/docker-site/smoke.mjs confirm` (read-only, verifies content is published)
   - `ARTICULATE_DEV_AUTOMATION_CLIENT_SECRET=... node build/docker-site/smoke.mjs publish --no-descendants` (root only)
   - The helper publishes the Articulate root first, waits for the public root while the published-content cache catches up, then publishes descendants.

5. Opt into the plugin-confirm path when you want Docker to verify the real package-side opt-in path via the Management API without doing the publish step itself:
   - `AUTOPUBLISH_MODE=plugin AUTOPUBLISH_PACKAGE_ZIP=src/Articulate.Theme.Sample/Packaging/package.zip ARTICULATE_DEV_AUTOMATION_CLIENT_SECRET=... ./build/docker-site/run-dev.sh`
   - `RESET_DOCKER_VOLUMES=true AUTOPUBLISH_MODE=plugin AUTOPUBLISH_PACKAGE_ZIP=src/Articulate.Theme.Sample/Packaging/package.zip ARTICULATE_DEV_AUTOMATION_CLIENT_SECRET=... ./build/docker-site/run-dev.sh`

## Notes

- This is unrelated to NTLM/SMB hardening; it is normal browser PKI behavior.
- If your team policy disallows installing a local root CA, you will need a publicly trusted certificate/domain for local development.
- Default unattended backoffice credentials for the Docker site are:
  - Name: `Jane Doe`
  - Email: `admin@localhost`
  - Password: `@rticulate`
- Override those defaults with `UMBRACO_USER_NAME`, `UMBRACO_USER_EMAIL`, and `UMBRACO_USER_PASSWORD` before starting the stack if needed.
- The bash smoke wrappers require Docker and Node.js in that shell. They resolve Node from `PATH`, then `mise which node`; if Node is installed somewhere else, set `NODE_BIN` to a POSIX-shell-visible Node executable. On Windows, run `node build/docker-site/smoke.mjs ...` from PowerShell/cmd rather than pointing WSL/Git Bash at `node.exe`; that path does not reliably preserve environment variables. `AUTOPUBLISH_MODE=plugin` also requires `unzip` so the wrapper can confirm the package zip contains publishable content before checking state through the Management API.
- The Docker stack also bootstraps a dev-only automation API user and client credentials on startup.
  - Client id: `articulate-dev-automation`
  - Secret: set `ARTICULATE_DEV_AUTOMATION_CLIENT_SECRET` to a strong random value
  - Defaults: `ARTICULATE_DEV_AUTOMATION_ENABLED=true`, `ARTICULATE_DEV_AUTOMATION_USER_GROUP_ALIAS=admin`
  - Override with `ARTICULATE_DEV_AUTOMATION_CLIENT_ID`, `ARTICULATE_DEV_AUTOMATION_USER_NAME`, `ARTICULATE_DEV_AUTOMATION_USER_EMAIL`, and `ARTICULATE_DEV_AUTOMATION_USER_DISPLAY_NAME` if needed
  - Suggested secret shape: 32 random bytes encoded as base64 or hex, generated once per dev environment and stored in `.env.local`
- Select the Umbraco/DotNet line with compose env vars:
  - `TARGET_FRAMEWORK=net10.0` + `UMBRACO_CMS_VERSION=[17.2.2,18.0.0)` for Umbraco 17
  - `TARGET_FRAMEWORK=net9.0` + `UMBRACO_CMS_VERSION=[16.5.1,17.0.0)` for Umbraco 16
  - Keep `DOTNET_SDK_VERSION=10.0.201` unless `global.json` changes; set `DOTNET_ASPNET_VERSION` to the selected runtime line (`10.0.2` for net10, `9.0` for net9).
- Select the runtime mode with `UMBRACO_RUNTIME_MODE`:
  - `BackofficeDevelopment` for the dev benchmark path so automation credentials can be bootstrapped before publish/verify scripts run
  - `Production` for the production-style smoke test so no dev-only bootstrap runs
- The script entry points are:
  - `build/docker-site/run-dev.sh` (dev stack + autopublish)
  - `build/docker-site/run-prod-smoke.sh` (prod stack + smoke test)
  - `build/docker-site/smoke.mjs` (cross-platform Management API publish/confirm/smoke, no shell duals)
- `AUTOPUBLISH_MODE` selects the dev path:
  - `api` for the current Management API-driven publish flow
  - `plugin` for the opt-in confirm-only harness that verifies the package-side opt-in path instead of doing the publish step itself
  - `none` to skip the publish/confirm step
- `AUTOPUBLISH_PACKAGE_ZIP` is required for `AUTOPUBLISH_MODE=plugin`; point it at a package zip whose `package.xml` contains `<Documents>` or `<MediaItems>` entries, such as `src/Articulate.Theme.Sample/Packaging/package.zip`
- `RESET_DOCKER_VOLUMES=true` runs `docker compose down -v` before the dev run so the install starts from an empty database and media volume. Leave it unset for normal iterative runs.
- Standard smoke evidence is HTTP/DOM/log based. Screenshots are ad hoc evidence for manual review, not part of the normal test path.
- The actual package-side opt-in autopublish feature is controlled by `Articulate:AutoPublishOnStartup`; Docker `plugin` mode is just a confirm-only harness for the real import path.
- The Docker image builds from packaged NuGet artifacts in `build/Release`, not directly from project output.
- Regenerate the package inputs after client/static asset or packaged dependency changes:
  - `dotnet pack src/Articulate.Web/Articulate.Web.csproj -c Release`
  - `dotnet pack src/Articulate.Theme.Sample/Articulate.Theme.Sample.csproj -c Release`
- Alternatively, run the repo build script with `PACK_SAMPLE_THEME=true` to produce both packages for Docker validation.
- Keep `Articulate` and `Articulate.Theme.Sample` at the same package version. The Docker site restores both with the version selected from the newest `Articulate.[0-9]*.nupkg`, and the Sample package is the concrete opt-in example.
- The Dockerfile ignores `.snupkg` files and theme packages when selecting the Articulate package version.
- Rebuilding the image is not enough on its own. A running Compose service can stay on an older container/image. Prefer:
  - `docker compose up -d --build --force-recreate articulate`
- Or run the two steps explicitly:
  - `docker compose build articulate`
  - `docker compose up -d --force-recreate --no-deps articulate`
- `articulate-local:chiseled` is the default image tag. The running container name is generated by Compose, for example `articulate-pr-articulate-1`.
- If the Docker back office still serves older JavaScript, check the running container rather than only the image:
  - `docker compose ps`
  - `docker exec articulate-pr-articulate-1 /bin/sh -c "find /app -path '*App_Plugins/Articulate/BackOffice/articulate-backoffice.js' -o -path '*App_Plugins/Articulate/umbraco-package.json'"`
  - `Invoke-WebRequest https://localhost:18443/App_Plugins/Articulate/BackOffice/articulate-backoffice.js -SkipCertificateCheck`
