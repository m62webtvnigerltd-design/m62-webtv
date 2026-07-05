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
**Status: ✅ COMPLETED**
**Commit:** `162d36a` — `perf(youtube): add click-to-load facade for PDG embed`

- Click-to-load YouTube facade implemented with static play button
- No eager YouTube iframe on initial JavaScript-enabled page load
- Exact youtube-nocookie.com playlist URL preserved (https://www.youtube-nocookie.com/embed?listType=playlist&list=UUNRk2oGaLi0pDF_0QgpJnRg)
- Keyboard activation supported (Enter and Space keys)
- Accessible facade div with role="button", tabindex="0", aria-label for screen readers
- Duplicate iframe creation prevented via flag mechanism
- No-JavaScript fallback preserved via noscript tag (original iframe restored for disabled JS)
- Production verification passed — facade deployed live on Cloudflare production

---

## Phase 4 — Secondary Page SEO Parity
**Status: ✅ COMPLETED**
**Commits:** `0f6fd28` (titles/descriptions), `8e9ebc2` (OG/Twitter/JSON-LD)

**Goal:** Bring `about.html`, `faq.html`, and `privacy.html` to the same SEO baseline as `index.html`.

Completed tasks:
- ✅ 4A: Improved page titles and meta descriptions (English-forward, page-specific)
- ✅ 4B: Added Open Graph tags (og:title, og:description, og:url, og:type, og:site_name, og:image, og:image:alt, og:locale)
- ✅ 4C: Added Twitter/X card tags and meta robots/theme-color on all secondary pages
- ✅ 4D: Added JSON-LD schemas (AboutPage for about.html, FAQPage for faq.html with 6 Q&A entities, WebPage for privacy.html)
- ✅ All changes head-only; no CSS, JS, backend, admin, or API changes
- ✅ Deployed live on Cloudflare — all tags verified in production

---

## Phase 5 — Full Validation and Regression Testing
**Status: ✅ COMPLETED**

**Goal:** End-to-end regression sweep to verify production baseline and validate all changes.

**Validation Results: All 17 Checks PASS ✅**

Production baseline verified live on Cloudflare:
1. ✅ Homepage HTTP 200
2. ✅ about.html HTTP 200 (post-redirect)
3. ✅ faq.html HTTP 200 (post-redirect)
4. ✅ privacy.html HTTP 200 (post-redirect)
5. ✅ robots.txt HTTP 200
6. ✅ sitemap.xml HTTP 200, valid XML
7. ✅ Canonical URLs correct
8. ✅ Open Graph / Twitter tags present on all pages
9. ✅ JSON-LD schemas parse correctly (NewsMediaOrganization, AboutPage, FAQPage, WebPage)
10. ✅ No broken local links on public pages
11. ✅ Admin pages available locally
12. ✅ main.js no diagnostics errors
13. ✅ styles.css no diagnostics errors
14. ✅ YouTube embed uses youtube-nocookie.com (Phase 3D Step 1)
15. ✅ No legacy youtube.com/embed in live homepage
16. ✅ Git working tree clean
17. ✅ Local main branch aligned with origin/main

**Production Baseline Status: VALIDATED, LIVE, AND STABLE**
- All Phase 1–5 work complete and verified
- SEO parity established across all public pages
- Zero regressions detected
- Ready for sustained operation and future phases

---

## Legacy Homepage Cleanup
**Status: ✅ COMPLETED**
**Commit:** `581a777` — `chore(cleanup): remove obsolete index backup page`

**Goal:** Remove obsolete historical backup file that posed duplicate content and public deployment risk.

Completed tasks:
- ✅ Audited index-backup.html (2,108 lines, created in Phase 3B era)
- ✅ Verified no active dependencies in code, HTML links, API routes, or documentation
- ✅ Identified public duplicate-content risk if indexed via search engines
- ✅ Confirmed obsolete backup (predated youtube-nocookie.com switch, facade implementation, and SEO parity work)
- ✅ Deleted obsolete backup file while preserving full git history for rollback
- ✅ Verified deletion — only index.html (300 lines, current) remains

---

## Phase 5B — Search Engine Launch & Indexing
**Status: ✅ COMPLETED (Verified Success)**

**Goal:** Prepare M62 WEB TV for search engine discovery and establish baseline indexing status.

**Completed Tasks:**

**5B.1 — Google Search Console Verification**
- ✅ HTML verification file (`googlecfcd629f5afbc7b7.html`) generated and deployed to project root
- ✅ File preserved in git; Cloudflare deployment verified
- ✅ Ownership claim submitted to Google Search Console
- ✅ Commit: `38d998c` — `seo(search): add Google Search Console verification file`

**5B.2 — Sitemap Cleanup and Optimization**
- ✅ Duplicate homepage URL removed from sitemap.xml (/index.html entry deleted)
- ✅ Canonical homepage URL (/) preserved with priority 1.0, daily changefreq
- ✅ Sitemap now contains exactly 4 URLs: /, /about.html, /faq.html, /privacy.html
- ✅ Valid XML format confirmed; xmlns namespace correct
- ✅ Commit: `75c40dc` — `seo(sitemap): remove duplicate homepage URL`

**5B.3 — Sitemap Submission and Indexing**
- ✅ sitemap.xml successfully submitted to Google Search Console
- ✅ Submission status: SUCCESS (Couldn't fetch state resolved after reload)
- ✅ Homepage URL (/) inspected in GSC
- ✅ Homepage indexed on Google — live and discoverable
- ✅ HTTPS verified by Google Search Console — no TLS issues detected in GSC

**Pending Tasks:**
- ⏳ about.html: Discovered in GSC but not yet indexed; manual request indexing hit daily quota
- ⏳ faq.html: Indexing status check and request indexing pending
- ⏳ privacy.html: Indexing status check and request indexing pending
- ⏳ Monitor GSC for discovery of secondary pages over next 2–4 weeks

**Status Notes:**
- Previous diagnosis of Content-Type misconfiguration (Cloudflare serving .xml as text/plain) was based on local TLS verification failures, not confirmed production issue. GSC sitemap submission now reports SUCCESS, indicating Cloudflare is serving sitemap correctly.
- Local PowerShell TLS failures were environment-specific (network/firewall), not production HTTPS failure.
- Production HTTPS confirmed working by Google Search Console verification and live Cloudflare deployment.

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
