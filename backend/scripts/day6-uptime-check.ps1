param(
    [string]$ApiBaseUrl = "https://m62-webtv-production.up.railway.app",
    [int]$TimeoutSec = 20
)

$ErrorActionPreference = "Stop"
$healthUrl = "$ApiBaseUrl/api/health"

try {
    $response = Invoke-RestMethod -Uri $healthUrl -Method Get -TimeoutSec $TimeoutSec
    $statusText = ""
    if ($null -ne $response -and $null -ne $response.status) {
        $statusText = [string]$response.status
    }

    if ($statusText -match "OK") {
        Write-Host "PASS uptime check: $healthUrl"
        exit 0
    }

    Write-Host "FAIL uptime check: unexpected response"
    exit 2
}
catch {
    Write-Host "FAIL uptime check: $($_.Exception.Message)"
    exit 1
}
