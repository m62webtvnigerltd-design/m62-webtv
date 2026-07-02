# M62 WEB TV - Week 1 Launch Plan

Goal: finish production-ready launch in 7 days with clear daily checkpoints.

## Day 1 - Audit and Stabilize (Today)
- [x] Review pending changes in admin dashboard UI
- [x] Run error checks on changed files
- [x] Verify JavaScript syntax for main script
- [ ] Final code review pass for pending UI/profile block
- [ ] Commit pending dashboard/profile changes

## Day 2 - Backend Hardening
- [x] Validate production environment variables
- [x] Confirm JWT, CORS, and rate limit behavior
- [x] Confirm MongoDB connection policy for production
- [x] Verify backup script and retention settings

Day 2 notes:
- PASS: NODE_ENV production, JWT length >= 32, MongoDB URI configured, in-memory fallback disabled, request body limit and trust proxy set.
- PASS: Backup command executed successfully and generated a .gz archive in backend/backups.
- FIXED: FRONTEND_ORIGIN localhost entry removed from local .env.
- HARDENED: Production startup validation now rejects localhost/127.0.0.1 in FRONTEND_ORIGIN.

## Day 3 - Frontend Polish
- [x] Replace placeholder content with real content
- [x] Mobile, tablet, desktop visual QA
- [x] Language consistency check (ha/en/fr/ar)

Day 3 progress:
- Updated public contact phone placeholders in about/faq/privacy pages to match homepage contact number.
- Added real social links in homepage footer (Facebook, X/Twitter, YouTube, WhatsApp).
- Quick browser QA done for homepage and about page.
- Added two new language options: Zarma and Fulfulde.
- Expanded Arabic pack to avoid mixed-language fallback on key homepage sections.
- Completed responsive QA on desktop/tablet/mobile with no horizontal overflow.
- Completed language QA on ha, dje, ff, en, fr, ar selectors and key translated sections.

## Day 4 - Full Integration QA
- [x] Admin to public flow test for News CRUD
- [x] Admin to public flow test for Videos CRUD
- [x] Comments and ratings flow test
- [x] Login and password reset flow test
- [x] Upload flow test (image and video)

Day 4 notes:
- PASS: JWT auth recovered and verified via password reset confirm -> login -> auth me -> users list.
- PASS: News CRUD endpoints verified end-to-end with admin access.
- PASS: Videos CRUD endpoints verified end-to-end with admin access.
- PASS: Engagement comments + ratings + summary verified after aligning request payload/route names.
- PASS: Upload image/video endpoints verified with real media files and valid multipart MIME types.
- FIXED: Earlier failures were test-script mismatches (payload field names, route naming, and PowerShell multipart method), not backend logic regressions.

## Day 5 - Deployment
- [x] Deploy backend
- [ ] Deploy frontend
- [x] Connect frontend to production API URL
- [x] Run smoke test on production URLs

Day 5 kickoff:
- Ready to start deployment sequence immediately after Day 4 QA closure.
- Preflight started: production backend startup check executed.
- Blocker identified: `FRONTEND_ORIGIN` is empty in backend environment, so production mode startup is rejected by validation.
- Next action: set real frontend production origin (for example Netlify/Vercel domain), then re-run production startup check and smoke tests.

Day 5 progress:
- Backend deployed live on Railway: https://m62-webtv-production.up.railway.app
- Frontend production API fallback now points to Railway backend in `js/main.js`.
- Production smoke checks PASS for `/api/health`, `/api/stats/dashboard`, and CORS preflight from `https://m62webtv.netlify.app`.
- Admin-key protected smoke check returns 401 when local key differs from Railway key (expected until keys are aligned).

## Day 6 - Security and Monitoring
- [ ] Final security checklist
- [ ] Performance sanity checks
- [ ] Uptime/log monitoring setup

## Day 7 - Final QA and Go Live
- [ ] Regression test key user journeys
- [ ] Fix final high-priority issues
- [ ] Launch decision checkpoint
- [ ] Publish release notes

## Risks to Watch
- DNS propagation delays
- Email provider/app password issues
- CORS origin mismatch after deploy
- Missing real media content before launch

## Done This Session
- Checked git status and confirmed 3 modified files
- Verified no editor errors in changed files
- Verified JavaScript syntax check passes for js/main.js
- Closed Day 4 integration QA with verified PASS matrix.
