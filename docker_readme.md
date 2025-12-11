# Articulate Docker Guide (net9 & net10)

## Images & defaults
- Two images: `Dockerfile.net9` (Umbraco 16.x range on .NET 9) and `Dockerfile.net10` (Umbraco 17.x range on .NET 10, using nightly builds).
- Build args (both files):
  - `BUILD_CONFIGURATION` (default `Release`).
  - `UMBRACO_CMS_VERSION` (net9 default `[16.4.0,17.0.0)`, net10 default `[17.0.1,18.0.0)`).
  - `IMAGE_TAG` (compose defaults: `articulate-local:net9`, `articulate-local:net10`).
- Runtime env: non-root UID 1654, `no-new-privileges`, tmpfs `/tmp`, healthcheck on `/umbraco`, plus an in-stack Caddy reverse proxy that terminates TLS.
- Build process: consumes packages created by `BUILD_CONFIGURATION=Release mise run build` (placed under `build/Release/*.nupkg`). Run the local build script before Docker builds.

## Compose files (Side-by-Side Support)
The environment supports running both stacks simultaneously. Docker Compose projects are isolated via project names (`articulate-net9`, `articulate-net10`) and use distinct host ports.

### .NET 9 Stack (`docker-compose.net9.yml`)
- **Project Name:** `articulate-net9`
- **Web (Caddy):** `http://localhost:8080` / `https://localhost:8443`
- **Database (SQLite):** Volume `articulate16_net9_db`
- **SQL Server (Profile `mssql`):** Host Port `14339`, Volume `articulate_net9_mssql`

### .NET 10 Stack (`docker-compose.net10.yml`)
- **Project Name:** `articulate-net10`
- **Web (Caddy):** `http://localhost:8090` / `https://localhost:8450`
- **Database (SQLite):** Volume `articulate17_net10_db`
- **SQL Server (Profile `mssql`):** Host Port `14330`, Volume `articulate_net10_mssql`

## Key environment variables
- `BUILD_CONFIGURATION` (`Release`/`Debug`)
- `ASPNETCORE_ENVIRONMENT` (`Container`/`Development`/`Production`)
- `UMBRACO_CMS_VERSION` (pin/override Umbraco package)
- `IMAGE_TAG` (custom image name:tag)
- Unattended install credentials: `UMBRACO_USER_NAME`, `UMBRACO_USER_EMAIL`, `UMBRACO_USER_PASSWORD`
- `Articulate__AutoPublishOnStartup` (`true`): Automatically publishes the blog tree on startup.
- `MODELS_MODE` (`Nothing`): Override for `Umbraco:CMS:ModelsBuilder:ModelsMode` (e.g., `SourceCodeManual`).
- `ARTICULATE_HOST`: Internal hostname used by Caddy (handled automatically).

## mise tasks
Tasks are prefixed with `docker-` (for net9) and `docker10-` (for net10).

- `build` - build image
- `up` - start container
- `up-build` - rebuild + start (prints login info banner)
- `down` - stop (keeps volumes)
- `reset` - **Full reset**: stops containers, removes all volumes (DB, Media, MSSQL), and rebuilds/starts fresh.
- `logs` - tail logs
- `shell` - bash into container
- `sqlite` - SQLite CLI
- `debug` - Debug build + Development env
- `health` - Check health endpoint (default `/` or `/blog`)
- `export-cert` - Export Caddy's root certificate for local trust

**Quick Start:**
```bash
# Net9
mise run docker-up-build

# Net10
mise run docker10-up-build
```

## Manual equivalents (SQLite)
Always use the `-p` flag to match the project name defined in `mise` tasks.

```bash
# net9
docker compose -p articulate-net9 -f docker-compose.net9.yml up -d --build

# net10
docker compose -p articulate-net10 -f docker-compose.net10.yml up -d --build

# stop
docker compose -p articulate-net9 -f docker-compose.net9.yml down
```

## Manual with SQL Server
To use SQL Server instead of SQLite, enable the `mssql` profile and provide the connection string.

**Bash / Zsh:**
```bash
# net9 (Port 14339)
COMPOSE_PROFILES=mssql \
MSSQL_SA_PASSWORD='P@ssw0rd12345!' \
UMBRACO_CONNECTIONSTRING="Server=mssql-net9,1433;Database=ArticulateNet9;User Id=sa;Password=P@ssw0rd12345!;Encrypt=False;" \
docker compose -p articulate-net9 -f docker-compose.net9.yml up -d --build

# net10 (Port 14330)
COMPOSE_PROFILES=mssql \
MSSQL_SA_PASSWORD='P@ssw0rd12345!' \
UMBRACO_CONNECTIONSTRING="Server=mssql-net10,1433;Database=ArticulateNet10;User Id=sa;Password=P@ssw0rd12345!;Encrypt=False;" \
docker compose -p articulate-net10 -f docker-compose.net10.yml up -d --build
```

**PowerShell:**
```powershell
# net9
$env:COMPOSE_PROFILES='mssql'
$env:MSSQL_SA_PASSWORD='P@ssw0rd12345!'
$env:UMBRACO_CONNECTIONSTRING='Server=mssql-net9,1433;Database=ArticulateNet9;User Id=sa;Password=P@ssw0rd12345!;Encrypt=False;'
docker compose -p articulate-net9 -f docker-compose.net9.yml up -d --build
```

