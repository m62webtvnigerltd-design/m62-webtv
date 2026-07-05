# M62 WEB TV — Master Roadmap

> **Rule:** Always read this file before starting any phase of work.
> Never skip a phase without explicit approval. Stop and report after each phase.

---

## Phase Status Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Completed and committed |
| ⏸ | Deferred — do not implement without approval |
| 🔜 | Next up |
| 🗓 | Planned |
| 🔮 | Future — do not implement until explicitly approved |

---

## Phase 1 — Audit and Stabilize
**Status: ✅ COMPLETED**

- Audited admin dashboard UI and pending changes
- Verified JavaScript syntax for main script
- Error checks on all changed files

---

## Phase 2 — Backend Hardening
**Status: ✅ COMPLETED**

- Validated production environment variables (NODE_ENV, JWT, CORS, MongoDB)
- Confirmed backup script and retention settings
- Removed localhost FRONTEND_ORIGIN from production env
- Production startup validation now rejects localhost origins

---

## Phase 3 — Frontend Optimisation

### Phase 3A — Asset and Path Verification
**Status: ✅ COMPLETED**

- Verified all asset paths and references
- Fixed and validated `social-preview.jpg`

---

### Phase 3B — Image Stability
**Status: ✅ COMPLETED**
**Commit:** `73ddfce` — `perf(images): finalize Phase 3B stability updates and update social preview asset`

- Finalized image stability across homepage and key pages
- Social preview asset updated and verified

---

### Phase 3C-1 — Exact Duplicate CSS Cleanup
**Status: ✅ COMPLETED**
**Commit:** `f81095e` — `refactor(css): remove duplicate main-content block`

- Identified and removed exact duplicate `main-content` CSS block from `css/styles.css`
- No visual regressions introduced

---

### Phase 3C-2 — CSS Organisation and Comments
**Status: ⏸ DEFERRED**

- Do not implement without explicit approval
- Scope: reorganise CSS sections with clear comments and groupings

---

### Phase 3C-3 — Legacy CSS Removal
**Status: ⏸ DEFERRED**

- Do not implement without explicit approval
- Scope: identify and remove legacy/unused CSS rules

---

### Phase 3D Step 1 — YouTube embed privacy domain
**Status: ✅ COMPLETED**
**Commit:** `543c3d4` — `perf(youtube): switch embed to youtube-nocookie.com for Phase 3D Step 1`

- Switched official PDG Multimedia TV YouTube iframe src from `youtube.com` to `youtube-nocookie.com`
- No layout, parameters, path, or CSS changed
- Confirmed live on Cloudflare production

---

### Phase 3D Step 2 — YouTube Facade / Click-to-Load
**Status: ⏸ DEFERRED**

- Do not implement without explicit approval
- Scope: add a static thumbnail facade that loads the iframe only on user click

---

## Phase 4 — Secondary Page SEO Parity
**Status: 🔜 NEXT**

**Goal:** Bring `about.html`, `faq.html`, and `privacy.html` to the same SEO baseline as `index.html`.

Planned tasks:
- Audit meta tags (title, description, og:*, twitter:*) on secondary pages
- Add or fix canonical tags
- Verify structured data / schema where applicable
- Confirm language and viewport meta consistency
- No CSS, JS, backend, admin, or API changes

---

## Phase 5 — Full Validation and Regression Testing
**Status: 🗓 PLANNED**

**Goal:** End-to-end regression sweep before final go-live declaration.

Planned tasks:
- Regression test all key user journeys (homepage, about, admin login, news flow)
- Fix any final high-priority issues discovered
- Launch decision checkpoint
- Publish release notes

---

## Phase 6 — Future Broadcast Foundation / Hybrid TV Station Readiness
**Status: 🔮 FUTURE — DO NOT IMPLEMENT**

> Do not begin Phase 6 until explicitly approved in a future session.

Vision: Build the technical foundation for M62 Web TV to operate as a hybrid broadcast station — combining live streaming, on-demand VOD, and scheduled programming.

High-level areas (to be scoped when approved):
- Live stream infrastructure integration
- Scheduled broadcast / EPG (Electronic Programme Guide) support
- Multi-bitrate / adaptive streaming readiness
- Broadcast-grade uptime and failover strategy
- Regulatory and licensing considerations (Niger broadcast authority)

---

## Phase 6B — Media Partnership & Broadcast Exchange Network
**Status: 🔮 FUTURE — DO NOT IMPLEMENT**

> Do not begin Phase 6B until explicitly approved in a future session.

Vision: Establish M62 Web TV as a regional media hub with partner channels and content exchange capabilities.

High-level areas (to be scoped when approved):
- Partner channel embedding and revenue sharing framework
- Content syndication API design
- Regional affiliate broadcaster onboarding
- Co-branding and white-label options

---

## Deferred Items Summary

| Item | Reason |
|------|--------|
| Phase 3C-2 CSS organisation | Low risk, low urgency — defer post-Phase 5 |
| Phase 3C-3 Legacy CSS removal | Requires full audit — defer post-Phase 5 |
| Phase 3D Step 2 YouTube facade | UX enhancement — defer to Phase 5 window |

---

## Standing Rules (Always Apply)

1. **Read this file before any major work.**
2. **Never skip a phase without explicit approval.**
3. **Use read-only inspection before any risky change.**
4. **Keep changes phase-scoped** — do not bleed work across phases.
5. **Stop and report after each phase** — do not chain phases without confirmation.
6. **Never expose secrets, tokens, or `.env` contents.**
7. **Do not implement Phase 6 or Phase 6B until explicitly approved.**
8. **No force push** — always fast-forward to `origin/main`.
9. **Working tree must be clean before starting a new phase.**
10. **Document each completed phase with commit hash.**
