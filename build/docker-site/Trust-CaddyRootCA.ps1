[CmdletBinding()]
param(
    [ValidateSet('CurrentUser','LocalMachine')]
    [string]$Scope = 'CurrentUser',

    [string]$ComposeProjectDir = (Resolve-Path (Join-Path $PSScriptRoot '..' '..')).Path,

    [string]$OutputPath = (Join-Path $PSScriptRoot 'caddy-local-root.crt')
)

$ErrorActionPreference = 'Stop'

function Assert-Command {
    param([Parameter(Mandatory = $true)][string]$Name)

    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        throw "Required command not found on PATH: $Name"
    }
}

function Get-CaddyContainerId {
    param([string]$ProjectDir)

    Push-Location $ProjectDir
    try {
        $cid = (docker compose ps -q caddy) 2>$null
        if (-not $cid) {
            throw "Could not find a running 'caddy' container. Run 'docker compose up -d' first."
        }
        return $cid.Trim()
    }
    finally {
        Pop-Location
    }
}

function Copy-RootCAFromContainer {
    param(
        [string]$ContainerId,
        [string]$DestPath
    )

    $tmp = '/tmp/caddy-local-root.crt'

    $paths = @(
        '/data/caddy/pki/authorities/local/root.crt',
        '/data/pki/authorities/local/root.crt'
    )

    $probe = "for f in $($paths -join ' '); do [ -f \"$f\" ] && echo \"$f\" && exit 0; done; exit 1"
    $source = (docker exec $ContainerId sh -lc $probe) 2>$null
    if (-not $source) {
        throw "Could not locate Caddy root CA in container. Tried: $($paths -join ', ')"
    }

    docker exec $ContainerId sh -lc "cp '$source' '$tmp'" | Out-Null

    $destDir = Split-Path -Parent $DestPath
    if ($destDir -and -not (Test-Path $destDir)) {
        New-Item -ItemType Directory -Path $destDir -Force | Out-Null
    }

    docker cp "${ContainerId}:$tmp" "$DestPath"
}

function Import-RootCA {
    param(
        [string]$CertPath,
        [string]$Scope
    )

    if (-not (Test-Path $CertPath)) {
        throw "Certificate file not found: $CertPath"
    }

    $storePath = if ($Scope -eq 'LocalMachine') {
        'Cert:\LocalMachine\Root'
    } else {
        'Cert:\CurrentUser\Root'
    }

    Import-Certificate -FilePath $CertPath -CertStoreLocation $storePath | Out-Null
}

Write-Host "Project dir: $ComposeProjectDir"
Write-Host "Output:      $OutputPath"
Write-Host "Scope:       $Scope"

Assert-Command docker

$cid = Get-CaddyContainerId -ProjectDir $ComposeProjectDir
Write-Host "Caddy container: $cid"

Copy-RootCAFromContainer -ContainerId $cid -DestPath $OutputPath
Write-Host "Exported root CA to: $OutputPath"

Import-RootCA -CertPath $OutputPath -Scope $Scope
Write-Host "Imported root CA into: $Scope Trusted Root Certification Authorities"

Write-Host "Restart your browser and open https://localhost:18443"
