# MongoDB Backup Schedule (Windows)

Use this guide to run daily MongoDB backups automatically.

## 1) Manual Test First
From the backend folder:

```powershell
npm run backup:mongo
```

If successful, you should see a `.gz` file in `backend/backups`.

If you get `mongodump was not found`, install MongoDB Database Tools and restart terminal:

```powershell
winget install --id MongoDB.DatabaseTools --accept-package-agreements --accept-source-agreements
```

## 2) Create Daily Scheduled Task
Run PowerShell as Administrator and execute:

```powershell
$taskName = "M62-WebTV-Mongo-Backup"
$repoPath = "C:\Users\DELL\Desktop\M62 WEB TV\backend"
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-ExecutionPolicy Bypass -Command \"Set-Location '$repoPath'; npm run backup:mongo\""
$trigger = New-ScheduledTaskTrigger -Daily -At 2:00AM
Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Description "Daily MongoDB backup for M62 WEB TV" -Force
```

## 3) Verify Task

```powershell
Get-ScheduledTask -TaskName "M62-WebTV-Mongo-Backup"
```

## 4) Run Task Immediately (optional)

```powershell
Start-ScheduledTask -TaskName "M62-WebTV-Mongo-Backup"
```

## 5) Restore Example

```powershell
mongorestore --uri="mongodb://127.0.0.1:27017" --gzip --archive="C:\path\to\mongodb_backup_YYYYMMDD_HHMMSS.gz"
```

## 6) Final Backup Checklist (Launch Ready)

- [ ] Manual backup command passes: `npm run backup:mongo`
- [ ] New `.gz` archive appears in `backend/backups`
- [ ] Daily scheduled task exists: `M62-WebTV-Mongo-Backup`
- [ ] Scheduled task Last Run Result is successful (`0x0`)
- [ ] At least one restore test completed successfully in non-production environment
- [ ] Keep minimum 14 recent backup archives before deleting older files
- [ ] Document latest successful backup timestamp in ops notes
