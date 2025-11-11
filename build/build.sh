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

# Optionally build backoffice client assets (ENABLE_CLIENT_BUILD=true or CI=true)
if [[ ("${ENABLE_CLIENT_BUILD:-}" == "true" || "${CI:-}" == "true" || "${GITHUB_ACTIONS:-}" == "true") && -d "$CLIENT_DIR" ]]; then
  echo "Building backoffice client assets (pnpm build:release)..."
  # Ensure writable cache/home for corepack/pnpm in sandboxed environments
  CACHE_DIR="$REPO_ROOT/.cache"
  HOME_DIR="$REPO_ROOT/.home"
  mkdir -p "$CACHE_DIR" "$HOME_DIR"
  export XDG_CACHE_HOME="${XDG_CACHE_HOME:-$CACHE_DIR}"
  export HOME="${HOME:-$HOME_DIR}"
  if ! command -v pnpm >/dev/null 2>&1; then
    echo "pnpm not found. Install pnpm 10.17+ and try again." >&2
    exit 1
  fi
  (
    cd "$CLIENT_DIR" \
    && pnpm install --frozen-lockfile --prefer-offline \
    && pnpm run build:release
  )
else
  echo "Skipping client asset build (set ENABLE_CLIENT_BUILD=true or export ENABLE_CLIENT_BUILD=true to enable)"
fi

# Avoid NuGet fallback folders (already disabled in Directory.Build.props, but double-sure)
export RestoreFallbackFolders=

echo "Starting clean and restore process for solution: $SOLUTION_PATH"

# --- 1) Clean problematic asset files (occasionally fixes MSB4018) ---
echo "1. Cleaning up NuGet caches..."
rm -f "$SOLUTION_ROOT/Articulate.Api.Management/obj/project.assets.json" || true
rm -f "$SOLUTION_ROOT/Articulate.StaticAssets/obj/project.assets.json" || true
rm -f "$SOLUTION_ROOT/Articulate.Tests.Website/obj/project.assets.json" || true
rm -f "$SOLUTION_ROOT/Articulate.UnitTests/obj/project.assets.json" || true
rm -f "$SOLUTION_ROOT/Articulate.Web/obj/project.assets.json" || true
rm -f "$SOLUTION_ROOT/Articulate/obj/project.assets.json" || true

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
    "$SOLUTION_ROOT/Articulate.Tests.Website/Articulate.Tests.Website.csproj" >/dev/null
fi

# --- 3) Solution-level restore (slim sln) with static graph + parallelism ---
echo "2. Restoring solution packages in parallel (slim solution)..."
dotnet restore "$TMP_SLN" "${DOTNET_COMMON[@]}" "${MSBUILD_PARALLEL[@]}"

# --- 4) Build both TFMs in parallel to saturate CPUs ---
echo "3. Building solution in parallel for: ${TARGET_FRAMEWORKS[*]}"

build_one_tfm() {
  local tfm="$1"
  echo "[build] -> $tfm"
  local t0=$(date +%s)
  dotnet build "$TMP_SLN" -c Release -f "$tfm" --no-restore "${DOTNET_COMMON[@]}" "${MSBUILD_PARALLEL[@]}"
  local t1=$(date +%s)
  echo "[build] <- $tfm done in $((t1 - t0))s"
}

declare -a pids=()
for tfm in "${TARGET_FRAMEWORKS[@]}"; do
  build_one_tfm "$tfm" & pids+=($!)
done

fail=0
for pid in "${pids[@]}"; do
  if ! wait "$pid"; then fail=1; fi
done
if [[ $fail -ne 0 ]]; then
  echo "One or more TFM builds failed" >&2
  exit 1
fi

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
  "${DOTNET_COMMON[@]}" "${MSBUILD_PARALLEL[@]}" -p:NoPackageAnalysis=true

# Determine the version floor/ceiling for the conditional dependency (based on the freshly packed nupkg)
STATIC_ASSETS_NUPKG=$(ls -t "$RELEASE_FOLDER"/Articulate.StaticAssets.*.nupkg 2>/dev/null | head -n1)
if [[ -z "$STATIC_ASSETS_NUPKG" ]]; then
  echo "Unable to locate Articulate.StaticAssets nupkg under $RELEASE_FOLDER after packing." >&2
  exit 1
fi
STATIC_ASSETS_FILENAME=$(basename "$STATIC_ASSETS_NUPKG")
if [[ "$STATIC_ASSETS_FILENAME" =~ ^Articulate\.StaticAssets\.(.+)\.nupkg$ ]]; then
  STATIC_ASSETS_VERSION_FLOOR_EXACT="${BASH_REMATCH[1]}"
else
  echo "Unexpected Articulate.StaticAssets package name: $STATIC_ASSETS_FILENAME" >&2
  exit 1
fi
if [[ "$STATIC_ASSETS_VERSION_FLOOR_EXACT" =~ ^([0-9]+) ]]; then
  STATIC_ASSETS_MAJOR="${BASH_REMATCH[1]}"
else
  echo "Unable to parse major version from Articulate.StaticAssets package '$STATIC_ASSETS_FILENAME'" >&2
  exit 1
fi
STATIC_ASSETS_VERSION_CEILING_MAJOR="$((STATIC_ASSETS_MAJOR + 1))"
export Articulate_StaticAssetsVersionFloorExact="$STATIC_ASSETS_VERSION_FLOOR_EXACT"
export Articulate_StaticAssetsVersionCeilingMajor="$STATIC_ASSETS_VERSION_CEILING_MAJOR"

echo "[pack] Restoring Articulate.Web with Articulate.StaticAssets dependency..."
RESTORE_PROPS=(-p:Configuration=Release -p:Articulate_EnableAssetsPackDependency=true)
dotnet restore "$ARTICULATE_WEB_PROJECT" \
  "${DOTNET_COMMON[@]}" "${MSBUILD_PARALLEL[@]}" "${RESTORE_PROPS[@]}"

PACK_PROJECTS=(
  "$ARTICULATE_PROJECT"
  "$ARTICULATE_WEB_PROJECT"
  "$ARTICULATE_API_PROJECT"
)

declare -a pack_pids=()
for proj in "${PACK_PROJECTS[@]}"; do
  echo "[pack] -> $(basename "$proj")"
  EXTRA_PACK_ARGS=()
  RESTORE_SWITCHES=(--no-build --no-restore)
  if [[ "$proj" == "$ARTICULATE_WEB_PROJECT" ]]; then
    EXTRA_PACK_ARGS+=(-p:Articulate_EnableAssetsPackDependency=true)
  fi
  dotnet pack -c Release "$proj" "${RESTORE_SWITCHES[@]}" -o "$RELEASE_FOLDER" \
    "${DOTNET_COMMON[@]}" "${MSBUILD_PARALLEL[@]}" -p:NoPackageAnalysis=true "${EXTRA_PACK_ARGS[@]}" &
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

unset Articulate_StaticAssetsVersionFloorExact
unset Articulate_StaticAssetsVersionCeilingMajor

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
