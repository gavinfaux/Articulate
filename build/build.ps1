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
$PSMajorVersion = $PSVersionTable.PSVersion.Major
$SupportsParallel = $PSMajorVersion -ge 7
if (-not $SupportsParallel)
{
    Write-Warning "PowerShell $PSMajorVersion detected; ForEach-Object -Parallel isn't available so build + pack will run sequentially."
}

# Ensure dotnet is discoverable when installed under the user profile (parity with build.sh)
if (-not (Get-Command dotnet -ErrorAction SilentlyContinue)) {
    $userProfile = if ($HOME) { $HOME } else { $env:USERPROFILE }
    if ($userProfile) {
        $userDotnet = Join-Path $userProfile ".dotnet"
        $dotnetExe = Join-Path $userDotnet "dotnet.exe"
        if (Test-Path $dotnetExe) {
            $env:PATH = "$env:PATH;$userDotnet;$userDotnet\tools"
        }
    }
}

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
$runningInCi = ($env:CI -eq 'true') -or ($env:GITHUB_ACTIONS -eq 'true')
if ([string]::IsNullOrEmpty($env:ENABLE_CLIENT_BUILD))
{
    $clientBuildValue = if ($runningInCi) { 'true' } else { 'false' }
}
else
{
    $clientBuildValue = $env:ENABLE_CLIENT_BUILD
}
$clientBuildProperty = "-p:EnableClientBuild=$clientBuildValue"
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

Write-Host "Starting clean and restore process for solution: $SolutionPath"

# 0) Clean the solution to ensure release/CI builds start from a fresh slate
Write-Host "1. Cleaning solution outputs..."
& dotnet clean $SolutionPath -c Release @dotnetCommon $clientBuildProperty
if (-not $?) { throw "dotnet clean failed" }

# 2) Create a slim solution excluding demo projects that depend on local packages (u15/u16/u17)
$tmpSln = Join-Path $TmpFolder -ChildPath "Articulate.Packable.sln"
if (-not (Test-Path $tmpSln)) {
    & dotnet new sln -n Articulate.Packable -o $TmpFolder | Out-Null
    & dotnet sln $tmpSln add `
        (Join-Path $SolutionRoot 'Articulate/Articulate.csproj') `
        (Join-Path $SolutionRoot 'Articulate.Web/Articulate.Web.csproj') `
        (Join-Path $SolutionRoot 'Articulate.Api.Management/Articulate.Api.Management.csproj') `
        (Join-Path $SolutionRoot 'Articulate.StaticAssets/Articulate.StaticAssets.csproj') | Out-Null
}

# 3) Restore (solution-level) with static graph + parallelism
Write-Host "2. Restoring solution packages in parallel (slim solution)..."
& dotnet restore $tmpSln @dotnetCommon @msbuildArgs $clientBuildProperty
if (-not $?) { throw "dotnet restore failed" }

# 4) Build TFMs sequentially to ensure net9.0 (client build) runs before net10.0
Write-Host "3. Building solution for: $($TargetFrameworks -join ', ')"
foreach ($tfm in $TargetFrameworks)
{
    Write-Host "[build] -> $tfm"
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    & dotnet build $tmpSln -c Release -f $tfm --no-restore @dotnetCommon @msbuildArgs $clientBuildProperty
    if ($LASTEXITCODE -ne 0) { throw "dotnet build failed for $tfm" }
    $sw.Stop()
    Write-Host "[build] <- $tfm done in $([int]$sw.Elapsed.TotalSeconds)s"
}

# 5) Pack primary projects (parallel where safe)
Write-Host "4. Packing projects..."
$articulateProject = (Join-Path $SolutionRoot 'Articulate/Articulate.csproj')
$articulateWebProject = (Join-Path $SolutionRoot 'Articulate.Web/Articulate.Web.csproj')
$articulateApiProject = (Join-Path $SolutionRoot 'Articulate.Api.Management/Articulate.Api.Management.csproj')
$articulateStaticAssetsProject = (Join-Path $SolutionRoot 'Articulate.StaticAssets/Articulate.StaticAssets.csproj')

# Pack StaticAssets first so the local feed has the dependency before restoring Articulate.Web
Write-Host "[pack] -> $([IO.Path]::GetFileName($articulateStaticAssetsProject))"
& dotnet pack -c Release $articulateStaticAssetsProject --no-build --no-restore -o $ReleaseFolder @dotnetCommon @msbuildArgs -p:NoPackageAnalysis=true
if ($LASTEXITCODE -ne 0) { throw "dotnet pack failed for $articulateStaticAssetsProject" }

$projectsToPack = @(
    $articulateProject,
    $articulateWebProject,
    $articulateApiProject
)
$packThrottle = [Math]::Max(1, [Math]::Min($cpu, $projectsToPack.Count))
if ($SupportsParallel)
{
    $projectsToPack | ForEach-Object -Parallel {
        $project = $PSItem
        Write-Host "[pack] -> $([IO.Path]::GetFileName($project))"
        $restoreArgs = @("--no-build", "--no-restore")
        $commonArgs = $using:dotnetCommon
        $parallelMsbuildArgs = $using:msbuildArgs
        & dotnet pack -c Release $project @restoreArgs -o $using:ReleaseFolder @commonArgs @parallelMsbuildArgs -p:NoPackageAnalysis=true $using:clientBuildProperty
        if ($LASTEXITCODE -ne 0) { throw "dotnet pack failed for $project" }
    } -ThrottleLimit $packThrottle
}
else
{
    foreach ($project in $projectsToPack)
    {
        Write-Host "[pack] -> $([IO.Path]::GetFileName($project))"
        & dotnet pack -c Release $project --no-build --no-restore -o $ReleaseFolder @dotnetCommon @msbuildArgs -p:NoPackageAnalysis=true $clientBuildProperty
        if ($LASTEXITCODE -ne 0) { throw "dotnet pack failed for $project" }
    }
}

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
