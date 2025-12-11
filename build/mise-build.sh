#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd -- "${BASH_SOURCE[0]%/*}" && pwd -P)"

if [[ -x "$SCRIPT_DIR/build.sh" ]]; then
  "$SCRIPT_DIR/build.sh"
else
  pwsh -NoLogo -File "$SCRIPT_DIR/build.ps1"
fi
