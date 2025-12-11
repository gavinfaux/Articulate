# Plan: Complete .NET 9 Umbraco 16+ SQLite Docker Image

## Summary
Complete the Docker setup for Articulate running on Umbraco 16+ with .NET 9 and SQLite, including:
- SQLite CLI tool for debugging
- Production vs Debug mode switching via env vars (passed as params, no .env files)
- Easy reset mechanism (`docker compose down -v`)
- Mise tasks for Docker orchestration (host-only)
- Update existing release notes with Docker operations

---

## Files to Modify

| File | Action |
|------|--------|
| `Dockerfile.net9` | Add `sqlite3` package |
| `docker-compose.net9.yml` | Add `BUILD_CONFIGURATION` build arg |
| `.mise.toml` | Add 9 Docker tasks |
| `RELEASE_NOTES_v6.0.0.md` | Append Docker operations section |

---

## Step 1: Add sqlite3 to Dockerfile.net9

**File:** `E:\int\Articulate15\Dockerfile.net9` (line 37)

Change:
```dockerfile
apt-get install -y --no-install-recommends ca-certificates curl libarchive-tools;
```

To:
```dockerfile
apt-get install -y --no-install-recommends ca-certificates curl libarchive-tools sqlite3;
```

---

## Step 2: Update docker-compose.net9.yml

**File:** `E:\int\Articulate15\docker-compose.net9.yml`

Add build arg for BUILD_CONFIGURATION:
```yaml
services:
  articulate:
    build:
      context: .
      dockerfile: Dockerfile.net9
      args:
        BUILD_CONFIGURATION: ${BUILD_CONFIGURATION:-Release}
```

Update ASPNETCORE_ENVIRONMENT to use env var:
```yaml
    environment:
      ASPNETCORE_ENVIRONMENT: ${ASPNETCORE_ENVIRONMENT:-Container}
```

---

## Step 3: Add Mise Tasks to .mise.toml

**File:** `E:\int\Articulate15\.mise.toml`

Add after line 57:
```toml
# Docker Tasks (host-only)
[tasks.docker-build]
description = "Build Docker image for net9"
run = "docker compose -f docker-compose.net9.yml build"

[tasks.docker-up]
description = "Start container"
run = "docker compose -f docker-compose.net9.yml up -d"

[tasks.docker-up-build]
description = "Rebuild and start container"
run = "docker compose -f docker-compose.net9.yml up -d --build"

[tasks.docker-down]
description = "Stop container (preserves volumes)"
run = "docker compose -f docker-compose.net9.yml down"

[tasks.docker-reset]
description = "Full reset - removes all data and reinstalls"
run = """
docker compose -f docker-compose.net9.yml down -v
docker compose -f docker-compose.net9.yml up -d --build
"""

[tasks.docker-logs]
description = "Tail container logs"
run = "docker compose -f docker-compose.net9.yml logs -f articulate"

[tasks.docker-shell]
description = "Open shell in container"
run = "docker compose -f docker-compose.net9.yml exec articulate /bin/bash"

[tasks.docker-sqlite]
description = "Open SQLite CLI for Umbraco database"
run = "docker compose -f docker-compose.net9.yml exec articulate sqlite3 /app/umbraco/Data/Umbraco.sqlite.db"

[tasks.docker-debug]
description = "Start in debug mode (Development + Debug build)"
env.BUILD_CONFIGURATION = "Debug"
env.ASPNETCORE_ENVIRONMENT = "Development"
run = "docker compose -f docker-compose.net9.yml up -d --build"
```

---

## Step 4: Update RELEASE_NOTES_v6.0.0.md

**File:** `E:\int\Articulate15\RELEASE_NOTES_v6.0.0.md`

Append to "Container security" section (after line 36) - Docker operations documentation:

```markdown
### Docker operations (mise tasks)

| Task | Command | Description |
|------|---------|-------------|
| Build | `mise run docker-build` | Build the Docker image |
| Start | `mise run docker-up` | Start container (detached) |
| Rebuild & start | `mise run docker-up-build` | Rebuild image and start |
| Stop | `mise run docker-down` | Stop container (preserves volumes) |
| **Full reset** | `mise run docker-reset` | Remove volumes and reinstall Umbraco |
| Debug mode | `mise run docker-debug` | Start with `ASPNETCORE_ENVIRONMENT=Development` |
| Logs | `mise run docker-logs` | Tail container logs |
| Shell | `mise run docker-shell` | Open bash in container |
| SQLite CLI | `mise run docker-sqlite` | Open SQLite interactive shell |

**Environment variables** (pass inline or via 1Password/shell):

| Variable | Default | Description |
|----------|---------|-------------|
| `BUILD_CONFIGURATION` | `Release` | `Release` or `Debug` |
| `ASPNETCORE_ENVIRONMENT` | `Container` | `Container`, `Development`, or `Production` |
| `UMBRACO_USER_NAME` | `admin` | Initial admin username |
| `UMBRACO_USER_EMAIL` | `admin@example.com` | Initial admin email |
| `UMBRACO_USER_PASSWORD` | `ChangeMe123!` | Initial admin password |

**Examples:**

```powershell
# Production mode (default)
mise run docker-up-build

# Debug/development mode
mise run docker-debug

# Custom credentials (PowerShell)
$env:UMBRACO_USER_PASSWORD='MySecurePass123!'; mise run docker-up-build

# Full reset (removes database and media)
mise run docker-reset

# SQLite interactive access
mise run docker-sqlite
```

**Manual commands (without mise):**

```bash
# Build
docker compose -f docker-compose.net9.yml build

# Start
docker compose -f docker-compose.net9.yml up -d --build

# Full reset
docker compose -f docker-compose.net9.yml down -v
docker compose -f docker-compose.net9.yml up -d --build

# Debug mode
BUILD_CONFIGURATION=Debug ASPNETCORE_ENVIRONMENT=Development docker compose -f docker-compose.net9.yml up -d --build
```
```

---

## Quick Reference (Post-Implementation)

| Operation | Command |
|-----------|---------|
| Build | `mise run docker-build` |
| Start | `mise run docker-up` |
| Rebuild & start | `mise run docker-up-build` |
| Stop | `mise run docker-down` |
| **Full reset** | `mise run docker-reset` |
| Debug mode | `mise run docker-debug` |
| View logs | `mise run docker-logs` |
| Shell access | `mise run docker-shell` |
| SQLite CLI | `mise run docker-sqlite` |

---

## Testing Checklist

1. Build image: `mise run docker-build`
2. Verify sqlite3: `docker compose -f docker-compose.net9.yml run --rm articulate sqlite3 --version`
3. Start production: `mise run docker-up-build`
4. Verify unattended install completes at http://localhost:8080/umbraco
5. Test reset: `mise run docker-reset`
6. Verify fresh install works
7. Test debug mode: `mise run docker-debug`
8. Verify Development environment loads
