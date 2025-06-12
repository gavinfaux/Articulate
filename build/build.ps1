$PSScriptFilePath = Get-Item $MyInvocation.MyCommand.Path
$RepoRoot = $PSScriptFilePath.Directory.Parent.FullName
$BuildFolder = Join-Path -Path $RepoRoot -ChildPath "build"
$WebProjFolder = Join-Path -Path $RepoRoot -ChildPath "src\Articulate.Web"
$ReleaseFolder = Join-Path -Path $BuildFolder -ChildPath "Release"
$SolutionRoot = Join-Path -Path $RepoRoot "src"
$CodeProjFolder = Join-Path -Path $RepoRoot -ChildPath "src\Articulate"
$CodeCSProj = Join-Path -Path $CodeProjFolder -ChildPath "Articulate.csproj"

# Go get nuget.exe if we don't have it (optional, only needed if you use nuget.exe directly)
# $NuGet = "$BuildFolder\nuget.exe"
# $FileExists = Test-Path $NuGet 
# If ($FileExists -eq $False) {
#     Write-Host "Retrieving nuget.exe..."
#     $SourceNugetExe = "https://dist.nuget.org/win-x86-commandline/latest/nuget.exe"
#     Invoke-WebRequest $SourceNugetExe -OutFile $NuGet
# }

if ((Get-Item $ReleaseFolder -ErrorAction SilentlyContinue) -ne $null)
{
    Write-Warning "$ReleaseFolder already exists on your local machine. It will now be deleted."
    Remove-Item $ReleaseFolder -Recurse
}

####### DO THE SLN BUILD PART #############

# Build the solution in release mode
$SolutionPath = Join-Path -Path $SolutionRoot -ChildPath "Articulate.sln"

# Restore packages
Write-Host "Restoring nuget packages..."
dotnet restore $SolutionPath

# Clean solution
dotnet clean $SolutionPath --configuration Release
if (-not $?) {
    throw "The dotnet clean process returned an error code."
}

# Build solution
dotnet build $SolutionPath --configuration Release --no-restore
if (-not $?) {
    throw "The dotnet build process returned an error code."
}

# dotnet pack (As its a SDK style project, nuget pack was not reading info stored in csproj)
dotnet pack $CodeCSProj --output $ReleaseFolder --configuration Release