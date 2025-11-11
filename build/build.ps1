$ScriptStart = Get-Date
$PSScriptFilePath = Get-Item $MyInvocation.MyCommand.Path
$RepoRoot = $PSScriptFilePath.Directory.Parent.FullName
$BuildFolder = Join-Path -Path $RepoRoot -ChildPath "build"
$ReleaseFolder = Join-Path -Path $BuildFolder -ChildPath "Release"
$TmpFolder = Join-Path -Path $BuildFolder -ChildPath "tmp"
$SolutionRoot = Join-Path -Path $RepoRoot -ChildPath "src"
$SolutionPath = Join-Path -Path $SolutionRoot -ChildPath "Articulate.sln"
$TargetFrameworks = @("net9.0", "net10.0")
$TestProjects = @("Articulate.UnitTests/Articulate.UnitTests.csproj")

# Performance-friendly env
$env:DOTNET_CLI_TELEMETRY_OPTOUT = "1"
$env:DOTNET_SKIP_FIRST_TIME_EXPERIENCE = "1"
$env:DOTNET_NOLOGO = "1"
$env:NUGET_XMLDOC_MODE = "skip"
$env:RestoreFallbackFolders = ""

# Compute CPU parallelism for MSBuild
$cpu = [Environment]::ProcessorCount
if ($env:MAXCPU -and ($env:MAXCPU -as [int]) -gt 0) {
    $cpu = [int]$env:MAXCPU
}
$msbuildArgs = @("-m", "-maxcpucount:$cpu", "-p:BuildInParallel=true", "-p:RestoreUseStaticGraphEvaluation=true")
$dotnetCommon = @("-v", "minimal")

Write-Host "Using up to $cpu parallel MSBuild nodes"

# Friendly note if running on Windows against a WSL filesystem (\\wsl$ UNC)
if ($RepoRoot.StartsWith("\\\\wsl$", [System.StringComparison]::OrdinalIgnoreCase) -or 
    $RepoRoot.StartsWith("\\\\wsl.localhost\\", [System.StringComparison]::OrdinalIgnoreCase)) {
    Write-Warning "Windows->WSL performance tip: Repo is under '$RepoRoot'. Builds run faster inside the WSL distro. Prefer running bash build/build.sh from WSL ext4."
}

if (Test-Path $ReleaseFolder) {
    Write-Warning "$ReleaseFolder already exists on your local machine. It will now be deleted."
    Remove-Item $ReleaseFolder -Recurse -Force
}
New-Item -ItemType Directory -Force -Path $ReleaseFolder | Out-Null
New-Item -ItemType Directory -Force -Path $TmpFolder | Out-Null

dotnet --version

