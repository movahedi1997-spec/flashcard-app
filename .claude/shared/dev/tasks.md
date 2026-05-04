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

## Phase 4 — Internationalisation, iOS/iPad & Post-Launch Growth Features
### Target: Month 1–3 post-launch | Gate: Phase 3 QA sign-off + analytics trigger (>10% non-English signups OR specific community launch reason confirmed by founder)
### Source: CONSULT-001 (Critical Consultant, 2026-04-13) — multilanguage deferred here from pre-launch scope

---

### TASK-032
- **Title:** i18n Infrastructure — Next.js internationalisation routing + translation pipeline
- **Owner:** Frontend + Backend
- **Priority:** High
- **Dependencies:** TASK-030 (Phase 3 full QA complete)
- **Description:** Set up the full i18n foundation before any translation work begins.
  (1) Configure Next.js `i18n` routing in `next.config.js` with locales: `en`, `de`, `fr`, `es`, `fa`. Default locale: `en`.
  (2) Install and configure `next-intl` (or equivalent) for server and client components.
  (3) Create translation namespace structure: `messages/en/`, `messages/de/`, `messages/fr/`, `messages/es/`, `messages/fa/` — each with files: `common.json`, `auth.json`, `dashboard.json`, `flashcards.json`, `study.json`, `explore.json`, `settings.json`, `pricing.json`, `errors.json`.
  (4) Extract all hardcoded UI strings from existing components into the `en` namespace files. No string should remain hardcoded in JSX after this task.
  (5) Add locale detection middleware: reads `Accept-Language` header, sets locale cookie, respects explicit locale in URL prefix.
  (6) Add locale switcher component (flag + language name) for the Navbar and settings page.
  (7) Update `middleware.ts` to handle locale routing without breaking auth protection.
- **Acceptance Criteria:**
  - `next build` passes with all 5 locales configured
  - All English UI strings extracted to `messages/en/*.json` — zero hardcoded strings in JSX
  - Locale switcher visible in Navbar; switching locale updates URL and UI without page reload
  - Middleware correctly protects `/[locale]/dashboard`, `/[locale]/flashcards`, `/[locale]/settings`
  - `en` locale renders identically to pre-i18n build (no regressions)

---

### TASK-033
- **Title:** RTL layout support — Persian/Farsi right-to-left rendering
- **Owner:** Frontend
- **Priority:** High
- **Dependencies:** TASK-032
- **Description:** Persian (`fa`) is a right-to-left language. This requires dedicated layout work beyond simply swapping text.
  (1) Add `dir="rtl"` to `<html>` when locale is `fa`; `dir="ltr"` for all others.
  (2) Load a Persian-compatible font: `Vazirmatn` (Google Fonts, open licence) — covers Persian and Arabic script. Add to `next/font` config.
  (3) Audit every flex/grid layout in the codebase: directional classes (`pl-*`, `pr-*`, `ml-*`, `mr-*`, `text-left`, `text-right`, `justify-start`, `justify-end`) must be replaced with logical equivalents (`ps-*`, `pe-*`, `ms-*`, `me-*`, `text-start`, `text-end`) so they flip automatically with `dir`.
  (4) Test the flashcard 3D flip animation in RTL — the rotateY direction may need to be mirrored.
  (5) Test all form inputs, dropdowns, and modals in RTL for layout correctness.
  (6) The Navbar and Footer must render correctly mirrored in RTL.
- **Acceptance Criteria:**
  - Switching to `fa` locale: full app renders RTL with no broken layouts
  - Vazirmatn font loads for `fa` locale; all other locales use existing Inter/sans-serif
  - No directional utility class (pl-, pr-, ml-, mr-) remains in any component — all replaced with logical equivalents
  - Flashcard flip animation works correctly in RTL
  - All 5 other locales remain unaffected (regression check)

---

### TASK-034
- **Title:** German translation — UI strings, error messages, onboarding (de)
- **Owner:** Technical Writer + Frontend
- **Priority:** High
- **Dependencies:** TASK-032
- **Description:** Produce and integrate the full German (`de`) translation set.
  (1) Translate all namespace files from `messages/en/` into `messages/de/`.
  (2) German medical education context: terminology must match German exam systems (Staatsexamen, Physikum) in marketing copy and onboarding subject selectors. Subject options should include German-specific categories in the explore page (Vorklinik, Klinik, Pharmakologie).
  (3) Have all translations reviewed by a native German-speaking medical or pharmacy student before merge — do NOT use unreviewed machine translation for medical content (same quality mandate as AI generation from DECISION-006).
  (4) Date, number, and currency formats must use German locale (`de-DE`): periods as thousand separators, commas as decimal separators, € for pricing.
  (5) Update SEO meta tags (`title`, `description`, `og:locale`) to `de` for German pages.
