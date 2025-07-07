param(
    [switch]$c,  # Build with copy
    [switch]$r,  # Release build
    [switch]$h   # Show help
)

if ($h -or $args -contains "-?" -or $args -contains "/?") {
@"
USAGE:
    .\build.ps1 [-c] [-r] [-h]

OPTIONS:
    -c    Build with copy
    -r    Build for release
    -h    Show this help

EXAMPLES:
    .\build.ps1       # Normal build
    .\build.ps1 -c    # Build with copy
    .\build.ps1 -r    # Release build
"@
    exit 0
}

# Set build commands
$buildCmd = if ($r) { "npm run build:release" } elseif ($c) { "npm run build:copy" } else { "npm run build" }

# Save current location
$originalLocation = Get-Location

try {
    # Build BackOffice
    Write-Host "`n[1/2] Building BackOffice" -ForegroundColor Cyan
    Write-Host "Running: $buildCmd in BackOffice" -ForegroundColor DarkGray
    Set-Location "$PSScriptRoot\BackOffice"
    Invoke-Expression $buildCmd
    if ($LASTEXITCODE -ne 0) { throw "BackOffice build failed" }

    # Build MarkdownEditor
    Write-Host "`n[2/2] Building MarkdownEditor" -ForegroundColor Cyan
    Write-Host "Running: $buildCmd in MarkdownEditor" -ForegroundColor DarkGray
    Set-Location "$PSScriptRoot\MarkdownEditor"
    Invoke-Expression $buildCmd
    if ($LASTEXITCODE -ne 0) { throw "MarkdownEditor build failed" }

    Write-Host "`n✅ Build completed successfully!" -ForegroundColor Green
}
catch {
    Write-Host "`n❌ Error: $_" -ForegroundColor Red
    exit 1
}
finally {
    Set-Location $originalLocation
}