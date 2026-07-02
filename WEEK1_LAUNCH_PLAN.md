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
- [ ] Replace placeholder content with real content
- [ ] Mobile, tablet, desktop visual QA
- [ ] Language consistency check (ha/en/fr/ar)

Day 3 progress:
- Updated public contact phone placeholders in about/faq/privacy pages to match homepage contact number.
- Remaining: social links, any remaining placeholder emails/labels, and full visual + language QA.

## Day 4 - Full Integration QA
- [ ] Admin to public flow test for News CRUD
- [ ] Admin to public flow test for Videos CRUD
- [ ] Comments and ratings flow test
- [ ] Login and password reset flow test
- [ ] Upload flow test (image and video)

## Day 5 - Deployment
- [ ] Deploy backend
- [ ] Deploy frontend
- [ ] Connect frontend to production API URL
- [ ] Run smoke test on production URLs

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