- **Acceptance Criteria:**
  - All `messages/de/*.json` files complete — zero missing keys (CI check with `next-intl` missing-key detection)
  - Native German review sign-off on medical/pharmacy terminology
  - Date and number formatting correct in German locale
  - `de` locale pages pass the same QA P0 flow checklist as `en`

---

### TASK-035
- **Title:** French translation — UI strings, error messages, onboarding (fr)
- **Owner:** Technical Writer + Frontend
- **Priority:** High
- **Dependencies:** TASK-032
- **Description:** Produce and integrate the full French (`fr`) translation set.
  (1) Translate all namespace files from `messages/en/` into `messages/fr/`.
  (2) French medical education context: ECN/iECN (Épreuves Classantes Nationales) terminology for medical students, DFGSM/DFASM levels. Subject selectors should include French-specific categories.
  (3) Native French-speaking medical or pharmacy student review required before merge.
  (4) French locale formatting (`fr-FR`): spaces as thousand separators, comma as decimal, € for pricing, 24h time format.
  (5) Update SEO meta tags for French pages.
- **Acceptance Criteria:**
  - All `messages/fr/*.json` files complete with zero missing keys
  - Native French review sign-off on medical/pharmacy terminology
  - Date and number formatting correct in `fr-FR` locale
  - `fr` locale pages pass P0 QA checklist

---

### TASK-036
- **Title:** Spanish translation — UI strings, error messages, onboarding (es)
- **Owner:** Technical Writer + Frontend
- **Priority:** High
- **Dependencies:** TASK-032
- **Description:** Produce and integrate the full Spanish (`es`) translation set.
  (1) Translate all namespace files from `messages/en/` into `messages/es/`.
  (2) Spanish medical education context: MIR (Médico Interno Residente) exam terminology, Licenciatura en Medicina. Subject selectors should include Spanish-specific medical categories.
  (3) Use Latin American–neutral Spanish where possible (the product serves Spain and Latin America). Flag any region-specific terminology for review.
  (4) Native Spanish-speaking medical or pharmacy student review required before merge.
  (5) Spanish locale formatting (`es-ES`): periods as thousand separators, commas as decimal. Note: Latin American sublocale (`es-419`) may differ — use `Intl.NumberFormat` with the user's detected locale.
  (6) Update SEO meta tags for Spanish pages.
- **Acceptance Criteria:**
  - All `messages/es/*.json` files complete with zero missing keys
  - Native Spanish review sign-off on medical terminology
  - Number and date formatting correct
  - `es` locale pages pass P0 QA checklist

---

### TASK-037
- **Title:** Persian/Farsi translation — UI strings, error messages, onboarding (fa)
- **Owner:** Technical Writer + Frontend
- **Priority:** High
- **Dependencies:** TASK-032, TASK-033 (RTL must be complete first)
- **Description:** Produce and integrate the full Persian (`fa`) translation set.
  (1) Translate all namespace files from `messages/en/` into `messages/fa/`.
  (2) Iranian medical education context: Konkur (کنکور علوم پزشکی), pre-med and medical university curriculum. Subject selectors should include Persian-specific categories (علوم پایه پزشکی, داروسازی, شیمی آلی).
  (3) Native Farsi-speaking medical or pharmacy student review is mandatory — medical terminology in Persian has strict conventions and mistranslation carries a patient safety risk.
  (4) Persian uses Eastern Arabic numerals (۰۱۲۳۴۵۶۷۸۹) by default. Decide and document whether to use Eastern Arabic or Western Arabic numerals in the UI; apply consistently using `Intl.NumberFormat` with `numberingSystem: 'arab'` or `'latn'`.
  (5) Persian locale formatting (`fa-IR`): calendar is Solar Hijri (Jalali) for dates. Evaluate whether to display Gregorian dates (simpler) or Jalali dates (culturally correct) for SRS due dates and review history. This is a product decision — flag to Product Owner before implementing.
  (6) Update SEO meta tags for Persian pages.
- **Acceptance Criteria:**
  - All `messages/fa/*.json` files complete with zero missing keys
  - Native Farsi review sign-off — mandatory, not optional
  - RTL rendering correct (TASK-033 prerequisite verified)
  - Numeral and calendar decision documented and implemented consistently
  - `fa` locale pages pass P0 QA checklist in RTL

---

