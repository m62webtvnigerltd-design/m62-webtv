param(
    [string]$MongoUri = $env:MONGODB_URI,
    [string]$DatabaseName = $env:MONGODB_DB_NAME,
    [string]$OutputRoot = "",
    [int]$RetentionDays = 14
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendDir = Split-Path -Parent $scriptDir

if ([string]::IsNullOrWhiteSpace($OutputRoot)) {
    $OutputRoot = Join-Path $backendDir "backups"
}

if (-not (Test-Path $OutputRoot)) {
    New-Item -ItemType Directory -Path $OutputRoot | Out-Null
}

if ([string]::IsNullOrWhiteSpace($MongoUri)) {
    throw "MONGODB_URI is empty. Set it in environment or pass -MongoUri."
}

$mongodump = Get-Command mongodump -ErrorAction SilentlyContinue
if (-not $mongodump) {
    throw "mongodump was not found in PATH. Install MongoDB Database Tools and retry."
}

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$targetDir = Join-Path $OutputRoot "dump_$timestamp"
New-Item -ItemType Directory -Path $targetDir | Out-Null

$archivePath = Join-Path $OutputRoot "mongodb_backup_$timestamp.gz"

$args = @(
    "--uri=$MongoUri",
    "--gzip",
    "--archive=$archivePath"
)

if (-not [string]::IsNullOrWhiteSpace($DatabaseName)) {
    $args += "--db=$DatabaseName"
}

& $mongodump.Source $args
if ($LASTEXITCODE -ne 0) {
    throw "mongodump failed with exit code $LASTEXITCODE"
}

Get-ChildItem -Path $OutputRoot -Filter "mongodb_backup_*.gz" -File |
    Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-$RetentionDays) } |
    Remove-Item -Force -ErrorAction SilentlyContinue

Write-Host "Backup completed: $archivePath"
