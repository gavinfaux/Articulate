#!/usr/bin/env bash

set -euo pipefail

# Detect WSL and ensure dotnet is on PATH if installed under HOME
IS_WSL=0
if [[ -n "${WSL_DISTRO_NAME:-}" ]] || grep -qi microsoft /proc/version 2>/dev/null; then
  IS_WSL=1
fi
if ! command -v dotnet >/dev/null 2>&1; then
  if [[ -d "$HOME/.dotnet" ]]; then
    export PATH="$PATH:$HOME/.dotnet:$HOME/.dotnet/tools"
  fi
fi

# CI/WSL perf-friendly defaults
export DOTNET_CLI_TELEMETRY_OPTOUT=1
export DOTNET_SKIP_FIRST_TIME_EXPERIENCE=1
export DOTNET_NOLOGO=1
export NUGET_XMLDOC_MODE=skip

START_TIME=$(date +%s.%N)
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd -- "$SCRIPT_DIR/.." && pwd)"
BUILD_FOLDER="$REPO_ROOT/build"
RELEASE_FOLDER="$BUILD_FOLDER/Release"
SOLUTION_ROOT="$REPO_ROOT/src"
SOLUTION_PATH="$SOLUTION_ROOT/Articulate.sln"
TARGET_FRAMEWORKS=("net9.0" "net10.0")
TEST_PROJECTS=("Articulate.UnitTests/Articulate.UnitTests.csproj")
CLIENT_DIR="$SOLUTION_ROOT/Articulate.Api.Management/Client"

# Compute CPU parallelism for MSBuild (allow override via MAXCPU)
CPU_COUNT=${MAXCPU:-}
if [[ -z "$CPU_COUNT" ]]; then
  CPU_COUNT=$( (command -v nproc >/dev/null 2>&1 && nproc --all) || getconf _NPROCESSORS_ONLN || echo 8 )
fi
MSBUILD_PARALLEL=(-m -maxcpucount:"$CPU_COUNT" -p:BuildInParallel=true -p:RestoreUseStaticGraphEvaluation=true)
DOTNET_COMMON=(--nologo -v minimal)

# Handle ENABLE_CLIENT_BUILD environment variable (default to false locally, true in CI)
if [[ "${CI:-}" == "true" || "${GITHUB_ACTIONS:-}" == "true" ]]; then
  CLIENT_BUILD_DEFAULT=true
else
  CLIENT_BUILD_DEFAULT=false
fi
CLIENT_BUILD_VALUE=${ENABLE_CLIENT_BUILD:-$CLIENT_BUILD_DEFAULT}
CLIENT_BUILD_PROPERTY="-p:EnableClientBuild=$CLIENT_BUILD_VALUE"

echo "Using up to $CPU_COUNT parallel MSBuild nodes"