### TASK-038
- **Title:** Locale-specific seed decks — German, French, Spanish, Persian exam content
- **Owner:** Backend + Technical Writer
- **Priority:** High
- **Dependencies:** TASK-018 (English seed deck pipeline already built), TASK-034, TASK-035, TASK-036, TASK-037
- **Description:** Extend the seed deck import pipeline (TASK-018) to create locale-specific public decks for each new market. The explore page must have real, high-quality content for each locale at the time that locale goes live — an empty explore page in a new language destroys the activation funnel.
  (1) German: minimum 5 decks — Vorklinik anatomy/physiology, Pharmakologie Top-50 Wirkstoffe, Biochemie Grundlagen, Organische Chemie Reaktionen, Physikum Prüfungsvorbereitung. All deck content in German.
  (2) French: minimum 5 decks — Sémiologie médicale, Pharmacologie ECN Top 50, Biochimie DFGSM, Chimie organique réactions, QCM ECN préparation.
  (3) Spanish: minimum 5 decks — Anatomía MIR, Farmacología Top 50 fármacos, Bioquímica, Química orgánica mecanismos, Preparación MIR.
  (4) Persian: minimum 5 decks — آناتومی پایه, فارماکولوژی داروهای اساسی, بیوشیمی, شیمی آلی, آمادگی کنکور علوم پزشکی. All content in Persian script.
  (5) Each deck: minimum 30 cards, medically reviewed, marked as Verified Creator.
  (6) Seed decks must be live 48h before the corresponding locale goes live in production.
- **Acceptance Criteria:**
  - 5 decks per locale (20 total) live in staging before locale launch
  - Each deck ≥30 cards with verified medical accuracy
  - Decks appear correctly in locale-filtered explore page
  - Persian decks render correctly in RTL with Persian script

---

### TASK-039
- **Title:** Locale SEO — hreflang tags, locale meta tags, sitemap per locale
- **Owner:** Frontend + Backend
- **Priority:** High
- **Dependencies:** TASK-032, TASK-038
- **Description:** Internationalise the SEO infrastructure so each locale's pages are correctly indexed by search engines and do not compete with or penalise the English pages.
  (1) Add `<link rel="alternate" hreflang="x">` tags to every page for all 5 locales — this tells Google which language version to show which user.
  (2) Add `og:locale` and `og:locale:alternate` meta tags to all pages.
  (3) Generate locale-specific XML sitemaps: `/sitemap-en.xml`, `/sitemap-de.xml`, `/sitemap-fr.xml`, `/sitemap-es.xml`, `/sitemap-fa.xml`. Include all public deck pages per locale.
  (4) Add a sitemap index at `/sitemap.xml` that references all locale sitemaps.
  (5) Verify Google Search Console correctly identifies locale variants (manual check).
  (6) Test that changing locale in the URL prefix (`/de/`, `/fr/`, etc.) does not break the existing `/en/` SEO rankings.
- **Acceptance Criteria:**
  - All pages have correct `hreflang` alternate tags for all 5 locales
  - Locale-specific sitemaps generated and submitted to Search Console
  - No duplicate content flags between locales (verified with Screaming Frog or equivalent)
  - Existing English SEO rankings unaffected after deploy (monitor for 2 weeks)

---

### TASK-040
- **Title:** iOS/iPad native app — React Native or Flutter implementation
- **Owner:** Frontend + DevOps
- **Priority:** High
- **Dependencies:** TASK-030 (Phase 3 complete)
- **Description:** Build the native iOS/iPad app per DECISION-004. Target: App Store release Month 3–4 post-launch (November–December 2026).
  (1) PM to evaluate React Native vs. Flutter in Week 1 of Phase 4 — document the decision in `dev/decisions.md` with rationale. Key criteria: code reuse with Next.js TypeScript codebase, Expo ecosystem maturity, iPad layout flexibility, SRS animation performance.
  (2) Implement all P0 flows in the native app: signup, login, create deck, create card, study session (SRS with 3D flip), dashboard stats, settings, account deletion.
  (3) iPad-optimised layout: split-pane deck browser + card list on iPad, full-screen study on iPhone.
  (4) Native push notifications: SRS study reminders, streak alerts, daily review nudge. Must use APNs (Apple Push Notification Service).
  (5) Offline study mode: cache the active study session's due cards locally; sync grades on reconnect.
  (6) App Store Optimisation (ASO): title must include "AI Flashcards"; subtitle targets USMLE, MCAT, Med School keywords; screenshots show the 3D flip and AI generation flow.
  (7) The free iOS tier directly competes with Anki's $24.99 one-time iOS purchase — ensure the free tier value is clear in the App Store listing.
- **Acceptance Criteria:**
  - App passes App Store review on first submission (or within 2 rounds)
  - All P0 flows work on iPhone 14+ and iPad (M1 and later)
  - Push notifications work via APNs
  - Offline study session works with sync on reconnect
  - Lighthouse equivalent (Instruments) performance: 60fps scroll and card flip on iPhone 14
  - ASO keywords included in metadata

