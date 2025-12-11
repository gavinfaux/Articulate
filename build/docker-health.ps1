param(
  [string]$ComposeFile,
  [string]$Service,
  [string]$Port = '8080',
  [string]$CheckPath = $env:CHECK_PATH
)

$path = if ([string]::IsNullOrWhiteSpace($CheckPath)) { '/' } else { $CheckPath }
if (-not $path.StartsWith('/')) { $path = '/' + $path }

$curlTarget = "http://localhost:$Port$path"
$containerId = (& docker compose -f $ComposeFile ps -q $Service).Trim()
if (-not $containerId) {
  throw "Service '$Service' is not running (no container found)."
}

$dockerArgs = @('compose', '-f', $ComposeFile, 'exec', '-T', $Service, 'curl', '-fsS', '-o', '/dev/null', '-w', '%{http_code}', $curlTarget)

try {
  $code = & docker @dockerArgs
}
catch {
  throw "Failed to fetch '$curlTarget': $($_.Exception.Message)"
}

Write-Host "HTTP code: $code"
