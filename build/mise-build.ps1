param(
  [string]$Configuration = $env:BUILD_CONFIGURATION
)

$buildPs1 = Join-Path $PSScriptRoot 'build.ps1'
& pwsh -NoLogo -File $buildPs1
exit $LASTEXITCODE