---

### TASK-041
- **Title:** i18n Code Review — translation completeness, RTL correctness, locale security
- **Owner:** Code Reviewer
- **Priority:** High
- **Dependencies:** TASK-033, TASK-034, TASK-035, TASK-036, TASK-037
- **Description:** Review the full i18n implementation before any locale goes live.
  (1) Verify zero hardcoded strings remain in any component (grep for common hardcoded patterns: English words in JSX className strings that are UI copy, not Tailwind classes).
  (2) Verify RTL implementation (TASK-033): no remaining directional utility classes; `dir` attribute applied correctly at `<html>` level; Vazirmatn font scoped to `fa` locale only.
  (3) Verify locale routing security: locale prefix must not bypass middleware auth checks. A URL like `/fa/dashboard` must redirect unauthenticated users to `/fa/login`, not `/login`.
  (4) Check translation files for missing keys vs. the English baseline — the CI check (TASK-032 AC) must be passing.
  (5) Verify `Intl` usage (number formatting, date formatting) is consistent across all locales and does not use hardcoded locale strings.
  (6) Check Persian numeral/calendar decision is implemented consistently (no mixed Eastern/Western numerals on the same page).
- **Acceptance Criteria:**
  - Code Reviewer sign-off logged in `dev/decisions.md`
  - Zero directional utility classes remaining in any component
  - Locale routing auth protection verified for all 5 locales
  - All translation files pass missing-key CI check
  - No hardcoded English UI strings found in JSX

---

### TASK-042
- **Title:** i18n + iOS QA — P0 flows in all 5 locales + iOS/iPad regression
- **Owner:** QA Tester
- **Priority:** High
- **Dependencies:** TASK-041, TASK-040
- **Description:** Full QA pass across the internationalised web app and iOS native app.
  (1) Web i18n QA: run the P0 flow checklist (signup, login, create deck, create card, study session, account deletion) in all 5 locales on Chrome desktop, Safari desktop, Safari iPad.
  (2) RTL-specific checks for `fa` locale: all layouts correct, no text overflow, no overlapping elements, flashcard flip direction correct.
  (3) Translation completeness check: every screen in every locale must have no missing-translation fallbacks visible to the user (English strings showing through in a non-English locale is a launch blocker).
  (4) Locale switching: switching locale mid-session must not cause data loss or auth issues.
  (5) iOS QA: run P0 flows on iPhone 14 and iPad Pro 11-inch. Verify push notifications fire correctly. Verify offline mode (airplane mode study session then reconnect sync).
  (6) Seed deck visibility: confirm locale-specific seed decks from TASK-038 appear in the correct locale's explore page and not in others.
- **Acceptance Criteria:**
  - All P0 flows pass in all 5 locales on Chrome + Safari
  - RTL layout verified with zero broken components in `fa` locale
  - Zero missing-translation strings visible in any locale
  - iOS P0 flows pass on iPhone 14 and iPad Pro
  - Offline study + sync verified
  - QA sign-off logged in `dev/progress.md`

---

### TASK-043
- **Title:** Post-launch growth features — Anki importer, Study Wrapped, advanced SRS analytics
- **Owner:** Frontend + Backend
- **Priority:** Medium
- **Dependencies:** TASK-030 (Phase 3 complete)
- **Description:** Implement the P2 growth features from DECISION-002 that were deferred from pre-launch scope.
  (1) Anki `.apkg` importer: parse the SQLite-based `.apkg` format, extract cards (front/back/tags), create a new deck, import SRS history where possible. This is a major acquisition tool for Anki switchers.
  (2) Study Wrapped: end-of-session shareable stats card (cards reviewed, grades breakdown, streak, retention %). Generates a 1080×1920 image (Instagram Story format) via `@vercel/og`. This feeds the viral sharing flywheel from RESEARCH-008.
  (3) Advanced SRS Analytics dashboard: per-deck retention curve chart (projected mastery date per card), accuracy trends over time, predicted exam readiness score. Extends the existing StudyChart component.
- **Acceptance Criteria:**
  - Anki `.apkg` import works on a sample AnKing deck (5,000+ cards) without timeout
  - Study Wrapped image generates in under 2 seconds and shares correctly on iOS Messages and Instagram
  - Advanced analytics charts render correctly and use real DB data (not hardcoded)

---

