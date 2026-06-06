#!/usr/bin/env bash
set -euo pipefail

need_cmd() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "Required command not found on PATH: $1" >&2
    exit 127
  }
}

resolve_node() {
  if [[ -n "${NODE_BIN:-}" ]]; then
    return 0
  fi

  if command -v node >/dev/null 2>&1; then
    NODE_BIN=node
    return 0
  fi

  if command -v mise >/dev/null 2>&1; then
    NODE_BIN="$(mise which node 2>/dev/null || true)"
    if [[ -n "$NODE_BIN" && -x "$NODE_BIN" ]]; then
      return 0
    fi
  fi

  echo "Required command not found on PATH: node. Set NODE_BIN to a POSIX-shell-visible Node.js executable if your shell cannot find node." >&2
  exit 127
}

wait_for_umbraco_ready() {
  # The chiseled image has no shell/healthcheck, so probe the public Umbraco URL directly.
  local public_base="${UMBRACO_PUBLIC_URL:-https://localhost:18443/}"
  wait_for_url "${public_base%/}/umbraco"
}

wait_for_url() {
  local url="$1"
  local deadline=$((SECONDS + 300))
  local curl_tls_args=()

  case "$url" in
    https://localhost:*|https://localhost/*|https://127.0.0.1:*|https://127.0.0.1/*|https://[::1]:*|https://[::1]/*)
      curl_tls_args=(-k)
      ;;
  esac

  while (( SECONDS < deadline )); do
    local code
    code="$(curl "${curl_tls_args[@]}" -sS -o /dev/null -w '%{http_code}' "$url" 2>/dev/null || true)"
    if [[ "$code" == "200" || "$code" == "302" ]]; then
      return 0
    fi
    sleep 2
  done

  echo "Timed out waiting for $url to become reachable." >&2
  exit 1
}

need_cmd docker
need_cmd curl

PROJECT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$PROJECT_DIR"

export UMBRACO_RUNTIME_MODE="${UMBRACO_RUNTIME_MODE:-BackofficeDevelopment}"
AUTOPUBLISH_MODE="${AUTOPUBLISH_MODE:-api}"
AUTOPUBLISH_PACKAGE_ZIP="${AUTOPUBLISH_PACKAGE_ZIP:-}"
RESET_DOCKER_VOLUMES="${RESET_DOCKER_VOLUMES:-false}"

package_zip_has_publishable_content() {
  local package_zip="$1"

  [[ -f "$package_zip" ]] || return 1

  unzip -p "$package_zip" package.xml 2>/dev/null | grep -Eq '<(Documents|MediaItems)>'
}

case "$AUTOPUBLISH_MODE" in
  api|plugin|none)
    ;;
  *)
    echo "Unsupported AUTOPUBLISH_MODE: $AUTOPUBLISH_MODE" >&2
    exit 1
    ;;
esac

if [[ "$AUTOPUBLISH_MODE" != "none" ]]; then
  resolve_node

  if [[ -z "${ARTICULATE_DEV_AUTOMATION_CLIENT_SECRET:-}" ]]; then
    echo "ARTICULATE_DEV_AUTOMATION_CLIENT_SECRET must be set for AUTOPUBLISH_MODE=$AUTOPUBLISH_MODE." >&2
    exit 1
  fi

  export ARTICULATE_DEV_AUTOMATION_CLIENT_SECRET
  export ARTICULATE_DEV_AUTOMATION_CLIENT_ID="${ARTICULATE_DEV_AUTOMATION_CLIENT_ID:-articulate-dev-automation}"
  export UMBRACO_PUBLIC_URL="${UMBRACO_PUBLIC_URL:-https://localhost:18443/}"
fi

if [[ "$AUTOPUBLISH_MODE" == "plugin" ]]; then
  need_cmd unzip
fi

case "$RESET_DOCKER_VOLUMES" in
  true|1|yes)
    echo "Resetting Docker containers and volumes before dev run."
    docker compose down -v
    ;;
  false|0|no)
    ;;
  *)
    echo "Unsupported RESET_DOCKER_VOLUMES value: $RESET_DOCKER_VOLUMES" >&2
    exit 1
    ;;
esac

docker compose up -d
service_id="$(docker compose ps -q articulate)"
if [[ -z "$service_id" ]]; then
  echo "Could not find the articulate service container id." >&2
  exit 1
fi

wait_for_umbraco_ready
smoke_script="$PROJECT_DIR/build/docker-site/smoke.mjs"
case "$AUTOPUBLISH_MODE" in
  api)
    "$NODE_BIN" "$smoke_script" publish
    ;;
  plugin)
    if [[ -z "$AUTOPUBLISH_PACKAGE_ZIP" ]]; then
      echo "AUTOPUBLISH_MODE=plugin requires AUTOPUBLISH_PACKAGE_ZIP to point at a content-bearing package.zip." >&2
      exit 1
    fi

    if package_zip_has_publishable_content "$AUTOPUBLISH_PACKAGE_ZIP"; then
      echo "Content-bearing package zip detected at $AUTOPUBLISH_PACKAGE_ZIP; confirming published state through dev automation."
      "$NODE_BIN" "$smoke_script" confirm
    else
      echo "Package zip at $AUTOPUBLISH_PACKAGE_ZIP does not contain publishable content in package.xml; skipping plugin confirm path." >&2
      exit 1
    fi
    ;;
  none)
    echo "Skipping publish/confirm step because AUTOPUBLISH_MODE=none."
    ;;
esac
