$ErrorActionPreference = 'Stop'

$mongoService = Get-Service -Name 'MongoDB' -ErrorAction SilentlyContinue
$backendConnection = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1

if ($null -eq $mongoService) {
    Write-Host 'MongoDB service: not installed' -ForegroundColor Red
} else {
    Write-Host ("MongoDB service: {0} ({1})" -f $mongoService.Status, $mongoService.StartType) -ForegroundColor Green
}

if ($backendConnection) {
    Write-Host ("Backend API: running on port 3000 (PID {0})" -f $backendConnection.OwningProcess) -ForegroundColor Green
} else {
    Write-Host 'Backend API: not running on port 3000' -ForegroundColor Yellow
}

try {
    $health = Invoke-RestMethod -Uri 'http://localhost:3000/api/health' -Method Get -TimeoutSec 5
    Write-Host ("Health check: {0}" -f $health.status) -ForegroundColor Green
} catch {
    Write-Host 'Health check: unavailable' -ForegroundColor Yellow
}