# Optionally build backoffice client assets (can be skipped via SKIP_CLIENT_BUILD=1)
$ClientDir = Join-Path -Path $SolutionRoot -ChildPath "Articulate.Api.Management/Client"
# Enable client build explicitly or when running in CI (GitHub Actions or CI=true)
$EnableClientBuild = $false
$clientBuildRan = $false
if ($env:ENABLE_CLIENT_BUILD) {
    $EnableClientBuild = 'true'.Equals($env:ENABLE_CLIENT_BUILD, [System.StringComparison]::OrdinalIgnoreCase)
}
elseif ($env:GITHUB_ACTIONS -eq 'true' -or $env:CI -eq 'true') { $EnableClientBuild = $true }
if ($EnableClientBuild -and (Test-Path $ClientDir)) {
    if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) { throw "pnpm not found. Install pnpm 10.17+ and try again." }
    Push-Location $ClientDir
    & pnpm install
    if (-not $?) { throw "pnpm install failed" }
    & pnpm run build:release
    if (-not $?) { throw "pnpm build:release failed" }
    Pop-Location
    $clientBuildRan = $true
} else {
    Write-Host "Skipping client asset build (set ENABLE_CLIENT_BUILD=true or `$env:ENABLE_CLIENT_BUILD = 'true') to enable."
}
if ($clientBuildRan -and (Get-Command git -ErrorAction SilentlyContinue)) {
    & git checkout -- `
        "src/Articulate.Api.Management/Client/package.json" `
        "src/Articulate.Api.Management/Client/public/umbraco-package.json" `
        "src/Articulate.StaticAssets/wwwroot/App_Plugins/Articulate/umbraco-package.json" | Out-Null
}

Write-Host "Starting clean and restore process for solution: $SolutionPath"

# 1) Clean problematic project.assets.json files (occasionally fixes MSB4018)
Write-Host "1. Cleaning up NuGet caches..."
@(
    "Articulate.Api.Management",
    "Articulate.StaticAssets",
    "Articulate.Tests.Website",
    "Articulate.UnitTests",
    "Articulate.Web",
    "Articulate"
) | ForEach-Object {
    $p = Join-Path $SolutionRoot -ChildPath "$_/obj/project.assets.json"
    if (Test-Path $p) { Remove-Item $p -Force -ErrorAction SilentlyContinue }
}

# 2) Create a slim solution excluding demo projects that depend on local packages (u15/u16/u17)
$tmpSln = Join-Path $TmpFolder -ChildPath "Articulate.Packable.sln"
if (-not (Test-Path $tmpSln)) {
    & dotnet new sln -n Articulate.Packable -o $TmpFolder | Out-Null
    & dotnet sln $tmpSln add `
        (Join-Path $SolutionRoot 'Articulate/Articulate.csproj') `
        (Join-Path $SolutionRoot 'Articulate.Web/Articulate.Web.csproj') `
        (Join-Path $SolutionRoot 'Articulate.Api.Management/Articulate.Api.Management.csproj') `
        (Join-Path $SolutionRoot 'Articulate.StaticAssets/Articulate.StaticAssets.csproj') `
        (Join-Path $SolutionRoot 'Articulate.Tests.Website/Articulate.Tests.Website.csproj') | Out-Null
}

# 3) Restore (solution-level) with static graph + parallelism
Write-Host "2. Restoring solution packages in parallel (slim solution)..."
& dotnet restore $tmpSln @dotnetCommon @msbuildArgs
if (-not $?) { throw "dotnet restore failed" }

# 4) Build TFMs (sequential but highly parallel within MSBuild)
Write-Host "3. Building solution for: $($TargetFrameworks -join ', ')"
foreach ($tfm in $TargetFrameworks) {
    Write-Host "[build] -> $tfm"
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    & dotnet build $tmpSln -c Release -f $tfm --no-restore @dotnetCommon @msbuildArgs
    if ($LASTEXITCODE -ne 0) { throw "dotnet build failed for $tfm" }
    $sw.Stop()
    Write-Host "[build] <- $tfm done in $([int]$sw.Elapsed.TotalSeconds)s"
}

# 5) Pack primary projects (sequential)
Write-Host "4. Packing projects..."
$articulateProject = (Join-Path $SolutionRoot 'Articulate/Articulate.csproj')
$articulateWebProject = (Join-Path $SolutionRoot 'Articulate.Web/Articulate.Web.csproj')
$articulateApiProject = (Join-Path $SolutionRoot 'Articulate.Api.Management/Articulate.Api.Management.csproj')
$articulateStaticAssetsProject = (Join-Path $SolutionRoot 'Articulate.StaticAssets/Articulate.StaticAssets.csproj')

# Pack StaticAssets first so the local feed has the dependency before restoring Articulate.Web
Write-Host "[pack] -> $([IO.Path]::GetFileName($articulateStaticAssetsProject))"
& dotnet pack -c Release $articulateStaticAssetsProject --no-build --no-restore -o $ReleaseFolder @dotnetCommon @msbuildArgs -p:NoPackageAnalysis=true
if ($LASTEXITCODE -ne 0) { throw "dotnet pack failed for $articulateStaticAssetsProject" }