### TASK-044
- **Title:** Campus Ambassador tooling — school referral links, signup banners, B2B pilot dashboard
- **Owner:** Frontend + Backend
- **Priority:** Medium
- **Dependencies:** TASK-026 (Stripe complete), TASK-030
- **Description:** Build the institutional and campus growth infrastructure from DECISION-002 P2.
  (1) Campus referral links: unique signup URLs per institution (`/join/harvard-med`, `/join/usc-pharmacy`) that track which school drove the signup, auto-apply a 30-day Pro trial, and tag the user as a campus user.
  (2) Campus signup banner: a dismissible banner on the dashboard for users who signed up via a campus link — "You joined via [School Name]. Invite your classmates →" with a one-tap invite.
  (3) B2B pilot dashboard (read-only, admin-only): list of campus links, signup counts per institution, activation rate per campus, top decks being studied. This feeds the institutional sales conversation.
  (4) Faculty deck sharing: a special deck permission level — "faculty-shared" — that makes a deck accessible to all users who signed up via a specific campus link. Lets professors share a deck with their entire class without making it fully public.
- **Acceptance Criteria:**
  - Campus referral link creates correctly tagged users with 30-day Pro trial
  - Admin dashboard shows per-campus signup and activation metrics
  - Faculty-shared deck visible only to campus-linked users, not the public explore page
  - Campus banner appears and dismisses correctly

---

---

## Phase 5 — UX Polish, Content Expansion & Quiz Mode
### Target: Month 4–6 post-launch | Gate: Phase 4 QA sign-off (TASK-042)
### Source: Founder brief 2026-05-04

### Execution Order
Implement in this sequence. TASK-040, TASK-042, and TASK-045 are deferred until
after TASK-052 is complete and signed off.

| Order | Task | Note |
|-------|------|------|
| 1 | TASK-044 | Campus ambassador tooling |
| 2 | TASK-046 | Splash page redesign |
| 3 | TASK-047 | Settings redesign |
| 4 | TASK-048 | Report a profile |
| 5 | TASK-049 | Report a deck |
| 6 | TASK-050 | Mobile bottom nav |
| 7 | TASK-051 | Explore redesign |
| 8 | TASK-052 | Quiz mode |
| — | TASK-045 | 7-day forecast (after TASK-052) |
| — | TASK-040 | iOS/iPad app (after TASK-052) |
| — | TASK-042 | Full web i18n QA (after TASK-052) |
| — | TASK-053 | Phase 5 QA gate (final) |

---

### TASK-045
- **Title:** Dashboard forecast — trim to 7-day view
- **Owner:** Frontend
- **Priority:** Medium
- **Dependencies:** TASK-043 (Advanced SRS Analytics complete)
- **Description:** The "Due Forecast" bar chart on the dashboard currently shows 14 days. Shorten the window to 7 days so it reads as a weekly view (Mon–Sun or Today + 6). This makes the chart feel actionable rather than overwhelming. Also label days as Mon/Tue/Wed etc. when the window is exactly 7 days (instead of "Jan 5", "Jan 6") so the user immediately reads it as a week.
  (1) Change the forecast API response from 14 entries to 7 (`/api/stats/srs` `forecast` array, currently built with a 14-day loop).
  (2) Update `ForecastChart` in `SRSStatsClient.tsx` to use short day-of-week labels for the 7-day window.
  (3) Today column remains highlighted indigo; remaining columns slate/indigo-200 as before.
- **Acceptance Criteria:**
  - Chart shows exactly 7 bars (today + 6 days)
  - Day labels are Mon/Tue/Wed/Thu/Fri/Sat/Sun (short weekday), not calendar dates
  - Today column is visually distinct
  - API returns 7 entries, not 14

---

### TASK-046
- **Title:** Splash/hook page redesign — auto-redirect, AI-forward layout
- **Owner:** Frontend
- **Priority:** Medium
- **Dependencies:** None
- **Description:** The current splash page (`SplashPage` component) requires the user to click a button to proceed to their deck list. This creates unnecessary friction. Replace it with an auto-redirect that takes the user directly to the deck list after a brief branded moment (1.5–2s). Redesign the splash content to reflect current product capabilities (AI generation, Anki import, SRS, multilingual).
  (1) Remove the CTA button — the page auto-navigates to the deck list after ~1.8s (or immediately on any tap/click).
  (2) Redesign the visual to highlight: AI flashcard generation, Anki import, spaced repetition, 5 languages. Use the existing indigo/violet gradient brand palette. Keep it under 4 lines of copy total.
  (3) Add a subtle animated progress indicator (thin bar or pulsing dots) so the user knows it's loading, not frozen.
  (4) If the user has no decks yet (first visit), show a slightly longer version (2.5s) with a "Getting started" headline.
- **Acceptance Criteria:**
  - No button required — page transitions automatically
  - Any tap or click skips the wait immediately
  - New copy references AI generation, Anki import, and SRS
  - Progress indicator visible during the wait
  - First-time users (0 decks) see the extended variant

---

