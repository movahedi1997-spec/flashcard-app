# Dev Task Breakdown — Flashcard App
# [PM] | Date: 2026-04-12
# Source: product/decisions.md + graphify-out/GRAPH_REPORT.md

---

## Architecture Decisions — Must Be Logged in dev/decisions.md Before Any Code

1. Stack consolidation: Next.js wins (SSR needed for SEO); Vite /src/ removed
2. Database: Migrate from flat JSON (server/db.js) to PostgreSQL
3. SRS Algorithm: SM-2 vs FSRS (FSRS recommended for long-horizon retention)
4. AI Provider: OpenAI vs Anthropic (with domain context injection for medical/pharmacy/chemistry)
5. Mobile future-proofing: Next.js + shared TS types for future React Native

---

## Phase 1 — DB Migration, Stack Consolidation & Core Infrastructure
### Target: Weeks 1–3 | Gate: Nothing in Phase 2 starts until Phase 1 QA passes

---

### TASK-001
- **Title:** Consolidate dual-stack — remove Vite /src/ directory
- **Owner:** Frontend
- **Priority:** High
- **Dependencies:** None
- **Description:** The graph confirms two parallel codebases: Next.js (/app, /components) and Vite (/src with its own App.tsx, main.tsx, vite.config.ts). Remove /src/ entirely after verifying zero imports from /app reference it. Update package.json to remove Vite dependencies. Update README.
- **Acceptance Criteria:**
  - /src/ directory deleted from repo
  - No broken imports in /app or /components
  - `npm run build` passes cleanly
  - vite.config.ts, src/main.tsx, src/assets/ all gone

---

### TASK-002
- **Title:** Design PostgreSQL schema (users, decks, cards, SRS state, AI usage)
- **Owner:** Backend
- **Priority:** High
- **Dependencies:** Architecture decision on DB provider logged
- **Description:** Design and document the full schema before any migration code. Tables needed: users (via Supabase Auth or custom), decks (id, user_id, title, description, is_public, slug, subject, created_at, updated_at), cards (id, deck_id, user_id, front, back, image_url, ai_generated, created_at), srs_state (card_id, user_id, interval, ease_factor, due_date, review_count), ai_usage (user_id, month, cards_generated). Write schema to dev/decisions.md.
- **Acceptance Criteria:**
  - Schema documented in dev/decisions.md with all columns, types, foreign keys, and indexes
  - Reviewed and approved before TASK-003 starts
  - Includes migration file (SQL or ORM)

---