## Debug locally
To run with `Debug` configuration and `Development` environment (enabling detailed logs and developer pages):

```bash
# net9
BUILD_CONFIGURATION=Debug ASPNETCORE_ENVIRONMENT=Development mise run docker-debug

# net10
BUILD_CONFIGURATION=Debug ASPNETCORE_ENVIRONMENT=Development mise run docker10-debug
```

## Host-based URL checks & Auto-publish
The `docker-health` tasks use `CHECK_PATH` (default `/`) to assert the site is up. Because `Articulate__AutoPublishOnStartup` is enabled by default, the blog root is published immediately.

Key paths to verify:
- `/` → `200 OK` (Blog root)
- `/tags` → `200 OK`
- `/search` → `200 OK`
- `/a-new` → `302` (Redirect to login)
- `/umbraco` → `302` (Redirect to login)

Example override:
`CHECK_PATH=/tags mise run docker-health`

## HTTPS Configuration

This Docker setup uses HTTPS by default for secure OAuth/OpenID Connect flows. **HTTP access automatically redirects to HTTPS.**

### Accessing the Application

- **HTTPS (recommended)**:
  - Net9: `https://localhost:8443`
  - Net10: `https://localhost:8450`
- **HTTP (automatically redirects to HTTPS)**:
  - Net9: `http://localhost:8080` → redirects to `https://localhost:8443`
  - Net10: `http://localhost:8090` → redirects to `https://localhost:8450`

### Certificate Trust

On first access, your browser will warn about an untrusted certificate. This is expected because Caddy uses a self-signed internal CA.

**⚠️ Quick Note**: You can dismiss the browser warning (click "Advanced" → "Proceed to localhost") and use the site immediately. **The TLS connection still works** - encryption is active, and OAuth/OpenID flows will function correctly. The warning just means the browser doesn't recognize the certificate authority. However, you'll see the warning on every visit unless you import the certificate.

**To permanently trust the certificate and eliminate browser warnings:**

1. **Export the root CA certificate:**
   ```bash
   # For net9
   mise run docker-export-cert
   # Creates: articulate-net9-caddy-root.crt

   # For net10
   mise run docker10-export-cert
   # Creates: articulate-net10-caddy-root.crt
   ```

2. **Import the exported certificate into your system's trusted root certificates:**

   **Windows:**
   - Double-click the certificate file (`articulate-net9-caddy-root.crt`)
   - Click "Install Certificate"
   - Choose "Local Machine" (requires admin) or "Current User"
   - Select "Place all certificates in the following store"
   - Click "Browse" and choose "Trusted Root Certification Authorities"
   - Click "Next" and "Finish"

   **macOS:**
   ```bash
   # For net9
   sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain articulate-net9-caddy-root.crt

   # For net10
   sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain articulate-net10-caddy-root.crt
   ```

   **Linux (Debian/Ubuntu):**
   ```bash
   # For net9
   sudo cp articulate-net9-caddy-root.crt /usr/local/share/ca-certificates/
   sudo update-ca-certificates

   # For net10
   sudo cp articulate-net10-caddy-root.crt /usr/local/share/ca-certificates/
   sudo update-ca-certificates
   ```

3. **Restart your browser**

4. **Access the HTTPS URL** - you should now see a secure padlock with no warnings!

### Why HTTPS for Local Development?

- **OAuth/OpenID Connect security**: OpenID authentication requires secure redirect URIs for production-like testing
- **TLS encryption**: Protects OAuth tokens and credentials during the authorization flow
- **Production parity**: HTTPS in development matches production environment behavior
- **Browser security features**: Some modern browser features (service workers, secure cookies) require HTTPS
- **HTTPS-only cookies**: Allows testing of cookies with the `Secure` flag set

### With vs Without Certificate Import

| Aspect | Dismiss Warning (Quick) | Import Certificate (Recommended) |
|--------|------------------------|----------------------------------|
| **TLS Encryption** | ✅ Active | ✅ Active |
| **OAuth/OpenID Flows** | ✅ Works | ✅ Works |
| **Backend Security** | ✅ Secure | ✅ Secure |
| **Browser Warning** | ⚠️ Shown on every visit | ✅ No warnings |
| **Setup Time** | Instant | ~2 minutes |
| **Developer Experience** | Repeated clicks | Seamless |
| **Secure Cookies** | ✅ Works | ✅ Works |
| **Service Workers** | ⚠️ May have issues | ✅ Works |

**Bottom line**: Dismissing the warning is **perfectly fine for quick testing**. The TLS connection is fully encrypted and secure - you just have to click through the warning each time. Import the certificate for a smoother experience.

### Technical Details

- **TLS Termination**: Caddy handles TLS termination and proxies to the ASP.NET Core container on HTTP port 8080
- **Certificate Authority**: Caddy creates a self-signed local CA at `/data/caddy/pki/authorities/local/`
- **Certificate Lifespan**: Leaf certificates auto-renew every ~30 days (root CA lasts much longer)
- **Certificate Validation**: Only the public root CA certificate is exported (no private keys)
- **Backend Impact**: Whether you dismiss the warning or import the certificate, **the backend sees the same encrypted TLS connection** - no difference in security or functionality