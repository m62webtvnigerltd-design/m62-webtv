# M62 WEB TV - Post-Launch Playbook

This playbook covers day-to-day operations after go-live.

## 1) Monitoring Setup (10-Minute Checklist)

- [ ] Monitor frontend uptime URL: `https://m62-webtv.m62webtvnigerltd.workers.dev/`
- [ ] Monitor backend health URL: `https://m62-webtv-production.up.railway.app/api/health`
- [ ] Monitor backend stats URL: `https://m62-webtv-production.up.railway.app/api/stats/dashboard`
- [ ] Set uptime check interval to 5 minutes
- [ ] Enable alert channel 1 (email)
- [ ] Enable alert channel 2 (phone/WhatsApp/Telegram)
- [ ] Define incident owner for each alert window

Recommended monitors:
- UptimeRobot (free) for URL checks
- Railway logs for backend diagnostics
- Cloudflare analytics for traffic and edge status

## 2) Security Hardening (Final Production)

- [ ] Rotate all sensitive secrets used during setup/testing
- [ ] Ensure `JWT_SECRET` is strong (32+ chars)
- [ ] Keep `NODE_ENV=production`
- [ ] Keep `MONGODB_INMEMORY_FALLBACK=false`
- [ ] Keep `FRONTEND_ORIGIN` restricted to trusted production domains
- [ ] Remove any localhost origins from production environment variables
- [ ] Confirm admin account password is strong and known by authorized staff only
- [ ] Review admin users and disable unused accounts
- [ ] Enable 2FA on GitHub, Railway, Cloudflare, and primary email

## 3) Backup and Restore Operations

- [ ] Confirm daily backup task `M62-WebTV-Mongo-Backup` is active
- [ ] Confirm latest backup archive is generated in `backend/backups`
- [ ] Keep at least 14 recent backups before cleanup
- [ ] Run one restore test in non-production environment weekly
- [ ] Record backup timestamp in operations log

Quick command (from backend folder):

```powershell
npm run backup:mongo
```

## 4) Daily Operations Template

Use this format at end of each day.

- Date:
- Shift owner:
- Frontend status: PASS/FAIL
- Backend health status: PASS/FAIL
- Admin login status: PASS/FAIL
- News published today (count):
- Videos published today (count):
- Comments moderated (count):
- Alerts triggered:
- Incidents resolved:
- Pending issues for next shift:

## 5) Weekly Operations Checklist

- [ ] Validate homepage sections and ticker are rendering correctly
- [ ] Validate one admin publish flow (news or video)
- [ ] Validate contact form submission
- [ ] Validate CORS preflight from frontend origin
- [ ] Validate one backup restore test (staging/local test)
- [ ] Review and prune old logs/backups if needed

## 6) Incident Runbook (Quick)

If frontend is down:
1. Check Cloudflare Pages deployment status
2. Roll back to previous successful deployment if needed
3. Re-test homepage and admin login page

If backend is down:
1. Check Railway deployment and logs
2. Confirm env vars are intact (`NODE_ENV`, `FRONTEND_ORIGIN`, `JWT_SECRET`, `MONGODB_URI`)
3. Restart/redeploy service
4. Verify `/api/health` and `/api/stats/dashboard`

If login fails:
1. Check browser Network for `/api/auth/login`
2. Confirm CORS preflight from production frontend origin
3. Confirm admin account credentials and status
4. Reset admin password if required

## 7) Ownership and Escalation

- Primary operator:
- Backup operator:
- Technical lead:
- Escalation contact (phone/email):

Keep this file updated whenever environment URLs or operational responsibilities change.
