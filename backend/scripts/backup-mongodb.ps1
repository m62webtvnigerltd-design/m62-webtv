param(
    [string]$MongoUri = $env:MONGODB_URI,
    [string]$DatabaseName = $env:MONGODB_DB_NAME,
    [string]$OutputRoot = "",
    [int]$RetentionDays = 14
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendDir = Split-Path -Parent $scriptDir

$envFile = Join-Path $backendDir ".env"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^[\s]*#' -or $_ -notmatch '=') {
            return
        }

        $parts = $_ -split '=', 2
        $key = $parts[0].Trim()
        $value = $parts[1].Trim()

        if ($key -eq 'MONGODB_URI' -and [string]::IsNullOrWhiteSpace($MongoUri)) {
            $MongoUri = $value
        }

        if ($key -eq 'MONGODB_DB_NAME' -and [string]::IsNullOrWhiteSpace($DatabaseName)) {
            $DatabaseName = $value
        }
    }
}

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
    $fallbackPaths = @(
        "C:\Program Files\MongoDB\Tools\100\bin\mongodump.exe",
        "C:\Program Files\MongoDB\Tools\bin\mongodump.exe"
    )

    $resolved = $fallbackPaths | Where-Object { Test-Path $_ } | Select-Object -First 1
    if ($resolved) {
        $mongodump = @{ Source = $resolved }
    } else {
        throw "mongodump was not found in PATH. Install MongoDB Database Tools and retry."
    }
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
