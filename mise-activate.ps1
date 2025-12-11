# Helper to activate mise in PowerShell with correct parsing and a PS7-first fallback.

$psVersion = $PSVersionTable.PSVersion
Write-Host ("PowerShell version: {0}" -f $psVersion)

# Optional: silence the PS5 chpwd warning; comment out if you prefer to see it.
if (-not $env:MISE_PWSH_CHPWD_WARNING) {
    $env:MISE_PWSH_CHPWD_WARNING = "0"
}

$activation = if ($psVersion.Major -ge 7) {
    try {
        mise activate pwsh
    } catch {
        Write-Error "Failed to activate mise for pwsh: $_"
        exit 1
    }
}
else {
    try {
        mise activate powershell
    } catch {
        Write-Error "Failed to activate mise for powershell: $_"
        exit 1
    }
}

if ($activation) {
    $activation | Out-String | Invoke-Expression
} else {
    Write-Error "mise activation returned empty output"
    exit 1
}
Write-Host "mise activated for this session."
