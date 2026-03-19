#!/usr/bin/env sh
set -eu

# Trust Caddy's internal root CA on Debian/Ubuntu (including WSL).
#
# Usage (from repo root):
#   ./build/docker-site/trust-caddy-root-ca.sh
#
# Requires:
# - docker (with compose plugin)
# - sudo (to install into system trust store)

need_cmd() {
	command -v "$1" >/dev/null 2>&1 || {
		echo "Required command not found on PATH: $1" >&2
		exit 127
	}
}

need_cmd docker
need_cmd sudo
need_cmd update-ca-certificates

PROJECT_DIR=$(cd "$(dirname "$0")/../.." && pwd)
OUT_DIR="$PROJECT_DIR/build/docker-site"
OUT_FILE="$OUT_DIR/caddy-local-root.crt"

cd "$PROJECT_DIR"

CID=$(docker compose ps -q caddy || true)
if [ -z "$CID" ]; then
  echo "Could not find running 'caddy' container. Run: docker compose up -d" >&2
  exit 1
fi

TMP=/tmp/caddy-local-root.crt

SOURCE=$(docker exec "$CID" sh -lc 'for f in /data/caddy/pki/authorities/local/root.crt /data/pki/authorities/local/root.crt; do [ -f "$f" ] && echo "$f" && exit 0; done; exit 1' 2>/dev/null || true)
if [ -z "$SOURCE" ]; then
  echo "Could not locate Caddy root CA in container." >&2
  echo "Tried: /data/caddy/pki/authorities/local/root.crt, /data/pki/authorities/local/root.crt" >&2
  exit 1
fi

docker exec "$CID" sh -lc "cp '$SOURCE' '$TMP'"

mkdir -p "$OUT_DIR"
docker cp "$CID:$TMP" "$OUT_FILE"

sudo cp "$OUT_FILE" /usr/local/share/ca-certificates/caddy-local-root.crt
sudo update-ca-certificates

echo "Trusted Caddy root CA (system): /usr/local/share/ca-certificates/caddy-local-root.crt"
