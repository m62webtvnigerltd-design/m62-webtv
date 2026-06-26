$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendPath = Join-Path $projectRoot 'backend'

if (-not (Test-Path $backendPath)) {
    throw "Backend folder not found at $backendPath"
}

$mongoService = Get-Service -Name 'MongoDB' -ErrorAction SilentlyContinue

if ($null -eq $mongoService) {
    throw 'MongoDB Windows service is not installed. Install MongoDB Server first.'
}

if ($mongoService.Status -ne 'Running') {
    Start-Service -Name 'MongoDB'
    $mongoService.WaitForStatus('Running', [TimeSpan]::FromSeconds(30))
}

Write-Host 'MongoDB service is running.' -ForegroundColor Green
Write-Host "Starting backend from $backendPath" -ForegroundColor Green

Start-Process powershell -ArgumentList @(
    '-NoExit',
    '-Command',
    "Set-Location '$backendPath'; npm.cmd start"
)

Write-Host 'Backend launched in a new PowerShell window.' -ForegroundColor Green