# Derive a major-version range for the static assets dependency using the freshly packed nupkg
$staticAssetsVersionFloorExact = $null
$staticAssetsVersionCeilingMajor = $null
$staticAssetsPackage = Get-ChildItem -Path $ReleaseFolder -Filter 'Articulate.StaticAssets.*.nupkg' | Sort-Object LastWriteTime -Descending | Select-Object -First 1
if ($null -eq $staticAssetsPackage) { throw "Unable to locate Articulate.StaticAssets nupkg in $ReleaseFolder after packing." }
if ($staticAssetsPackage.BaseName -notmatch '^Articulate\.StaticAssets\.(?<version>.+)$') { throw "Unexpected Articulate.StaticAssets package name: $($staticAssetsPackage.Name)" }
$staticAssetsVersionFloorExact = $Matches.version
$staticAssetsMajorMatch = [System.Text.RegularExpressions.Regex]::Match($staticAssetsVersionFloorExact, '^\d+')
if (-not $staticAssetsMajorMatch.Success) { throw "Unable to parse major version from Articulate.StaticAssets package '$($staticAssetsPackage.Name)'" }
$staticAssetsMajor = [int]$staticAssetsMajorMatch.Value
$staticAssetsVersionCeilingMajor = $staticAssetsMajor + 1

# Surface dependency bounds via environment variables to avoid CLI quoting issues
if ($staticAssetsVersionFloorExact) { $env:Articulate_StaticAssetsVersionFloorExact = $staticAssetsVersionFloorExact }
if ($staticAssetsVersionCeilingMajor) { $env:Articulate_StaticAssetsVersionCeilingMajor = $staticAssetsVersionCeilingMajor }

# Refresh Articulate.Web restore graph with the conditional dependency enabled (now that the nupkg exists)
$articulateWebRestoreProps = @("-p:Configuration=Release", "-p:Articulate_EnableAssetsPackDependency=true")
Write-Host "[pack] Restoring Articulate.Web with Articulate.StaticAssets dependency..."
& dotnet restore $articulateWebProject @dotnetCommon @msbuildArgs @articulateWebRestoreProps
if ($LASTEXITCODE -ne 0) { throw "dotnet restore failed for $articulateWebProject with Articulate.StaticAssets dependency" }

$projectsToPack = @(
    $articulateProject,
    $articulateWebProject,
    $articulateApiProject
)
foreach ($project in $projectsToPack) {
    Write-Host "[pack] -> $([IO.Path]::GetFileName($project))"
    $packArgs = @()
    $restoreArgs = @("--no-build", "--no-restore")
    # Enable transitive dependency on Articulate.StaticAssets only when packing Articulate (RCL)
    if ($project -eq $articulateWebProject) {
        $packArgs += "-p:Articulate_EnableAssetsPackDependency=true"
    }
    & dotnet pack -c Release $project @restoreArgs -o $ReleaseFolder @dotnetCommon @msbuildArgs -p:NoPackageAnalysis=true @packArgs
    if ($LASTEXITCODE -ne 0) { throw "dotnet pack failed for $project" }
}

# Clean up env overrides for downstream commands/sessions
Remove-Item Env:Articulate_StaticAssetsVersionFloorExact -ErrorAction SilentlyContinue | Out-Null
Remove-Item Env:Articulate_StaticAssetsVersionCeilingMajor -ErrorAction SilentlyContinue | Out-Null

$skipGitLeaks = $env:SKIP_GITLEAKS -eq '1'
$runningInCi = ($env:CI -eq 'true') -or ($env:GITHUB_ACTIONS -eq 'true')
if ($runningInCi)
{
    Write-Host "Skipping GitLeaks scan (handled by CI workflow action)."
}
elseif ($skipGitLeaks)
{
    Write-Host "Skipping GitLeaks scan (SKIP_GITLEAKS=1)."
}
elseif (Get-Command gitleaks -ErrorAction SilentlyContinue)
{
    Write-Host "Running GitLeaks scan..."
    $gitLeaksArgs = @("detect", "--source", $RepoRoot, "--redact", "--no-banner")
    $baselinePath = Join-Path $RepoRoot ".gitleaks.baseline"
    if (Test-Path $baselinePath)
    {
        $gitLeaksArgs += @("--baseline-path", $baselinePath)
    }
    & gitleaks @gitLeaksArgs
    if ($LASTEXITCODE -ne 0)
    {
        throw "GitLeaks detected sensitive content."
    }
}
else
{
    Write-Host "Skipping GitLeaks scan (gitleaks CLI not found on PATH)."
}

$TotalSeconds = (Get-Date) - $ScriptStart
Write-Host ("Build pipeline completed in {0:N1}s. Packages available at {1}" -f $TotalSeconds.TotalSeconds, $ReleaseFolder)
