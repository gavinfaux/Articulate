# NOTE: Script does not respect global.json in src directory, global.json in build folder does (as would moving to solution root?)

$PSScriptFilePath = Get-Item $MyInvocation.MyCommand.Path
$RepoRoot = $PSScriptFilePath.Directory.Parent.FullName
$BuildFolder = Join-Path -Path $RepoRoot -ChildPath "build"
$WebProjFolder = Join-Path -Path $RepoRoot -ChildPath "src\Articulate.Web"
$ReleaseFolder = Join-Path -Path $BuildFolder -ChildPath "Release"
$SolutionRoot = Join-Path -Path $RepoRoot "src"
$CodeProjFolder = Join-Path -Path $RepoRoot -ChildPath "src\Articulate"
$CodeCSProj = Join-Path -Path $CodeProjFolder -ChildPath "Articulate.csproj"

if ((Get-Item $ReleaseFolder -ErrorAction SilentlyContinue) -ne $null)
{
	Write-Warning "$ReleaseFolder already exists on your local machine. It will now be deleted."
	Remove-Item $ReleaseFolder -Recurse
}

####### DO THE PROJECT BUILD PART #############

# Get the solution path
$SolutionPath = Join-Path -Path $SolutionRoot -ChildPath "Articulate.sln"

# Build the solution in release mode

# Restore packages
Write-Host "Restoring nuget packages..."
& dotnet restore $SolutionPath
#& dotnet restore $CodeCSProj
if (-not $?) {
    throw "The dotnet restore process returned an error code."
}

# Clean solution
Write-Host "Cleaning solution..."
& dotnet clean $SolutionPath --configuration Release
#& dotnet clean $CodeCSProj --configuration Release
if (-not $?) {
    throw "The dotnet clean process returned an error code."
}

# Build solution
#Write-Host "Executing dotnet build with PackageOutputPath: $($ReleaseFolder)"
# triggers InnerBuild but nupkg contains content/contentFiles instead of staticwebassets and build props
& dotnet build $SolutionPath --configuration Release --no-restore --bl:fail.binlog
# same as pack, nupkg is missing staticwebassets and build props
#& dotnet build $CodeCSProj --configuration Release --no-restore --bl:fail.binlog

if (-not $?) {
    throw "The dotnet build process returned an error code."
}

# dotnet pack
#Write-Host "Packing Articulate..."
# nupkg is missing staticwebassets and build props
& dotnet pack $SolutionPath --output $ReleaseFolder --configuration Release --bl:fail.binlog

if (-not $?) {
    throw "The dotnet pack process returned an error code."
}