### TASK-003
- **Title:** Migrate Express + JSON DB to Next.js API routes + PostgreSQL
- **Owner:** Backend
- **Priority:** High
- **Dependencies:** TASK-002
- **Description:** Replace server/db.js (readUsers, writeUsers, createUser, findByEmail, findById — Community 3 in graph) and server/index.js (Express entry) with Next.js API routes. Replace server/auth.js JWT + bcrypt auth with Supabase Auth or equivalent. All flashcard data currently in localStorage (useBoxes, useCards — Communities 18/19) must move to server-side DB calls via new API routes. Environment variables for DB connection in .env.local.
- **Acceptance Criteria:**
  - server/ directory removed
  - /api/auth/* routes handle signup, login, logout, session
  - /api/decks/* and /api/cards/* handle all CRUD
  - users.json flat file gone
  - Auth works end-to-end (signup → login → session → logout)
  - No localStorage used for deck/card data

---

### TASK-004
- **Title:** Implement SRS algorithm (FSRS or SM-2, validated)
- **Owner:** Backend
- **Priority:** High
- **Dependencies:** TASK-002
- **Description:** Implement a long-horizon spaced repetition algorithm. FSRS is preferred (better for USMLE/NAPLEX timelines spanning months/years). Must include: card scheduling (Again/Hard/Good/Easy → next interval), catch-up mode (user returns after 3+ days — surfaces top N priority cards only), daily load manager (cap reviews at configurable limit), and streak tracking. Algorithm must be unit-tested against known retention curves.
- **Acceptance Criteria:**
  - Algorithm returns correct next_interval for all 4 grade inputs
  - Catch-up mode returns ≤20 highest-priority cards when overdue count >50
  - Unit tests pass with >90% coverage on algorithm logic
  - SRS state persisted per card per user in srs_state table
  - Interval shown dynamically on each rating button in UI (see TASK-006)

---

### TASK-005
- **Title:** Harden authentication (HTTP-only cookies, refresh tokens, GDPR/COPPA prep)
- **Owner:** Backend
- **Priority:** High
- **Dependencies:** TASK-003
- **Description:** Current auth uses JWT in localStorage (insecure). Move to HTTP-only cookies. Implement refresh token rotation. Add GDPR-compliant account deletion (cascade delete all user data). Add COPPA flag (under-13 gate). Rate limit auth endpoints. Log auth events for security audit.
- **Acceptance Criteria:**
  - JWT stored in HTTP-only cookie, not localStorage
  - Refresh token rotation implemented
  - /api/account/delete removes all user data (decks, cards, srs_state, ai_usage)
  - Auth endpoints rate-limited (5 attempts/min)
  - Security Auditor sign-off required before Phase 2

---

### TASK-006
- **Title:** Update study session UI to new SRS API
- **Owner:** Frontend
- **Priority:** High
- **Dependencies:** TASK-003, TASK-004
- **Description:** The current StudySession.tsx (Community 6: grade(), reveal(), restart()) uses client-side shuffle() and buildScoreDeck()/buildTurboDeck() from study.ts. Rewrite to call /api/study/session (fetch due cards) and /api/study/grade (submit rating). UI must show dynamic interval on each rating button (e.g. "Good → 4 days"). Implement CSS 3D card flip (500ms, prefers-reduced-motion respected). Smart Catch-Up modal when overdue count is high.
- **Acceptance Criteria:**
  - Study session loads due cards from API (not localStorage)
  - Rating buttons show next interval dynamically
  - CSS 3D flip animation works, respects prefers-reduced-motion
  - Smart Catch-Up modal appears when user has 3+ days of missed reviews
  - Session complete screen shows stats
  - WCAG 2.1 AA: rating buttons have text labels, not color alone

---

### TASK-007
- **Title:** PWA setup (service worker, offline study, install prompt)
- **Owner:** Frontend + DevOps
- **Priority:** Medium
- **Dependencies:** TASK-003
- **Description:** Add PWA support as mobile bridge before iOS app. Service worker must cache the study session flow for offline use. Add install prompt (A2HS). Configure next-pwa or equivalent. Icons at all required sizes.
- **Acceptance Criteria:**
  - Lighthouse PWA score ≥ 90
  - Study session works offline for cached decks
  - Install prompt appears on mobile browsers
  - App icon and splash screen configured

---

### TASK-008
- **Title:** CI/CD pipeline (staging + prod, migrations on deploy, secrets management)
- **Owner:** DevOps
- **Priority:** High
- **Dependencies:** TASK-001, TASK-003
- **Description:** Set up GitHub Actions: lint + typecheck + unit tests on every PR. Staging deploy on merge to main. Prod deploy on tag. DB migrations run automatically on deploy. Secrets (DB URL, JWT secret, AI API key, Stripe key) in environment variables — never in code. Set up error monitoring (Sentry or equivalent).
- **Acceptance Criteria:**
  - PR checks: lint, typecheck, unit tests — all must pass before merge
  - Staging auto-deploys on merge to main
  - Prod deploys on release tag
  - DB migrations run automatically (no manual steps)
  - Zero secrets in codebase
  - Error monitoring active in staging and prod

---

### TASK-009
- **Title:** Code Review: Phase 1 (SRS algorithm, auth, schema)
- **Owner:** Code Reviewer
- **Priority:** High
- **Dependencies:** TASK-004, TASK-005
- **Description:** Deep review of SRS algorithm implementation and authentication hardening. Check for: algorithm correctness (compare output to FSRS reference), SQL injection risks, auth bypass vectors, missing rate limits, insecure direct object references in API routes.
- **Acceptance Criteria:**
  - Code Reviewer sign-off logged in dev/decisions.md
  - All High findings resolved before Phase 1 QA

---

### TASK-010
- **Title:** QA: Phase 1 regression
- **Owner:** QA Tester
- **Priority:** High
- **Dependencies:** TASK-006, TASK-008, TASK-009
- **Description:** Full regression across all P0 flows: signup, login, logout, create deck, create card, study session (full SRS flow), catch-up mode, account deletion. Test on Chrome, Firefox, Safari, Safari iPad.
- **Acceptance Criteria:**
  - All P0 flows pass on all 4 browsers
  - Zero data loss bugs (card data survives page refresh, logout, re-login)
  - Dashboard stats show real data (not hardcoded dashes)
  - QA sign-off logged in dev/progress.md before Phase 2 starts

---

## Phase 2 — Explore Page, Sharing & SEO
### Target: Weeks 4–8 | Gate: Phase 1 QA sign-off required

---

### TASK-011
- **Title:** Backend: Explore API (public decks, categories, search, copy-deck)
- **Owner:** Backend
- **Priority:** High
- **Dependencies:** TASK-003 (Phase 1 complete)
- **Description:** Add is_public boolean and subject enum to decks table. Build: GET /api/explore (paginated public deck feed, filterable by subject), GET /api/explore/[slug] (single public deck), POST /api/decks/[id]/copy (copy public deck to user's account), GET /api/explore/categories (subject hub data).
- **Acceptance Criteria:**
  - Explore feed returns only public decks
  - Private decks never appear in explore, not even by direct URL
  - Copy-deck creates a full clone under the requesting user's account
  - Search works on deck title and description
  - Pagination works (cursor-based, not offset)

---

### TASK-012
- **Title:** Backend: Shareable links + OG/Twitter meta tags + JSON-LD
- **Owner:** Backend
- **Priority:** High
- **Dependencies:** TASK-011
- **Description:** Generate a short URL slug for each public deck (/explore/[subject]/[slug]). Server-side render OG meta tags (og:title, og:description, og:image, twitter:card) for each deck page. Add JSON-LD structured data (EducationalResource schema). OG image endpoint: /api/og/[deck-id] returns a 1200×630 PNG (generated server-side with @vercel/og or equivalent).
- **Acceptance Criteria:**
  - WhatsApp, iMessage, Twitter unfurl correctly with deck title + card count + subject
  - Instagram Story image (1080×1920) also generated
  - JSON-LD validated with Google Rich Results Test
  - Slugs are URL-safe and unique

---

### TASK-013
- **Title:** Frontend: Explore page UI (grid, search, category hub, subject filters)
- **Owner:** Frontend
- **Priority:** High
- **Dependencies:** TASK-011
- **Description:** Build /explore page with: subject hub tiles at top (Medicine/Pharmacy/Chemistry), trending deck grid (card component with 4px subject-color top border — indigo/emerald/amber), search bar, category filter pills, creator badge, social proof (X users studying). All SSR via Next.js. Copy-deck CTA on each deck card.
- **Acceptance Criteria:**
  - Page renders server-side (SSR verified with curl — no JS required for content)
  - Subject hub tiles link to /explore/[subject]
  - Deck card shows: title, card count, subject color, creator, copy CTA
  - Search filters results client-side with debounce
  - Empty state shown when no results

---

### TASK-014
- **Title:** Frontend: SEO deck landing pages /explore/[subject]/[slug] (SSR/ISR)
- **Owner:** Frontend
- **Priority:** High
- **Dependencies:** TASK-012, TASK-013
- **Description:** Build individual deck landing pages with ISR (revalidate: 3600). Each page: deck title, card count, subject badge, creator info, sample cards preview (first 5 cards), Study CTA (soft auth gate for non-users), Copy to My Decks CTA, share widget. OG image served from /api/og/[deck-id].
- **Acceptance Criteria:**
  - Lighthouse SEO score ≥ 90
  - Page renders without JS (SSR confirmed)
  - OG image appears in social preview
  - Non-authenticated users see Study preview (10 free cards) with soft sign-up gate
  - Authenticated users see full Study and Copy CTAs

---

### TASK-015
- **Title:** Backend: OG image generation (1200×630 + 1080×1920 Instagram Story)
- **Owner:** Backend
- **Priority:** Medium
- **Dependencies:** TASK-012
- **Description:** Build /api/og/[deck-id] endpoint. Returns 1200×630 PNG for landscape sharing (Twitter, WhatsApp, iMessage). Also generates 1080×1920 for Instagram Story format with "Swipe up to study free" text. Use @vercel/og or satori. Cache generated images in object storage (S3/Cloudflare R2).
- **Acceptance Criteria:**
  - Both image sizes generated correctly
  - Images cached (not regenerated on every request)
  - Subject color applied to design
  - Deck title, card count, creator name visible in image

---

### TASK-016
- **Title:** Frontend: Creator profile page + profile editing
- **Owner:** Frontend
- **Priority:** Medium
- **Dependencies:** TASK-013
- **Description:** Build /creators/[username] page showing: creator avatar, bio, public deck grid, follower count. Build profile editing modal (username, bio, avatar upload). Verified Creator badge display.
- **Acceptance Criteria:**
  - Profile page is SSR
  - Only public decks shown on profile
  - Avatar upload works (stored in object storage, not filesystem)
  - Username change validates uniqueness

---

### TASK-017
- **Title:** Frontend: Public/Private toggle + share widget in deck management
- **Owner:** Frontend
- **Priority:** High
- **Dependencies:** TASK-011
- **Description:** Add Share tab to deck detail page (5-tab hub per UX design: Overview / Cards / Study Settings / Share / Danger Zone). Share tab: visibility toggle (Public/Private), short URL copy button, OG image download, pre-written social messages for Instagram/WhatsApp/iMessage, referral link embedded.
- **Acceptance Criteria:**
  - Toggle updates deck visibility immediately via API
  - Making a deck private removes it from Explore feed within 60 seconds
  - Short URL copied to clipboard with success toast
  - Pre-written messages include the deck URL

---

### TASK-018
- **Title:** DevOps + Backend: Seed deck import pipeline + 20 launch decks
- **Owner:** DevOps + Backend
- **Priority:** High
- **Dependencies:** TASK-011
- **Description:** Build an import script that takes a JSON/CSV deck file and inserts into the DB as a public deck under a verified creator account. Create 20 seed decks (minimum) across Medicine (USMLE Step 1 focus), Pharmacy (NAPLEX focus), and Chemistry (Orgo + AP Chem) before launch day. Seed decks must be live 48h before launch.
- **Acceptance Criteria:**
  - Import script works reliably (idempotent)
  - 20 seed decks live in prod staging environment
  - Each deck has ≥50 cards
  - Decks distributed: ≥7 Medicine, ≥7 Pharmacy, ≥6 Chemistry
  - All seed decks visible on Explore page

---

### TASK-019
- **Title:** Frontend: Onboarding flow — 3 activation paths (no email gate before value)
- **Owner:** Frontend
- **Priority:** High
- **Dependencies:** TASK-013, TASK-014
- **Description:** Build the landing page with 3 co-equal CTAs: Upload PDF (80% visual prominence), Browse Explore, Create Manually. No email gate before first value. After first action, soft auth prompt. Post-signup: single-question subject selector (Medicine/Pharmacy/Chemistry/Other) → auto-seed starter deck → land in dashboard with deck ready to study.
- **Acceptance Criteria:**
  - User can reach Explore page and study 10 preview cards with zero auth
  - Email only collected after first value action
  - Subject selector appears after signup (1-tap, not a form)
  - Starter deck auto-added to library based on subject selection
  - North Star event (10 cards studied) tracked in analytics

---

### TASK-020
- **Title:** Code Review: Phase 2 (SEO, access control, OG image security)
- **Owner:** Code Reviewer
- **Priority:** High
- **Dependencies:** TASK-014, TASK-017
- **Description:** Review Explore and sharing implementation for: private deck leakage (IDOR), OG image endpoint abuse (SSRF risk), slug collision handling, ISR cache poisoning, access control on copy-deck endpoint.
- **Acceptance Criteria:**
  - Private decks confirmed inaccessible via any URL pattern
  - OG endpoint cannot be used to fetch arbitrary URLs
  - Code Reviewer sign-off in dev/decisions.md

---

### TASK-021
- **Title:** QA: Phase 2 (explore, sharing, OG previews, copy-deck, privacy)
- **Owner:** QA Tester
- **Priority:** High
- **Dependencies:** TASK-019, TASK-020
- **Description:** Test: Explore page loads and filters correctly, deck sharing generates correct OG preview on WhatsApp/Twitter/iMessage, copy-deck creates independent clone, private deck not accessible via direct URL, onboarding activation flow, subject-based starter deck seeding.
- **Acceptance Criteria:**
  - OG previews verified on WhatsApp, iMessage, Twitter/X
  - Private deck returns 404 (not 403) to prevent information leakage
  - Copy-deck creates fully independent clone (edits don't affect original)
  - Onboarding tested: all 3 activation paths complete successfully
  - QA sign-off in dev/progress.md before Phase 3 starts

---

### TASK-022
- **Title:** Security Audit: Auth + GDPR + COPPA + private deck isolation
- **Owner:** Security Auditor
- **Priority:** High
- **Dependencies:** TASK-005, TASK-021
- **Description:** Full security audit before public launch: auth hardening (HTTP-only cookies, refresh token rotation, rate limiting), GDPR compliance (account deletion cascade, data export), COPPA gate (under-13 check), private deck isolation (IDOR testing), API rate limiting, dependency vulnerability scan.
- **Acceptance Criteria:**
  - Security Auditor sign-off logged in dev/decisions.md
  - Zero High or Critical findings unresolved
  - GDPR: account deletion removes all data within 30 days (logged)
  - COPPA: under-13 flow implemented and tested
  - This sign-off is a hard launch blocker

---

## Phase 3 — AI Generation, Paywall & Stripe
### Target: Weeks 9–12 | Gate: Phase 2 QA sign-off required

---

### TASK-023
- **Title:** Backend: AI pipeline (PDF upload → extract → domain inject → card output)
- **Owner:** Backend
- **Priority:** High
- **Dependencies:** TASK-003 (Phase 1 complete)
- **Description:** Build /api/ai/generate endpoint. Flow: (1) Accept PDF upload (store in object storage, max 50MB), (2) Extract text (pdf-parse or similar), (3) Inject domain context into prompt (medical/pharmacy/chemistry system prompt based on user's subject setting), (4) Call AI API (Anthropic Claude or OpenAI), (5) Parse response into Q/A pairs, (6) Return card preview array (not auto-saved). Check ai_usage table before processing — enforce 50 cards/month free limit.
- **Acceptance Criteria:**
  - PDF text extraction works on text-based PDFs (not image-only scans)
  - Domain context injected correctly per user subject
  - Cards returned as preview (not saved until user approves)
  - Free limit enforced: 50 cards/month, configurable via environment variable
  - Error handling: oversized PDF, corrupt PDF, API timeout, empty extraction

---

### TASK-024
- **Title:** Frontend: AI generation UI (upload, review queue, edit before save, disclaimer)
- **Owner:** Frontend
- **Priority:** High
- **Dependencies:** TASK-023
- **Description:** Build AI generation flow: (1) Upload widget (drag-drop + file picker, PDF only, size limit shown), (2) Subject selector (pre-filled from profile), (3) Loading state with progress indicator, (4) Review screen — card list with approve/reject per card, edit Q and A inline, batch approve-all, (5) AI disclaimer badge on every AI-generated card ("AI-generated — please verify"). Badge auto-removes when user edits the card. (6) Save to deck (existing or new).
- **Acceptance Criteria:**
  - Disclaimer badge visible on all AI cards in review and study views
  - Disclaimer removed when user edits any field (editing = implicit verification)
  - Batch approve-all works
  - Upload rejects non-PDF files with clear error
  - Free limit reached → contextual prompt (not modal wall): "Upgrade to Pro — from $4.17/mo"

---

### TASK-025
- **Title:** Backend: Freemium paywall (50 AI cards/month, configurable, no hardcoded prices)
- **Owner:** Backend
- **Priority:** High
- **Dependencies:** TASK-023
- **Description:** Implement AI credit system: track cards generated per user per month in ai_usage table. Enforce limit (configurable via env var, default 50). No prices hardcoded in UI or backend — all pricing values from environment config. Pro users (verified via Stripe subscription status) get unlimited AI. Endpoint returns remaining credits in response.
- **Acceptance Criteria:**
  - Free limit enforced correctly (resets on 1st of each month)
  - Limit is an environment variable (not hardcoded)
  - Pro subscription bypasses limit
  - Remaining credits returned in API response for UI display
  - Zero hardcoded price strings in codebase

---

### TASK-026
- **Title:** Backend + DevOps: Stripe integration (checkout, webhooks, customer portal)
- **Owner:** Backend + DevOps
- **Priority:** High
- **Dependencies:** TASK-025
- **Description:** Integrate Stripe: (1) Checkout session for Monthly/Annual/Lifetime plans, (2) Webhook handler for subscription events (created, updated, canceled, payment failed), (3) Customer portal for plan management, (4) Subscription status synced to users table. All Stripe keys in environment. Webhook signature verification required.
- **Acceptance Criteria:**
  - Checkout flow works end-to-end in staging with Stripe test cards
  - Webhook signature verified (rejects tampered events)
  - Subscription status updates within 30 seconds of Stripe event
  - Customer portal lets users upgrade/downgrade/cancel
  - Failed payment triggers downgrade to free tier
  - This is a hard launch blocker — must pass in staging before prod

---

### TASK-027
- **Title:** Frontend: Pricing page (default annual view, config-driven prices)
- **Owner:** Frontend
- **Priority:** High
- **Dependencies:** TASK-025, TASK-026
- **Description:** Build /pricing page. Toggle defaults to Annual (not Monthly). Per-month equivalent shown on Annual plan. All prices fetched from config (not hardcoded). Tiers: Free, Pro Monthly, Pro Annual, Pro Annual .edu, Lifetime, Campus (contact us). Founding Member banner (30-day countdown timer). Feature comparison table.
- **Acceptance Criteria:**
  - All prices come from config/environment (zero hardcoded price strings)
  - Toggle defaults to Annual
  - Monthly equivalent shown on Annual card
  - Founding Member offer has working countdown
  - Checkout button calls Stripe correctly for each tier
  - .edu discount requires email verification before applying

---

### TASK-028
- **Title:** QA: AI accuracy test — 20 PDF corpus, <5% factual error rate
- **Owner:** QA Tester
- **Priority:** High
- **Dependencies:** TASK-023, TASK-024
- **Description:** Test AI generation quality using a 20-PDF corpus across Medicine (pharmacology, anatomy, cardiology), Pharmacy (drug mechanisms, calculations), and Chemistry (organic reactions, nomenclature). Count factual errors in generated cards. Target: <5% error rate. Also test: upload edge cases (image-only PDF, corrupt file, >50MB file, non-PDF).
- **Acceptance Criteria:**
  - <5% factual error rate across 20-PDF corpus (this is a hard launch blocker)
  - All edge cases handled gracefully (no unhandled exceptions)
  - Error messages are clear and actionable
  - Results logged in dev/progress.md

---

### TASK-029
- **Title:** Code Review: Phase 3 (AI prompt injection, Stripe webhook security, zero hardcoded prices)
- **Owner:** Code Reviewer
- **Priority:** High
- **Dependencies:** TASK-026, TASK-027
- **Description:** Review AI and payment implementation for: prompt injection via PDF content, Stripe webhook signature verification, hardcoded prices (grep entire codebase), PDF upload path traversal, AI credit bypass vulnerabilities.
- **Acceptance Criteria:**
  - Prompt injection mitigated (PDF content sanitized before injection into prompt)
  - Stripe webhook verified cryptographically
  - Zero hardcoded price strings found in codebase
  - Code Reviewer sign-off in dev/decisions.md

---

### TASK-030
- **Title:** QA: Full pre-launch regression (5 browsers, all P0 flows, performance + a11y)
- **Owner:** QA Tester
- **Priority:** High
- **Dependencies:** TASK-028, TASK-029
- **Description:** Full regression on Chrome, Firefox, Safari (Mac), Safari (iPad), Chrome (Android). All P0 flows: signup, login, create deck, add card, study session, explore, share deck, copy deck, AI generation, upgrade to Pro, cancel subscription, account deletion. Performance: Lighthouse ≥ 90 on mobile. Accessibility: WCAG 2.1 AA automated scan passes.
- **Acceptance Criteria:**
  - All P0 flows pass on all 5 browsers/devices
  - Lighthouse Performance ≥ 90 on mobile
  - Lighthouse Accessibility ≥ 90
  - Zero P0 bugs open at launch
  - QA sign-off in dev/progress.md — this is a hard launch blocker

---

### TASK-031
- **Title:** Technical Writer: README, API docs, SRS algorithm doc, seed deck guide
- **Owner:** Technical Writer
- **Priority:** Medium
- **Dependencies:** TASK-010, TASK-021
- **Description:** Update README (setup, architecture, environment variables). Write API documentation for all public endpoints. Document the SRS algorithm implementation with references to the underlying research. Write a seed deck creation guide for future contributors.
- **Acceptance Criteria:**
  - README has working setup instructions (verified by someone not on the team)
  - API docs cover all /api/* endpoints
  - SRS doc explains the algorithm with references
  - Seed deck guide explains format and import process

---

## Hard Launch Blockers — All Must Pass Before Launch Day

| Task | Blocker |
|------|---------|
| TASK-004 | SRS algorithm validated against retention curves |
| TASK-009 | Code Reviewer sign-off on SRS implementation |
| TASK-018 | 20 seed decks live ≥48h before launch day |
| TASK-022 | Security Auditor GDPR + COPPA sign-off |
| TASK-026 | Stripe end-to-end tested in staging before real transactions |
| TASK-028 | AI accuracy <5% error on 20-PDF medical corpus |
| TASK-030 | Full QA regression passes on all 5 browsers/devices |
