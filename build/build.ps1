$ScriptStart = Get-Date
$PSScriptFilePath = Get-Item $MyInvocation.MyCommand.Path
$RepoRoot = $PSScriptFilePath.Directory.Parent.FullName
$BuildFolder = Join-Path -Path $RepoRoot -ChildPath "build"
$ReleaseFolder = Join-Path -Path $BuildFolder -ChildPath "Release"
$SolutionRoot = Join-Path -Path $RepoRoot -ChildPath "src"
$SolutionPath = Join-Path -Path $SolutionRoot -ChildPath "Articulate.sln"
$ProjectBuildOrder = @(
    "Articulate/Articulate.csproj",
    "Articulate.Api.Management/Articulate.Api.Management.csproj",
    "Articulate.Web/Articulate.Web.csproj"
)
$TargetFrameworks = @("net9.0", "net10.0")

if (Test-Path $ReleaseFolder) {
    Write-Warning "$ReleaseFolder already exists on your local machine. It will now be deleted."
    Remove-Item $ReleaseFolder -Recurse -Force
}

dotnet --version

Write-Host "Restoring solution packages..."
& dotnet restore $SolutionPath
if (-not $?) {
    throw "dotnet restore failed"
}

foreach ($tfm in $TargetFrameworks) {
    Write-Host "Building solution for $tfm..."
    & dotnet build $SolutionPath --configuration Release --no-restore -f $tfm
    if (-not $?) {
        throw "dotnet build failed for $tfm"
    }
}

Write-Host "Packing solution..."
& dotnet pack $SolutionPath --configuration Release --no-build --no-restore --output $ReleaseFolder
if (-not $?) {
    throw "dotnet pack failed"
}

$TotalSeconds = (Get-Date) - $ScriptStart
Write-Host ("Build pipeline completed in {0:N1}s. Packages available at {1}" -f $TotalSeconds.TotalSeconds, $ReleaseFolder)