### TASK-047
- **Title:** Settings page redesign — consolidated, clean UX
- **Owner:** Frontend
- **Priority:** Medium
- **Dependencies:** None
- **Description:** The current settings page is confusing — sections are scattered, visually heavy, and lack clear grouping. Redesign it as a clean single-column layout with logical section groupings. No new settings are added; this is a pure UX reorganisation.
  Proposed grouping:
  - **Account** — display name, email (read-only), profile photo, change password
  - **Study preferences** — daily review limit, study reminder time, catch-up mode toggle
  - **Appearance** — language/locale switcher, theme (if applicable)
  - **Subscription** — current plan badge, upgrade/manage billing button (links to Stripe portal)
  - **Privacy & Data** — download my data, delete account (destructive, red, requires confirmation)
  Each section gets a subtle card container, a section heading, and a divider. Related fields sit inside the same card. Destructive actions (delete account) are visually separated at the bottom and require a typed confirmation.
- **Acceptance Criteria:**
  - All existing settings accessible — nothing removed
  - 5 named sections, each in its own card
  - Delete account requires explicit text confirmation ("DELETE")
  - Mobile layout correct (single column, full-width cards)
  - No visual clutter — each setting has a label, optional sublabel, and one control

---

### TASK-048
- **Title:** Report a profile — user reporting flow + admin moderation
- **Owner:** Frontend + Backend
- **Priority:** Medium
- **Dependencies:** TASK-022 (GDPR/security complete)
- **Description:** Allow users to report another user's profile for abuse, spam, or inappropriate content. Build the full report → review → action loop.
  (1) **Report trigger:** "Report this profile" option in the three-dot menu on public profile pages. Opens a modal with a reason selector (Spam, Harassment, Inappropriate content, Impersonation, Other) and an optional free-text field (max 300 chars).
  (2) **API:** `POST /api/reports/profile` stores: reporter_user_id, reported_user_id, reason, description, created_at. Rate-limit: 5 reports per user per day.
  (3) **Admin panel:** `/admin/reports/profiles` lists open reports with: reported user, reporter, reason, description, date. Actions: Dismiss (no action), Warn user (trigger email), Suspend account (set `suspended_at`), Ban account (set `banned_at`).
  (4) **Suspension effect:** suspended users can still log in and access their own data but their public profile and decks are hidden from explore/search until suspension lifted.
  (5) **Notifications:** reporter receives an email "We've received your report and will review it." Admin receives a daily digest of new reports (not per-report to avoid noise).
- **Acceptance Criteria:**
  - Report modal accessible from any public profile page
  - Report saved to DB with all required fields
  - Rate limit enforced (5/day per reporter)
  - Admin list view shows all open reports with filter by status (open/dismissed/actioned)
  - Suspension hides profile and decks from public without deleting data
  - Reporter confirmation email sent

---

### TASK-049
- **Title:** Report a deck — deck reporting flow + admin moderation
- **Owner:** Frontend + Backend
- **Priority:** Medium
- **Dependencies:** TASK-048 (profile report infrastructure reusable)
- **Description:** Allow users to report a public deck for plagiarism, medical misinformation, or inappropriate content. Admin can remove or demote the deck.
  (1) **Report trigger:** "Report this deck" option in the deck's share/options menu on the explore page and on public deck detail pages. Opens a modal: reason selector (Medical misinformation, Plagiarism, Inappropriate content, Copyright violation, Spam, Other) + optional description (max 300 chars).
  (2) **API:** `POST /api/reports/deck` stores: reporter_user_id, deck_id, reason, description, created_at. Rate-limit: 3 deck reports per user per day.
  (3) **Admin panel:** `/admin/reports/decks` lists open deck reports. Actions: Dismiss, Warn creator, Remove from explore (sets `is_public = false` + `removal_reason`), Delete deck entirely.
  (4) **Creator notification:** when admin removes a deck from explore, the creator receives an email: "Your deck [title] has been removed from the Explore page. Reason: [reason]. You can appeal by replying to this email."
  (5) **Medical accuracy flag:** reports with reason "Medical misinformation" are automatically escalated (shown at top of admin queue with a red badge) because incorrect medical content poses a patient safety risk.
- **Acceptance Criteria:**
  - Report modal on explore page deck cards and deck detail pages
  - Medical misinformation reports auto-escalated in admin queue
  - Admin can remove deck from explore without deleting user's private copy
  - Creator email sent on removal with reason
  - Rate limit enforced

---

