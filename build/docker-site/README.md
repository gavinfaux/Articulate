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

## Notes

- This is unrelated to NTLM/SMB hardening; it is normal browser PKI behavior.
- If your team policy disallows installing a local root CA, you will need a publicly trusted certificate/domain for local development.
- Default unattended backoffice credentials for the Docker site are:
  - Name: `Jane Doe`
  - Email: `admin@localhost`
  - Password: `@rticulate`
- Override those defaults with `UMBRACO_USER_NAME`, `UMBRACO_USER_EMAIL`, and `UMBRACO_USER_PASSWORD` before starting the stack if needed.
- The Docker image builds from the packaged `Articulate` NuGet artifact in `build/Release`, not directly from the project output. If you change packaged runtime dependencies in `src/Articulate/Articulate.csproj` or `src/Articulate.Web/Articulate.Web.csproj`, regenerate the package first with `dotnet pack src/Articulate.Web/Articulate.Web.csproj -c Release -o build/Release` before running `docker compose build`.
- The Dockerfile selects the newest `Articulate.*.nupkg` in `build/Release` by modified time and ignores `.snupkg` files.
- Rebuilding the image is not enough on its own. After `docker compose build articulate`, recreate the app service with `docker compose up -d --force-recreate --no-deps articulate` so the running container picks up the new image.
- If the Docker back office still serves older JavaScript, inspect `https://localhost:18443/App_Plugins/Articulate/BackOffice/articulate-backoffice.js` and compare the imported `dashboard.element-*.js` hash with the files present in the running `articulate` container.
