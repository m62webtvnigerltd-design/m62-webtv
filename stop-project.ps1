$ErrorActionPreference = 'Stop'

$backendConnection = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1

if ($backendConnection) {
    Stop-Process -Id $backendConnection.OwningProcess -Force
    Write-Host "Stopped backend process on port 3000 (PID $($backendConnection.OwningProcess))." -ForegroundColor Yellow
} else {
    Write-Host 'No backend process is currently listening on port 3000.' -ForegroundColor DarkYellow
}

$mongoService = Get-Service -Name 'MongoDB' -ErrorAction SilentlyContinue

if ($null -eq $mongoService) {
    Write-Host 'MongoDB Windows service is not installed.' -ForegroundColor Red
    exit 0
}

if ($mongoService.Status -eq 'Running') {
    Stop-Service -Name 'MongoDB'
    $mongoService.WaitForStatus('Stopped', [TimeSpan]::FromSeconds(30))
    Write-Host 'MongoDB service stopped.' -ForegroundColor Yellow
} else {
    Write-Host 'MongoDB service is already stopped.' -ForegroundColor DarkYellow
}