### TASK-050
- **Title:** Mobile navbar redesign — minimal 4-tab bottom nav, settings in dashboard
- **Owner:** Frontend
- **Priority:** Medium
- **Dependencies:** None
- **Description:** The current mobile navbar is a shrunk version of the desktop nav and carries too many items. Redesign for mobile-native navigation patterns.
  (1) **Bottom navigation bar** (mobile only, `sm:hidden`): 4 tabs only — Dashboard, My Decks, Explore, Profile. Each tab has an icon + label. Active tab is indigo. No Settings tab.
  (2) **Settings access on mobile:** add a gear icon button in the top-right of the Dashboard page header (mobile only). Tapping it navigates to settings. This pattern matches iOS Settings conventions.
  (3) **Top navbar on mobile:** simplify to logo + locale switcher + notification bell only. Remove all text links (they move to the bottom nav).
  (4) **Desktop nav:** unchanged — keep the current horizontal top nav with all items.
  (5) Ensure the bottom nav does not overlap page content — add `pb-20` padding to pages when on mobile.
- **Acceptance Criteria:**
  - Bottom nav visible only on mobile (`< sm` breakpoint), hidden on desktop
  - Exactly 4 tabs: Dashboard, My Decks, Explore, Profile
  - Settings accessible via gear icon inside Dashboard header (mobile)
  - Active tab highlighted correctly
  - No page content hidden behind bottom nav
  - Desktop nav visually unchanged

---

### TASK-051
- **Title:** Explore page redesign — topic-agnostic, feed layout, global search
- **Owner:** Frontend + Backend
- **Priority:** High
- **Dependencies:** TASK-050 (mobile nav, explore is a primary tab)
- **Description:** The current explore page has a rigid medical/pharmacy topic structure with header sections that limits discoverability. Redesign as an open, feed-style page.
  (1) **Remove subject header sections** — no more "Medicine", "Pharmacy", "Chemistry" grouping at the top. All decks enter a single unified feed.
  (2) **Open taxonomy:** add new subjects/tags to support non-medical content: Languages (French, Spanish, Japanese, etc.), Law, Natural Sciences, History, Mathematics, Computer Science, and a catch-all "Other". Update the deck creation form's subject selector to include these.
  (3) **Feed layout:** card-based feed resembling X/Twitter — each deck card is a compact row (emoji, title, creator handle, card count, copy count, subject tag, like/bookmark). Infinite scroll or "Load more" pagination. No fixed category headers.
  (4) **Trending / Recent tabs:** two feed views — "Trending" (sorted by copy_count + recency score) and "Recent" (sorted by created_at desc). Tab switcher at the top of the feed.
  (5) **Global search:** a full-width search bar at the top of Explore. Searches across deck titles, descriptions, and creator names in real time (debounced, 300ms). Results show both decks and user profiles.
  (6) **User profile search results:** show creator avatar/initials, handle, deck count, follower count (if implemented). Clicking a profile navigates to their public profile page.
  (7) **Filter pill row** (below search): Subject pills (scrollable horizontal list) — All, Languages, Medicine, Law, Natural Sciences, Computer Science, etc. Selecting a pill filters the feed. Multiple pills can be active simultaneously.
- **Acceptance Criteria:**
  - No hardcoded subject sections — single unified feed
  - At least 10 subject tags available in deck creation and filter pills
  - Search returns deck + profile results, debounced
  - Trending and Recent tabs both functional with real data
  - Feed renders correctly on mobile (bottom nav + feed, no horizontal overflow)
  - Filter pills scroll horizontally on mobile without wrapping

---

