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

need_cmd docker
resolve_node

PROJECT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$PROJECT_DIR"

export UMBRACO_RUNTIME_MODE="${UMBRACO_RUNTIME_MODE:-Production}"
export UMBRACO_PUBLIC_HOST="${UMBRACO_PUBLIC_HOST:-https://localhost:18443}"
export UMBRACO_PUBLIC_URL="${UMBRACO_PUBLIC_URL:-https://localhost:18443/}"

docker compose up -d --force-recreate

smoke_script="$PROJECT_DIR/build/docker-site/smoke.mjs"
"$NODE_BIN" "$smoke_script" smoke