# Advise when running in WSL against Windows-mounted drives (slow)
if [[ $IS_WSL -eq 1 && "$REPO_ROOT" == /mnt/* ]]; then
  echo "WSL performance tip: You're building from '$REPO_ROOT' (a Windows-mounted path)." >&2
  echo "For much faster I/O, move the repo into your WSL distro (e.g. ~/src/Articulate6-wip) and build there." >&2
fi

if [[ -d "$RELEASE_FOLDER" ]]; then
  echo "Warning: $RELEASE_FOLDER already exists and will be deleted."
  rm -rf "$RELEASE_FOLDER"
fi

dotnet --version

# Avoid NuGet fallback folders (already disabled in Directory.Build.props, but double-sure)
export RestoreFallbackFolders=

echo "Starting clean and restore process for solution: $SOLUTION_PATH"

# --- 0) Clean the solution so Release/CI builds start fresh ---
echo "1. Cleaning solution outputs..."
dotnet clean "$SOLUTION_PATH" -c Release "${DOTNET_COMMON[@]}" "$CLIENT_BUILD_PROPERTY"

# --- 2) Create a temporary slim solution excluding local demo apps (u15/u16/u17) ---
TMP_SLN_DIR="$BUILD_FOLDER/tmp"
TMP_SLN="$TMP_SLN_DIR/Articulate.Packable.sln"
mkdir -p "$TMP_SLN_DIR" "$RELEASE_FOLDER"
if [[ ! -f "$TMP_SLN" ]]; then
  dotnet new sln -n Articulate.Packable -o "$TMP_SLN_DIR" >/dev/null
  dotnet sln "$TMP_SLN" add \
    "$SOLUTION_ROOT/Articulate/Articulate.csproj" \
    "$SOLUTION_ROOT/Articulate.Web/Articulate.Web.csproj" \
    "$SOLUTION_ROOT/Articulate.Api.Management/Articulate.Api.Management.csproj" \
    "$SOLUTION_ROOT/Articulate.StaticAssets/Articulate.StaticAssets.csproj" \
    >/dev/null
fi

# --- 3) Solution-level restore (slim sln) with static graph + parallelism ---
echo "2. Restoring solution packages in parallel (slim solution)..."
dotnet restore "$TMP_SLN" "${DOTNET_COMMON[@]}" "${MSBUILD_PARALLEL[@]}" "$CLIENT_BUILD_PROPERTY"

# --- 4) Build TFMs sequentially (net9 first, then net10) to keep client build ordering deterministic ---
echo "3. Building solution for: ${TARGET_FRAMEWORKS[*]}"

for tfm in "${TARGET_FRAMEWORKS[@]}"; do
  echo "[build] -> $tfm"
  t0=$(date +%s)
  if ! dotnet build "$TMP_SLN" -c Release -f "$tfm" --no-restore "${DOTNET_COMMON[@]}" "${MSBUILD_PARALLEL[@]}" "$CLIENT_BUILD_PROPERTY"; then
    echo "dotnet build failed for $tfm" >&2
    exit 1
  fi
  t1=$(date +%s)
  echo "[build] <- $tfm done in $((t1 - t0))s"
done

# --- 4) Optional tests (kept disabled to optimize CI time) ---
# for tfm in "${TARGET_FRAMEWORKS[@]}"; do
#   for test_project in "${TEST_PROJECTS[@]}"; do
#     test_path="$SOLUTION_ROOT/$test_project"
#     echo "Testing $test_project on $tfm..."
#     dotnet test "$test_path" -c Release --no-build -f "$tfm" "${DOTNET_COMMON[@]}"
#   done
# done

# --- 5) Pack primary projects (ensure StaticAssets dependency captured) ---
echo "4. Packing projects..."
ARTICULATE_PROJECT="$SOLUTION_ROOT/Articulate/Articulate.csproj"
ARTICULATE_WEB_PROJECT="$SOLUTION_ROOT/Articulate.Web/Articulate.Web.csproj"
ARTICULATE_API_PROJECT="$SOLUTION_ROOT/Articulate.Api.Management/Articulate.Api.Management.csproj"
ARTICULATE_STATIC_ASSETS_PROJECT="$SOLUTION_ROOT/Articulate.StaticAssets/Articulate.StaticAssets.csproj"

echo "[pack] -> $(basename "$ARTICULATE_STATIC_ASSETS_PROJECT")"
dotnet pack -c Release "$ARTICULATE_STATIC_ASSETS_PROJECT" --no-build --no-restore -o "$RELEASE_FOLDER" \
  "${DOTNET_COMMON[@]}" "${MSBUILD_PARALLEL[@]}" "$CLIENT_BUILD_PROPERTY" -p:NoPackageAnalysis=true

PACK_PROJECTS=(
  "$ARTICULATE_PROJECT"
  "$ARTICULATE_WEB_PROJECT"
  "$ARTICULATE_API_PROJECT"
)

declare -a pack_pids=()
for proj in "${PACK_PROJECTS[@]}"; do
  echo "[pack] -> $(basename "$proj")"
  RESTORE_SWITCHES=(--no-build --no-restore)
  dotnet pack -c Release "$proj" "${RESTORE_SWITCHES[@]}" -o "$RELEASE_FOLDER" \
    "${DOTNET_COMMON[@]}" "${MSBUILD_PARALLEL[@]}" "$CLIENT_BUILD_PROPERTY" -p:NoPackageAnalysis=true &
  pack_pids+=($!)
done

pack_fail=0
for pid in "${pack_pids[@]}"; do
  if ! wait "$pid"; then pack_fail=1; fi
done
if [[ $pack_fail -ne 0 ]]; then
  echo "One or more pack operations failed" >&2
  exit 1
fi

if [[ "${CI:-}" == "true" || "${GITHUB_ACTIONS:-}" == "true" ]]; then
  echo "Skipping GitLeaks scan (handled by CI workflow action)."
elif [[ "${SKIP_GITLEAKS:-}" == "1" ]]; then
  echo "Skipping GitLeaks scan (SKIP_GITLEAKS=1)."
elif command -v gitleaks >/dev/null 2>&1; then
  echo "Running GitLeaks scan..."
  GITLEAKS_ARGS=(detect --source "$REPO_ROOT" --redact --no-banner)
  if [[ -f "$REPO_ROOT/.gitleaks.baseline" ]]; then
    GITLEAKS_ARGS+=(--baseline-path "$REPO_ROOT/.gitleaks.baseline")
  fi
  if ! gitleaks "${GITLEAKS_ARGS[@]}"; then
    echo "GitLeaks detected sensitive content." >&2
    exit 1
  fi
else
  echo "Skipping GitLeaks scan (gitleaks CLI not found on PATH)."
fi

END_TIME=$(date +%s.%N)
ELAPSED=$(awk -v start="$START_TIME" -v end="$END_TIME" 'BEGIN {printf "%.1f", end - start}')
echo "Build pipeline completed in ${ELAPSED}s. Packages available at $RELEASE_FOLDER"