### TASK-052
- **Title:** Quiz decks — standalone MCQ type, SM-2 integration, Turbo mode, AI + manual creation
- **Owner:** Frontend + Backend
- **Priority:** High
- **Dependencies:** TASK-051 (explore filter row), TASK-004 (SM-2 algorithm)
- **Description:** Introduce Quiz Decks as a **completely separate entity from Flashcard Decks**. A quiz deck cannot contain flashcards; a flashcard deck cannot contain quiz questions. They are parallel content types that share the same owner/user model and explore page but have distinct schemas, creation flows, and study modes.

  **Data model (new tables):**
  - `quiz_decks (id, user_id, title, description, color, emoji, is_public, slug, subject, created_at, updated_at)` — mirrors the `decks` table structure but is a separate table. No foreign key to `decks`.
  - `quiz_questions (id, quiz_deck_id, user_id, question_text, correct_answer, option_a, option_b, explanation, ai_generated, created_at, updated_at)` — 3-option MCQ: `correct_answer` is one of `option_a | option_b | correct_answer` (the correct answer is always stored explicitly; the 3 displayed options are `correct_answer`, `option_a`, `option_b`, shuffled on render).
  - `quiz_srs_state (question_id, user_id, interval, ease_factor, due_date, review_count, created_at, updated_at)` — SM-2 state per question per user. Correct answer = "good" grade (SM-2 grade 4); wrong answer = "again" (SM-2 grade 1). This mirrors `srs_state` for flashcards exactly.
  - `quiz_review_log (id, question_id, user_id, correct, reviewed_at)` — audit log for quiz attempts.

  **Creation flows:**
  - (1) **"New Quiz Deck" button** — separate from "New Deck" button in My Decks. Opens a creation form identical in structure to BoxForm (name, description, colour, emoji) but creates a `quiz_deck` row.
  - (2) **Manual question creation:** inside a quiz deck, an "Add Question" form takes: question text, correct answer, option A, option B, optional explanation. User can add as many questions as needed. Each question is stored in `quiz_questions`.
  - (3) **AI question generation:** "Generate with AI" button (same UX as flashcard AI generator). User pastes notes or a topic; AI generates N questions each with question text, correct answer, two plausible distractors, and a 1–2 sentence explanation. User reviews and accepts/edits before saving. Counts against the same AI quota (Free: 189 AI items/month, Pro: unlimited).

  **Study modes for quiz decks:**
  - (4) **SRS Quiz mode (default):** fetches due questions from `quiz_srs_state` (same SM-2 scheduling logic as flashcard SRS). Presents each as a 3-option MCQ — options shuffled randomly on each render. Correct → SM-2 grade 4 (good); Wrong → SM-2 grade 1 (again) + correct answer revealed + explanation shown. Session ends when all due questions answered.
  - (5) **Turbo Quiz mode:** all questions in the deck, no scheduling, rapid fire. Same 3-option MCQ UI. Score screen at end (X/N correct, time taken). Does not update SM-2 state — Turbo is practice-only, no scheduling side effects.

  **UI/UX — Quiz Deck pages:**
  - (6) My Decks page shows both flashcard decks and quiz decks in the same grid. Quiz decks have a distinct badge ("Quiz") in the top-right corner of their card so users can distinguish them at a glance.
  - (7) The mode selector for quiz decks shows "SRS Quiz" and "Turbo Quiz" — not "SRS Review" and "Cram" (those are flashcard modes only).
  - (8) Quiz question list view (inside a quiz deck) shows question text, correct answer, and an expand toggle for options + explanation — mirrors CardItem layout.

  **Explore integration:**
  - (9) Public quiz decks appear in the Explore feed alongside flashcard decks. Each quiz deck card shows the "Quiz" badge. The "Quiz" filter pill in Explore (TASK-051) filters to show only quiz decks.

  **AI quota:**
  - (10) Each AI-generated question counts as 1 unit against the monthly AI quota (same pool as flashcard AI generation).

- **Acceptance Criteria:**
  - `quiz_decks`, `quiz_questions`, `quiz_srs_state`, `quiz_review_log` tables created and migrated
  - Quiz decks and flashcard decks are fully separate — no shared rows, no cross-type contamination
  - 3-option MCQ renders with shuffled options on each question load
  - Correct answer triggers SM-2 grade 4; wrong answer triggers SM-2 grade 1
  - Turbo Quiz mode completes without writing to `quiz_srs_state`
  - AI generation produces question + correct answer + 2 distractors + explanation
  - AI quota correctly debited
  - Quiz decks visible in Explore with "Quiz" badge
  - "Quiz" filter pill in Explore shows only quiz decks (no flashcard decks)
  - My Decks page shows both types with clear visual distinction

---

### TASK-053
- **Title:** Phase 5 QA — full regression across web (all locales, all new features)
- **Owner:** QA Tester
- **Priority:** High
- **Dependencies:** TASK-044, TASK-046–052 (all complete); TASK-040, TASK-042, TASK-045 run in parallel or after
- **Description:** Full QA gate for Phase 5 web features before Phase 6. iOS QA (TASK-042 + TASK-040) runs separately on its own track.
  (1) Re-run the P0 web checklist in all 5 locales after all Phase 5 changes.
  (2) New feature QA: splash auto-redirect, settings redesign, report flows (profile + deck), mobile bottom nav, explore redesign (feed, search, filter pills), quiz mode (SRS + Turbo, creation, AI generation).
  (3) Admin panel: verify report queues for both profile and deck reports, test all moderation actions (dismiss, warn, suspend, remove).
  (4) Cross-feature: quiz deck creation and study in all 5 locales (quiz strings translated), explore search returns deck and profile results, filter pills work correctly for both flashcard and quiz deck types.
  (5) My Decks page: flashcard decks and quiz decks coexist without confusion, badges correct, no cross-type contamination.
- **Acceptance Criteria:**
  - All P0 flows pass on Chrome, Safari, Firefox (desktop + mobile web)
  - All Phase 5 web features pass their acceptance criteria
  - Admin moderation flows tested end-to-end
  - Quiz decks and flashcard decks confirmed fully separate in all flows
  - QA sign-off logged in dev/progress.md

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
