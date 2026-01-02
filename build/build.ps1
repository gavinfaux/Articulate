# Usage:
#   BUILD_CONFIGURATION=Debug pwsh -NoLogo -File build/build.ps1
#   ENABLE_CLIENT_BUILD=true pwsh -NoLogo -File build/build.ps1
$ScriptStart = Get-Date
$PSScriptFilePath = Get-Item $MyInvocation.MyCommand.Path
$RepoRoot = $PSScriptFilePath.Directory.Parent.FullName
$BuildFolder = Join-Path -Path $RepoRoot -ChildPath "build"
$Configuration = if ([string]::IsNullOrWhiteSpace($env:BUILD_CONFIGURATION)) { "Release" } else { $env:BUILD_CONFIGURATION }
$ReleaseFolder = Join-Path -Path $BuildFolder -ChildPath $Configuration
$SolutionRoot = Join-Path -Path $RepoRoot -ChildPath "src"
$SolutionPath = Join-Path -Path $SolutionRoot -ChildPath "Articulate.sln"
$TargetFrameworks = @("net9.0", "net10.0")
$PSMajorVersion = $PSVersionTable.PSVersion.Major
$SupportsParallel = $PSMajorVersion -ge 7
if (-not $SupportsParallel) {
    Write-Warning "PowerShell $PSMajorVersion detected; ForEach-Object -Parallel isn't available so build + pack will run sequentially."
}

# Ensure dotnet is discoverable when installed under the user profile
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
$env:NUGET_XMLDOC_MODE = "none"
$env:RestoreFallbackFolders = ""

# Compute CPU parallelism for MSBuild
$cpu = [Environment]::ProcessorCount
if ($env:MAXCPU -and ($env:MAXCPU -as [int]) -gt 0) {
    $cpu = [int]$env:MAXCPU
}
$msbuildArgs = @("-m", "-maxcpucount:$cpu", "-p:BuildInParallel=true", "-p:RestoreUseStaticGraphEvaluation=true")
$runningInCi = ($env:CI -eq 'true') -or ($env:GITHUB_ACTIONS -eq 'true')
if ([string]::IsNullOrEmpty($env:ENABLE_CLIENT_BUILD)) {
    $clientBuildValue = if ($runningInCi) { 'true' } else { 'false' }
}
else {
    $clientBuildValue = $env:ENABLE_CLIENT_BUILD
}
$clientBuildProperty = "-p:EnableClientBuild=$clientBuildValue"
$dotnetCommon = @("-v", "minimal")
Write-Host "Using up to $cpu parallel MSBuild nodes"
Write-Host "Build configuration: $Configuration"

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

dotnet --version

# 1) Clean the solution to ensure release/CI builds start from a fresh slate
Write-Host "1. Cleaning solution outputs..."
& dotnet clean $SolutionPath -c $Configuration @dotnetCommon $clientBuildProperty
if (-not $?) { Write-Host "Warning dotnet clean failed" }

# 2) Restore (solution-level)
Write-Host "2. Restoring solution packages in parallel..."
& dotnet restore $SolutionPath @dotnetCommon @msbuildArgs $clientBuildProperty
if (-not $?) { throw "dotnet restore failed" }

# 3) Build TFMs sequentially to ensure net9.0 (client build) runs before net10.0
Write-Host "3. Building solution for: $($TargetFrameworks -join ', ')"
foreach ($tfm in $TargetFrameworks) {
    Write-Host "[build] -> $tfm"
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    & dotnet build $SolutionPath -c $Configuration -f $tfm --no-restore @dotnetCommon @msbuildArgs $clientBuildProperty
    if ($LASTEXITCODE -ne 0) { throw "dotnet build failed for $tfm" }
    $sw.Stop()
    Write-Host "[build] <- $tfm done in $([int]$sw.Elapsed.TotalSeconds)s"
}

# 4) Pack primary projects
Write-Host "4. Packing projects..."
$articulateProject = (Join-Path $SolutionRoot 'Articulate/Articulate.csproj')
$articulateWebProject = (Join-Path $SolutionRoot 'Articulate.Web/Articulate.Web.csproj')
$articulateApiProject = (Join-Path $SolutionRoot 'Articulate.Api.Management/Articulate.Api.Management.csproj')
$articulateBackOfficeUIProject = (Join-Path $SolutionRoot 'Articulate.BackOffice.UI/Articulate.BackOffice.UI.csproj')
$projectsToPack = @(
    $articulateBackOfficeUIProject,
    $articulateProject,
    $articulateWebProject,
    $articulateApiProject
)
$packThrottle = 1
if ($SupportsParallel) {
    $projectsToPack | ForEach-Object -Parallel {
        $project = $PSItem
        Write-Host "[pack] -> $([IO.Path]::GetFileName($project))"
        $restoreArgs = @("--no-restore")
        $commonArgs = $using:dotnetCommon
        $clientBuildSwitch = $using:clientBuildProperty
        & dotnet pack -c $using:Configuration $project @restoreArgs -o $using:ReleaseFolder @commonArgs "-p:BuildInParallel=false" $clientBuildSwitch
        if ($LASTEXITCODE -ne 0) { throw "dotnet pack failed for $project" }
    } -ThrottleLimit $packThrottle -ErrorVariable packErrors
    if ($packErrors) { throw "One or more pack operations failed: $($packErrors | Out-String)" }
}
else {
    foreach ($project in $projectsToPack) {
        Write-Host "[pack] -> $([IO.Path]::GetFileName($project))"
        & dotnet pack -c $Configuration $project --no-restore -o $ReleaseFolder @dotnetCommon "-p:BuildInParallel=false" $clientBuildProperty
        if ($LASTEXITCODE -ne 0) { throw "dotnet pack failed for $project" }
    }
}
$TotalSeconds = (Get-Date) - $ScriptStart
Write-Host ("Build pipeline completed in {0:N1}s. Packages available at {1}" -f $TotalSeconds.TotalSeconds, $ReleaseFolder)
