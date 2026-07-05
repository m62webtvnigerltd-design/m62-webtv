# M62 WEB TV — GitHub Copilot Instructions

## Project Overview

M62 WEB TV is a Nigerian broadcast web TV platform. The stack is:
- **Frontend:** Static HTML/CSS/JS deployed on Cloudflare Workers/Pages
- **Backend:** Node.js + Express deployed on Railway, MongoDB on Railway
- **Admin:** HTML admin panel at `/admin/`
- **Auth:** JWT-based, endpoints at `/api/auth/login` and `/api/auth/me`

Production URLs:
- Frontend: `https://m62-webtv.m62webtvnigerltd.workers.dev/`
- Backend: `https://m62-webtv-production.up.railway.app`
- GitHub: `https://github.com/m62webtvnigerltd-design/m62-webtv`

---

## Master Roadmap

**Always read `docs/M62_MASTER_ROADMAP.md` before starting any phase of work.**

Current phase status summary:
- Phase 1: ✅ Completed
- Phase 2: ✅ Completed
- Phase 3A: ✅ Completed
- Phase 3B: ✅ Completed — commit `73ddfce`
- Phase 3C-1: ✅ Completed — commit `f81095e`
- Phase 3D Step 1: ✅ Completed — commit `543c3d4`
- Phase 3C-2: ⏸ Deferred
- Phase 3C-3: ⏸ Deferred
- Phase 3D Step 2: ⏸ Deferred
- **Phase 4: 🔜 NEXT — Secondary Page SEO Parity**
- Phase 5: 🗓 Planned — Full Validation and Regression Testing
- Phase 6: 🔮 Future — do NOT implement without approval
- Phase 6B: 🔮 Future — do NOT implement without approval

---

## Mandatory Rules for Copilot

### Before any work
- Read `docs/M62_MASTER_ROADMAP.md`.
- Confirm working tree is clean (`git status`).
- Confirm which phase is active.

### During work
- Keep changes **phase-scoped**. Do not modify files outside the current phase scope.
- For risky changes: inspect read-only first, then report findings, then implement.
- Never modify: `.env`, secrets, tokens, Railway env vars, Cloudflare config, `wrangler.toml`.
- Never expose credentials, JWT secrets, MongoDB URIs, or API keys.
- Do not skip phases without explicit user approval.

### Commits
- One commit per logical change — do not bundle unrelated changes.
- Use conventional commit messages: `type(scope): description`
  - Types: `feat`, `fix`, `perf`, `refactor`, `docs`, `test`, `chore`
- Never force push to `origin/main`.
- Always confirm fast-forward before pushing.

### After each phase
- Run `git status` and confirm clean working tree.
- Report: files changed, commit hash, before/after for key changes.
- Stop and wait for next instruction before starting a new phase.

---

## Key File Map

| File | Purpose |
|------|---------|
| `index.html` | Homepage — primary public page |
| `about.html` | About page |
| `faq.html` | FAQ page |
| `privacy.html` | Privacy policy page |
| `css/styles.css` | Single global stylesheet |
| `js/main.js` | Primary frontend JS (API base URL lives here) |
| `admin/` | Admin panel HTML pages |
| `backend/server.js` | Express server — all API routes |
| `backend/.env` | Local env (never expose) |
| `docs/M62_MASTER_ROADMAP.md` | Master phase roadmap — read before any work |
| `sitemap.xml` | XML sitemap |
| `robots.txt` | Crawler rules |

---

## Environment Notes

- Node.js v24.18.0 at `C:\Program Files\nodejs`
- Use `npm.cmd` not `npm` (PowerShell execution policy)
- Git at `C:\Progra~1\Git\cmd\git.exe`
- Backend `.env` loaded via `__dirname` in `backend/server.js`
- MongoDB: Railway-hosted; `MONGODB_INMEMORY_FALLBACK=false` in production
- Auth responses: login returns `data.token`; `/api/auth/me` returns user at `data`

---

## What NOT to Do

- Do not start Phase 6 or Phase 6B without explicit approval.
- Do not modify CSS unless the active phase explicitly includes CSS work.
- Do not modify backend, APIs, auth, or admin files unless the active phase requires it.
- Do not add facade/click-to-load YouTube script (Phase 3D Step 2 is deferred).
- Do not run `git push --force`.
- Do not modify `sitemap.xml`, `robots.txt`, or Cloudflare config outside a dedicated phase.
