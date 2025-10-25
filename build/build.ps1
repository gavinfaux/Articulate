$PSScriptFilePath = Get-Item $MyInvocation.MyCommand.Path
$RepoRoot = $PSScriptFilePath.Directory.Parent.FullName
$BuildFolder = Join-Path -Path $RepoRoot -ChildPath "build"
$ReleaseFolder = Join-Path -Path $BuildFolder -ChildPath "Release"
$SolutionRoot = Join-Path -Path $RepoRoot -ChildPath "src"
$SolutionPath = Join-Path -Path $SolutionRoot -ChildPath "Articulate.sln"

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

Write-Host "Cleaning solution..."
& dotnet clean $SolutionPath --configuration Release
if (-not $?) {
    throw "dotnet clean failed"
}

Write-Host "Building solution..."
& dotnet build $SolutionPath --configuration Release --no-restore
if (-not $?) {
    throw "dotnet build failed"
}

Write-Host "Packing solution..."
& dotnet pack $SolutionPath --configuration Release --no-build --output $ReleaseFolder
if (-not $?) {
    throw "dotnet pack failed"
}

Write-Host "Build pipeline completed. Packages available at $ReleaseFolder"
