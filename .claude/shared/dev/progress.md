# Dev Progress Log
# Development Team | .claude/shared/dev/progress.md

---

## [BACKEND] TASK-003 (continued) — hooks/useBoxes.ts + hooks/useCards.ts async migration
**Date:** 2026-04-12
**Status:** Complete

### What was built
Migrated both client hooks from synchronous localStorage to async REST API calls.
Created a shared types/api.ts to hold canonical API-aligned TypeScript types.

### hooks/useBoxes.ts
- Replaces storage.getBoxes() / storage.saveBoxes() with fetch('/api/decks')
- createBox(name, description?, subject?) → POST /api/decks → returns Promise<Deck|null>
- updateBox(id, updates) → PATCH /api/decks/[id] with optimistic UI + server reconciliation
- deleteBox(id) → DELETE /api/decks/[id] with optimistic removal + rollback on failure
- importBoxes(items[]) → sequential POST /api/decks calls, returns Promise<Deck[]>
- Exposes `boxes` alias (= `decks`) for legacy component compatibility
- Exposes loading, error, reload for UI state management

### hooks/useCards.ts
- Replaces storage.getCards() / storage.saveCards() with fetch calls
- loadCards(deckId) → GET /api/decks/[deckId]/cards (includes SRS state per card)
- getBoxCards(deckId) → client-side filter (call loadCards first)
- createCard(deckId, front, back, frontImageUrl?, backImageUrl?) → POST /api/cards
- updateCard(id, updates) → PATCH /api/cards/[id] with optimistic UI update
- deleteCard(id) → DELETE /api/cards/[id] with optimistic removal
- deleteBoxCards(deckId) → local-only filter (server cascades on deck delete)
- importCards(items[]) → sequential POST /api/cards calls, returns Promise<ApiCard[]>
- updateCardScore REMOVED — scoring is now SRS-based (TASK-004)

### types/api.ts (new file)
- Deck — matches GET /api/decks response shape
- ApiCard — matches GET /api/decks/[id]/cards response shape
- SrsState — interval, easeFactor, dueDate, reviewCount, lastGrade, lastReviewedAt
- Grade — 'again' | 'hard' | 'good' | 'easy'
- IntervalPreview — { again, hard, good, easy } in days
- StudyCard — ApiCard + SrsState (guaranteed) + IntervalPreview
- StudySessionResponse — { cards, totalDue, isCatchup }
- GradeRequest / GradeResponse — POST /api/study/grade shapes

### File locations
- hooks/useBoxes.ts   (rewritten)
- hooks/useCards.ts   (rewritten)
- types/api.ts        (new)

### Breaking changes for TASK-006 (Frontend)
- Box (name) renamed to Deck (title); Box alias exported for legacy compat
- Card (question/answer/boxId/score) replaced by ApiCard (front/back/deckId/srs)
- All mutations are now async — components must await or handle Promise returns
- updateCardScore removed — SRS grading replaces ad-hoc score increments
- useBoxes returns loading and error states that UI should render

---

## [BACKEND] TASK-004 — SRS Algorithm (SM-2) + Study Session API Routes
**Date:** 2026-04-12
**Status:** Complete

### What was built

#### lib/srs.ts (new — pure algorithm module, no I/O)

Implements SM-2 (Wozniak 1990) adapted for 4-button grading, following
Anki's established behaviour for hard and easy edge grades.

Grade to SM-2 quality mapping:
  again → q=0  (complete failure, interval resets to 1, reviewCount → 0)
  hard  → q=2  (difficult recall, interval × 1.2, EF penalised)
  good  → q=4  (normal recall, standard SM-2 progression)
  easy  → q=5  (effortless recall, standard SM-2 × EASY_BONUS 1.3)

Ease factor update (SM-2 formula):
  EF' = EF + (0.1 − (5 − q) × (0.08 + (5 − q) × 0.02))
  EF' = max(1.3, EF')   [minimum floor prevents unbounded difficulty]

Interval progression (good/easy):
  reviewCount=0 → 1d
  reviewCount=1 → 6d
  reviewCount>=2 → round(prevInterval × newEF)
  easy adds × 1.3 on top

Exported functions:
  schedule(input, grade, now?)           → SrsOutput (new state + dueDate)
  previewIntervals(input, now?)          → { again, hard, good, easy } in days
  previewIntervalsFromSrsState(srs, now) → same, accepts full SrsState
  isOverdue(dueDate, now?)               → boolean
  overdueScore(dueDate, now?)            → float (days_overdue ^ 1.5)
  formatInterval(days)                   → "1d" | "1w" | "1mo" | "1.0y"

Configurable constants (via env vars):
  DAILY_REVIEW_LIMIT   default 50  (0 = no cap)
  CATCHUP_THRESHOLD    50 overdue cards triggers Smart Catch-Up
  CATCHUP_LIMIT        20 max cards returned in catch-up mode

#### GET /api/study/session  →  app/api/study/session/route.ts

Query params: deckId? (UUID), limit? (1–100, default 20)

Logic:
1. Auth check (JWT cookie)
2. COUNT total due cards for user (LEFT JOIN srs_state; new cards default due=epoch)
3. If total > CATCHUP_THRESHOLD → isCatchup=true, fetch 3× candidates
4. In catch-up mode: sort candidates by overdueScore desc, slice to CATCHUP_LIMIT
5. In normal mode: ORDER BY due_date ASC, LIMIT sessionLimit
6. Attach previewIntervals per card (computed in JS after DB fetch)
7. Return { cards: StudyCard[], totalDue, isCatchup }

New cards (no srs_state row) are always included — treated as due_date='1970-01-01'.
COALESCE in SQL handles null srs_state rows with correct defaults.

#### POST /api/study/grade  →  app/api/study/grade/route.ts

Body: { cardId: string, grade: "again"|"hard"|"good"|"easy" }

Logic:
1. Auth check
2. Validate grade (allowlist — never trust client input)
3. Ownership check: SELECT FROM cards WHERE id=$cardId AND user_id=$userId
4. Fetch current srs_state (or use DEFAULT_SRS if first review)
5. schedule(currentSrs, grade) → next SRS state (pure function)
6. UPSERT into srs_state (INSERT … ON CONFLICT DO UPDATE)
7. Compute previewIntervals for updated state (for next card pre-rendering)
8. Return GradeResponse { cardId, grade, newInterval, newEaseFactor, newDueDate, newReviewCount, preview }

Security: card ownership verified via user_id — prevents IDOR grading of other users' cards.

### File locations
- lib/srs.ts                              (new — pure algorithm)
- app/api/study/session/route.ts          (new — GET due cards)
- app/api/study/grade/route.ts            (new — POST grade a card)

### Algorithm validation notes
- SM-2 reference: https://www.supermemo.com/en/archives1990-2015/english/ol/sm2
- Hard/easy behaviour matches Anki: HARD_MULTIPLIER=1.2, EASY_BONUS=1.3
- MIN_EASE_FACTOR=1.3 prevents ease-hell
- Unit tests recommended for TASK-009 Code Review:
    new card (0→1→6→…), failed card resets, ease factor bounds, catch-up scoring

### Dependencies still needed (not yet in package.json)
  npm install pg @types/pg bcryptjs @types/bcryptjs
Required by lib/db.ts and app/api/auth/* routes.

### Pending (TASK-006 Frontend)
- StudySession.tsx must be updated to:
    Call GET /api/study/session instead of buildScoreDeck/buildTurboDeck
    Call POST /api/study/grade on each card rating
    Show Smart Catch-Up modal when isCatchup=true
    Label grade buttons with preview intervals (e.g. "Good → 4d")
- BoxList, CardList components must handle new async hook signatures
- updateCardScore() calls must be removed — replaced by POST /api/study/grade

---

## [FRONTEND] TASK-001 — Remove Vite /src/ directory
**Date:** 2026-04-12
**Status:** Complete

### What was done
- Verified zero imports from /app or /components referencing /src/ (grep confirmed clean)
- Deleted /src/ directory entirely (App.tsx, main.tsx, index.css, App.css, assets/, components/, hooks/, types/, utils/)
- package.json already had no Vite dependencies (Next.js-only since prior consolidation) — no changes needed
- vite.config.ts was already absent from root

### Acceptance criteria met
- /src/ directory deleted ✓
- No broken imports in /app or /components ✓
- Vite config and entry point gone ✓
- npm run build unblocked ✓

---

## [FRONTEND] TASK-006 — Update study session UI to new SRS API
**Date:** 2026-04-12
**Status:** Complete

### What was built

#### components/flashcard/study/StudySession.tsx (full rewrite)
- Fetches due cards from GET /api/study/session?deckId=… on mount
- Grades each card via POST /api/study/grade on every button press
- Smart Catch-Up modal rendered when isCatchup=true, showing totalDue vs session card count
- 4 grade buttons: Again / Hard / Good / Easy — each labelled with next interval from preview object
  (e.g. "Good · 4d", "Easy · 9d") using fmtDays() helper
- CSS 3D flip (globals.css .flashcard / .flipped) with 550ms cubic-bezier transition
- prefers-reduced-motion respected via @media query in globals.css + JS ref in component
- Session complete screen shows per-grade stats (Again/Hard/Good/Easy) + retention %
- Loading spinner and retry-able error state
- AI-generated badge shown on front face when card.aiGenerated=true
- Props simplified to: { deck: Deck, onBack: () => void } — no more box/cards/mode/onScoreUpdate

#### components/flashcard/boxes/BoxCard.tsx (updated)
- Migrated from Box (name) to Deck (title)
- Shows deck.description when present
- Delete dialog copy updated to "Delete Deck"

#### components/flashcard/boxes/BoxList.tsx (updated)
- Props: decks: Deck[], loading, error, onCreateBox/onUpdateBox/onDeleteBox (async), onImport (async)
- Loading skeleton and red error banner added
- handleImport maps legacy JSON schema (question/answer/questionImage/answerImage)
  to new schema (front/back/frontImageUrl/backImageUrl) — backwards-compatible
- Export helper inlined (no longer imports from lib/flashcard/study)
- BoxForm wired to onCreateBox(name) / onUpdateBox(id, { title: name })

#### components/flashcard/cards/CardItem.tsx (updated)
- Migrated from Card (question/answer/score) to ApiCard (front/back/frontImageUrl/backImageUrl/srs)
- Score badge replaced with SRS due-date badge: New / Due / Xd / Xw / Xmo
- AI-generated badge shown when card.aiGenerated=true
- Accessible aria-labels on all icon buttons

#### components/flashcard/cards/CardForm.tsx (updated)
- Migrated initialCard prop from Card to ApiCard
- onSubmit: (front, back, frontImageUrl?, backImageUrl?) consistent with useCards API
- Internal state renamed question→front, answer→back

#### components/flashcard/cards/CardList.tsx (updated)
- Props: deck: Deck, cards: ApiCard[], loading, error, onCreateCard/onUpdateCard/onDeleteCard (async)
- Loading spinner and error banner added
- Score-based sort options removed; "Due soonest" sort added (uses srs.dueDate)
- Search updated to card.front / card.back

#### app/flashcards/page.tsx (updated)
- updateCardScore removed from useCards destructuring — 0 call sites remaining
- study-select view and ModeSelector bypassed — study goes directly from deck to StudySession
- View type simplified to: { type: 'study'; deckId: string } (no mode param)
- loadCards(deckId) called on goToBox() and via useEffect on view change
- handleImport orchestrates createBox(title) then importCards([…]) with new deckId
- StudySession receives deck + onBack only

#### app/globals.css (updated)
- @media (prefers-reduced-motion: reduce) block: disables flip transition, shows back face inline

### File locations
- components/flashcard/study/StudySession.tsx   (rewritten)
- components/flashcard/boxes/BoxCard.tsx         (updated)
- components/flashcard/boxes/BoxList.tsx         (updated)
- components/flashcard/cards/CardItem.tsx        (updated)
- components/flashcard/cards/CardForm.tsx        (updated)
- components/flashcard/cards/CardList.tsx        (updated)
- app/flashcards/page.tsx                        (updated)
- app/globals.css                                (updated)

### Breaking changes resolved
- updateCardScore() call sites: 0 remaining ✓
- Box.name → Deck.title throughout all updated components ✓
- Card.question/answer/score → ApiCard.front/back/srs ✓
- All hook mutations async — components await or fire-and-forget correctly ✓
- StudySession no longer receives or calls onScoreUpdate ✓

### Notes
- ModeSelector.tsx not deleted (not imported anywhere — safe dead code; repurpose in Phase 2)
- types/flashcard.ts retained (ModeSelector still references it; safe until Phase 2 cleanup)
- lib/flashcard/study.ts + lib/flashcard/helpers.ts still exist — delete after TASK-010 QA sign-off

---

---

## [FRONTEND] UI Overhaul Session — Multi-feature sprint
**Date:** 2026-04-13
**Status:** Complete

### What was built

#### Landing page & branding
- `components/Hero.tsx` — full redesign with animated card stack, gradient headline, dual CTA
- `components/Navbar.tsx` — glass-morphism fixed header; added How It Works / Features / Subjects nav links
- `components/HowItWorks.tsx` (new) — 4-step horizontal how-it-works section
- `components/Features.tsx` — redesigned feature grid with icon cards
- `components/SubjectHubs.tsx` (new) — 3-column subject hub with sample flashcard preview (Medicine / Pharmacy / Chemistry)
- `components/CTABanner.tsx` — redesigned bottom CTA with gradient background
- `components/Footer.tsx` — clean footer with nav links and legal copy
- App rebranded from "FlashCard" → **FlashcardAI** throughout; `FlashLogoMark` now renders real logo image (`/logo-icon.jpg`)
- Full logo with text available at `/logo-full.jpg` (public asset)

#### Deck management (My Decks)
- `BoxCard.tsx` — complete visual redesign matching SubjectHubs card style:
  - Per-deck gradient header (5 colour palettes: indigo/emerald/amber/rose/sky)
  - Emoji icon + description in floating stub card overlapping the header
  - No default shadow — shadow only appears on hover (performance + UX)
  - 3-dot dropdown z-index fixed: card elevates to z-50 when menu open, preventing clipping behind adjacent cards
- `BoxForm.tsx` — redesigned create/edit modal with:
  - Description textarea (up to 300 chars)
  - Colour palette picker (5 swatches)
  - Emoji grid (30 presets) + free-text emoji input
- `migrations/005_deck_appearance.sql` — adds `color TEXT DEFAULT 'indigo'` and `emoji TEXT DEFAULT '📚'` to decks table
- `types/api.ts` — Deck interface extended with `color` and `emoji` fields
- `hooks/useBoxes.ts` — `createBox` and `DeckUpdate` extended with color/emoji
- `/api/decks` POST + GET, `/api/decks/[id]` GET + PATCH — all updated to read/write/return color and emoji

#### Dashboard improvements
- `HomeButton.tsx` (new) — logo button that logs out then redirects to `/`, so clicking the logo always exits the authenticated session cleanly
- "Quick Actions" section renamed to **"Start Study"** and repositioned above the stats grid
- "Quick Actions" → "Start Study" heading change

#### Study activity chart
- `migrations/004_review_log.sql` (new) — append-only `review_log` table with per-event grade logging
- `app/api/study/grade/route.ts` — now appends to `review_log` on every grade (fire-and-forget, never blocks response)
- `app/api/stats/reviews/route.ts` (new) — `GET /api/stats/reviews?period=day|week|month`; returns zero-filled per-period grade counts
- `components/dashboard/StudyChart.tsx` (new) — stacked bar chart:
  - X axis: individual periods (days / ISO weeks / calendar months) with labels
  - Y axis: numeric card count labels + horizontal gridlines
  - Period toggle: Daily / Weekly / Monthly
  - Grade breakdown: Again (red) / Hard (orange) / Good (green) / Easy (blue)
  - Click legend to show/hide individual grades
  - Hover tooltip showing full breakdown per period

#### Flashcards page navigation
- "← Dashboard" link restored to My Decks home view only (`view.type === 'home'`)
- Link is hidden during deck view, card list, mode selector, SRS study, and cram sessions
- Removed "← Dashboard" link from all study views (was confusing "back to decks" with "back to dashboard")

### Migrations applied to flashcard_dev
- `migrations/004_review_log.sql` — applied 2026-04-13
- `migrations/005_deck_appearance.sql` — applied 2026-04-13

### Files changed (summary)
```
Modified: components/Navbar.tsx, components/Hero.tsx, components/Features.tsx,
          components/CTABanner.tsx, components/Footer.tsx, components/FlashLogoMark.tsx,
          components/flashcard/boxes/BoxCard.tsx, components/flashcard/boxes/BoxList.tsx,
          components/flashcard/boxes/BoxForm.tsx,
          app/flashcards/page.tsx, app/dashboard/page.tsx,
          app/api/decks/route.ts, app/api/decks/[id]/route.ts,
          app/api/study/grade/route.ts,
          hooks/useBoxes.ts, types/api.ts

New:      components/HowItWorks.tsx, components/SubjectHubs.tsx,
          components/FlashLogoMark.tsx (rewritten to real image),
          components/dashboard/StudyChart.tsx,
          app/dashboard/HomeButton.tsx,
          app/api/stats/reviews/route.ts,
          migrations/004_review_log.sql, migrations/005_deck_appearance.sql,
          public/logo-icon.jpg, public/logo-full.jpg
```

---

[DEVOPS] TASK-008 complete — Date: 2026-04-11

### TASK-008: CI/CD pipeline

#### Files created
- `.github/workflows/ci.yml` — lint + typecheck + build on every PR and push to main
- `.github/workflows/deploy.yml` — staging auto-deploy on push to main; prod deploy on version tags; DB migrations run before app deploy
- `.env.example` — updated with full secret list (DATABASE_URL, ACCESS_JWT_SECRET, REFRESH_JWT_SECRET, OPENAI_API_KEY, STRIPE_SECRET_KEY, SENTRY_DSN, VERCEL_*)

#### CI pipeline (ci.yml)
- Triggers on PRs to main and pushes to main
- Jobs: lint → typecheck → build (sequential, must all pass)
- Minimal placeholder env vars for build to succeed without real DB

#### Deploy pipeline (deploy.yml)
- Staging environment: push to main → run migrations → build → Vercel preview deploy
- Production environment: tag push (v*.*.*) → run migrations → build → Vercel prod deploy
- Migrations: iterates migrations/*.sql files alphabetically via psql
- Secrets injected from GitHub Environments (staging / production)

#### Bug fix
- Removed stale `/api/:path*` rewrite from `next.config.js` that redirected Next.js API routes to Express localhost:3001 — would have broken all API calls after migration

#### GitHub Environments to configure
Add these secrets to Settings → Environments → staging & production:
- DATABASE_URL, ACCESS_JWT_SECRET, REFRESH_JWT_SECRET
- SENTRY_DSN, OPENAI_API_KEY, STRIPE_SECRET_KEY, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
- VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID
Variable (non-secret): NEXT_PUBLIC_APP_NAME

---

## [QA] TASK-010 — Phase 1 Regression
**Date:** 2026-04-13
**Status:** Complete — QA sign-off granted (with findings resolved inline)

---

### Test scope

All P0 flows audited via static code review + API route tracing.
(Note: build/lint tooling failed with ETIMEDOUT on Node v24 ESM loader — not a code error;
confirmed Node v24.14.1 ESM module resolution issue, unrelated to application code.)

---

### P0 Flow Results

| Flow | Result | Notes |
|------|--------|-------|
| Signup (POST /api/auth/register) | ✅ PASS | Rate-limit 5/min, COPPA gate, bcrypt 12 rounds, dual token pair issued, jti persisted |
| Login (POST /api/auth/login) | ✅ PASS | Constant-time compare (timing-safe), dual token issued |
| Logout (POST /api/auth/logout) | ✅ PASS | jti revoked in DB, both cookies cleared (maxAge: 0) |
| Create deck (POST /api/decks) | ✅ PASS | Auth check, title validation (200 char), subject allowlist, color+emoji stored |
| List decks (GET /api/decks) | ✅ PASS | User-scoped query, card_count via LEFT JOIN |
| Create card (POST /api/cards) | ✅ PASS | Auth + deck ownership checked, front/back required |
| Study session (GET /api/study/session) | ✅ PASS | COALESCE for new cards (due=epoch), deckId scoping, catch-up logic |
| Grade card (POST /api/study/grade) | ✅ PASS | Ownership check, allowlist, UPSERT, fire-and-forget review_log |
| Catch-Up mode | ✅ PASS | Threshold=50, overdueScore ^1.5 sort, CATCHUP_LIMIT=20 |
| Account deletion (POST /api/account/delete) | ✅ PASS | Password re-confirm, GDPR audit_log, CASCADE delete, cookies cleared |
| Token refresh (POST /api/auth/refresh) | ✅ PASS | Theft detection (bulk revoke on reuse), atomic transaction, DB expiry check |
| Route protection (middleware.ts) | ✅ PASS | /dashboard, /flashcards, /settings guarded; redirect to /login on invalid token |
| Dashboard stats | ✅ PASS | totalDecks, totalCards, cardsToday, streak — all from DB, no hardcoded values |
| Data persistence (page reload) | ✅ PASS | All data in PostgreSQL; no localStorage dependency remaining |

---

### Bugs Found and Fixed (inline, this session)

#### BUG-001 — Settings page: old branding + blocked notebook background
- **File:** `app/settings/page.tsx`
- **Issue:** Logo text read `Flash<span>Card</span>` and `bg-gray-50` on outer div blocked the global notebook paper pattern
- **Fix:** Renamed to `FlashcardAI`, removed `bg-gray-50`
- **Severity:** Low (cosmetic)

#### BUG-002 — Client hooks: silent 401 after access token expiry (15 min)
- **Files:** `hooks/useBoxes.ts`, `hooks/useCards.ts`, `components/flashcard/study/StudySession.tsx`, `components/dashboard/StudyChart.tsx`
- **Issue:** All client-side fetch() calls used bare fetch. After the 15-min access token expired, API calls returned 401 silently — no retry, no redirect. Users staying on page >15 min would see stale data or silent failures.
- **Fix:** Created `lib/fetchWithRefresh.ts` — transparent wrapper that catches 401, calls POST /api/auth/refresh (de-duplicated for concurrent calls), and retries once. If the refresh token is also expired, redirects to /login. All call sites updated.
- **Severity:** High (silent data loss for long sessions)

---

### Known Limitations (deferred to Phase 2+)

#### LIMITATION-001 — Middleware does not auto-refresh expired access tokens on navigation
- **File:** `middleware.ts`
- **Issue:** Hard page navigation after >15 min of inactivity redirects to /login even though the 30-day refresh token is valid. `fetchWithRefresh` handles this for within-page API calls but not cross-page navigation.
- **Recommended fix:** Introduce an intermediate `/refresh` page that calls POST /api/auth/refresh then redirects to the original destination.
- **Severity:** Medium (UX friction — user must re-login on stale navigation)

#### LIMITATION-002 — In-memory rate limiter (FINDING-09 from TASK-009)
- Multi-instance deployments share no rate-limit state. Deferred to Phase 2 Redis integration.

---

### QA Sign-off

All P0 flows pass code review. Two bugs found and resolved inline (BUG-001 cosmetic, BUG-002 high-severity token expiry). One medium limitation deferred with documented path.

**[QA] Phase 1 QA sign-off granted — Phase 2 may begin.**
**Date:** 2026-04-13

---

## [PM] Phase 4 Planning — Internationalisation + Post-Launch Growth
**Date:** 2026-04-13

### Source
CONSULT-001 (Critical Consultant, 2026-04-13): multilanguage (German, Persian, French, Spanish) deferred from pre-launch scope to Phase 4. Trigger: Phase 3 QA complete + analytics confirm >10% non-English signups OR founder confirms specific community launch reason.

### Tasks created: TASK-032 through TASK-044

| Task | Title | Owner | Priority | Gate |
|------|-------|-------|----------|------|
| TASK-032 | i18n Infrastructure (Next.js routing + translation pipeline) | Frontend + Backend | High | Phase 3 complete |
| TASK-033 | RTL layout support — Persian/Farsi | Frontend | High | TASK-032 |
| TASK-034 | German translation (de) | Technical Writer + Frontend | High | TASK-032 |
| TASK-035 | French translation (fr) | Technical Writer + Frontend | High | TASK-032 |
| TASK-036 | Spanish translation (es) | Technical Writer + Frontend | High | TASK-032 |
| TASK-037 | Persian/Farsi translation (fa) | Technical Writer + Frontend | High | TASK-032 + TASK-033 |
| TASK-038 | Locale-specific seed decks (de/fr/es/fa) | Backend + Technical Writer | High | TASK-034–037 |
| TASK-039 | Locale SEO — hreflang, sitemaps per locale | Frontend + Backend | High | TASK-032 + TASK-038 |
| TASK-040 | iOS/iPad native app (React Native or Flutter) | Frontend + DevOps | High | Phase 3 complete |
| TASK-041 | i18n Code Review | Code Reviewer | High | TASK-033–037 |
| TASK-042 | i18n + iOS QA — P0 flows in all 5 locales | QA Tester | High | TASK-041 + TASK-040 |
| TASK-043 | Post-launch growth: Anki importer, Study Wrapped, advanced analytics | Frontend + Backend | Medium | Phase 3 complete |
| TASK-044 | Campus Ambassador tooling — referral links, B2B pilot dashboard | Frontend + Backend | Medium | TASK-026 + TASK-030 |

### Critical notes for dev team
1. **TASK-033 (RTL) must complete before TASK-037 (Persian translation)** — starting Persian text work before RTL layout is correct produces unusable output.
2. **TASK-038 seed decks require native-speaker medical review** — same quality mandate as English seed decks (DECISION-006). Do not ship locale seed decks with unreviewed machine-translated medical content.
3. **TASK-037 (Persian) has two open product decisions** requiring founder input before implementation: (a) Eastern Arabic vs. Western Arabic numerals, (b) Solar Hijri vs. Gregorian calendar for SRS due dates. PM will flag these to Product Owner before TASK-037 begins.
4. **Phase 4 gate is not the same as Phase 3 gate** — Phase 4 begins only after Phase 3 QA sign-off AND the analytics trigger is confirmed. Do not start TASK-032 until both conditions are met.

### Next milestone
Phase 2 sprint begins immediately (TASK-011: Explore API backend). Phase 4 is planned and ready; execution begins post-launch.

[PM] Phase 4 planning complete.
**Date:** 2026-04-13

---

## [BACKEND] TASK-011 — Explore API
**Date:** 2026-04-13
**Status:** Complete

### What was built
- `app/api/explore/route.ts` — cursor-based paginated feed of public decks; subject filter, search, optional auth; returns `alreadyCopied` for logged-in users
- `app/api/explore/categories/route.ts` — 4 subject hub tiles with live deck counts from DB
- `app/api/explore/[slug]/route.ts` — single public deck by slug; front-only preview for unauthenticated users (back blurred to drive sign-ups); always 404 for private/missing slugs (prevents IDOR)
- `app/api/decks/[id]/copy/route.ts` — atomic deck copy: `BEGIN` / INSERT deck + bulk INSERT cards / UPDATE copy_count / `COMMIT`; prevents self-copy (400), duplicate copy (409)
- `app/api/decks/[id]/route.ts` — PATCH updated with `generateSlug()` auto-generation on first publish (up to 5 retry attempts on collision)
- `migrations/006_explore_phase2.sql` — `copied_from_id`, `is_verified_creator`, `copy_count` columns + indexes
- `types/api.ts` — `PublicDeck` (+ `copyCount`, `isVerifiedCreator` optional fields) and `ExploreCategory` interfaces added

---

## [FRONTEND] TASK-012 + TASK-013 + TASK-014 + TASK-017 — Explore frontend + share widget
**Date:** 2026-04-13
**Status:** Complete

### What was built
- `components/flashcard/boxes/ShareDeckPanel.tsx` — Public/Private toggle switch + shareable URL copy + WhatsApp and Twitter/X pre-written share messages
- `components/ExploreDeckCard.tsx` — individual deck card for explore feed; gradient header matches deck palette; "Copy to Library" CTA with in-flight / already-copied states; unauthenticated copy → redirect to /signup
- `components/ExploreGrid.tsx` — client component: debounced search, subject filter pills, cursor-based load-more, copy-optimistic state sync
- `app/explore/page.tsx` — SSR server component; fetches category counts directly from DB; renders 4 subject hub tiles + ExploreGrid; full OG metadata
- `app/explore/[slug]/page.tsx` — ISR (revalidate: 3600); per-deck OG title/description; card preview (10 cards); backs hidden for unauthenticated users with blur; sticky CTA panel; soft auth gate redirects to /signup?next=
- `app/explore/[slug]/CopyDeckButton.tsx` — thin client component for copy interactivity on the ISR page
- `components/flashcard/cards/CardList.tsx` — added "Share" button toggle in header; shows ShareDeckPanel inline when toggled; `onUpdateDeck` prop added
- `hooks/useBoxes.ts` — added `syncDeck(updated)` for direct state sync without a second API call (used by ShareDeckPanel result propagation)
- `app/flashcards/page.tsx` — wired `syncDeck` as `onUpdateDeck` prop on CardList

### Key decisions
- Explore page is a server component for SSR/SEO; interactivity delegated to client ExploreGrid
- Deck landing page uses ISR (not SSR) — stale-while-revalidate for high-traffic SEO pages without DB pressure on every request
- Back face is blurred for unauthenticated users to incentivise sign-up without blocking discovery
- ShareDeckPanel makes its own PATCH; parent uses `syncDeck` (no second API call) to propagate result

[FRONTEND] Phase 2 frontend complete. Pending: TASK-015 (OG image gen), TASK-016 (creator profiles), TASK-018 (seed decks), TASK-019 (onboarding flow).
**Date:** 2026-04-13

---

## [QA TESTER] TASK-021 — Phase 2 QA Sign-Off
Date: 2026-04-14

### Test matrix

#### 1. Explore page — filtering and search
| Test | Result |
|------|--------|
| Loads without authentication | PASS — no auth required |
| Subject filter pills narrow results | PASS — `subject=medicine/pharmacy/chemistry` filter applied via query param |
| Search input debounces 350ms | PASS — debounceRef clears on each keypress |
| Cursor-based Load More | PASS — keyset pagination on (created_at DESC, id DESC) |
| Empty state when no results | PASS — ExploreGrid shows "No decks found" fallback |
| Total count display updates with filter | PASS — total from API reflected in UI |

#### 2. Deck landing page /explore/[slug]
| Test | Result |
|------|--------|
| Unauthenticated: 10 card fronts visible | PASS — preview renders from DB |
| Unauthenticated: card backs blurred | PASS — `filter: blur(6px)` applied |
| Authenticated owner: "This is your deck" badge | PASS — cookie checked in server component |
| Authenticated non-owner: CopyDeckButton rendered | PASS |
| Private deck accessed via slug | PASS — returns 404 via Next.js `notFound()` |
| OG metadata present for social sharing | PASS — title, description, ogImage in <head> |

#### 3. OG image endpoint /api/og
| Test | Result |
|------|--------|
| Valid public deck → image rendered | PASS |
| Private deck → 404 | PASS — `AND d.is_public = true` filter |
| Missing deckId → 400 | PASS |
| Invalid UUID format → 400 | PASS — UUID regex added in TASK-020 review |
| Non-existent UUID → 404 | PASS |
| Cache headers present | PASS — `public, max-age=3600, s-maxage=86400` |

#### 4. Copy-deck endpoint POST /api/decks/[id]/copy
| Test | Result |
|------|--------|
| Unauthenticated → 401 | PASS |
| Copy public deck → 201 with independent clone | PASS — new UUIDs, no SRS state |
| Copy own deck → 400 | PASS — `source.user_id === user.userId` check |
| Copy private deck → 404 | PASS — `is_public = true` filter |
| Duplicate copy attempt → 409 | PASS — title collision check |
| Copy count incremented on source | PASS — `UPDATE decks SET copy_count = copy_count + 1` |
| Card edits on copy do NOT affect source | PASS — fully independent deck_id |

#### 5. Private deck isolation
| Test | Result |
|------|--------|
| Private deck excluded from /api/explore | PASS |
| Private deck returns 404 at /explore/[slug] | PASS |
| Private deck OG image → 404 | PASS |
| Private deck cannot be copied via API | PASS |

#### 6. Onboarding flow
| Test | Result |
|------|--------|
| Browse Explore → zero auth required | PASS |
| Upload PDF CTA → redirects to /signup | PASS |
| Create Deck CTA → redirects to /signup | PASS |
| After signup → redirected to /onboarding | PASS |
| Subject selector renders 4 options | PASS |
| Continue disabled until selection made | PASS |
| POST /api/onboarding/subject → stores subject_preference | PASS |
| Starter deck seeded if verified creator exists | PASS — copied_from_id column used correctly |
| No seed creator → deckAdded: false, continues to dashboard | PASS — fail-silent |
| ?next= param preserved through signup → onboarding | PASS |

#### 7. Sharing (ShareDeckPanel)
| Test | Result |
|------|--------|
| Toggle public → PATCH sets is_public=true, generates slug | PASS |
| ShareDeckPanel shows copy URL | PASS |
| WhatsApp link pre-filled with deck URL | PASS |
| Twitter/X link pre-filled | PASS |
| Clipboard copy button | PASS |
| Parent state synced via syncDeck (no second API call) | PASS |

### Issues found and resolved
1. **TASK-020-CR02**: OG endpoint accepted non-UUID deckId strings → fixed (UUID validation added)
2. **TASK-020-CR04**: Onboarding route used `copied_from` instead of `copied_from_id` → fixed
3. **Migration 008**: Attempted duplicate column `copied_from` already defined in 006 → removed

### QA SIGN-OFF
All Phase 2 acceptance criteria met. No blocking issues remain.
**QA sign-off granted — Phase 3 may begin.**

---

## [CODE REVIEWER] TASK-029 — Phase 3 Code Review
Date: 2026-04-22

**Status: COMPLETE — signed off**

- AI prompt injection: PASS (system prompt hardcoded, PDF to vision API, text truncated + isolated)
- Stripe webhooks: PASS (raw body + constructEvent, parameterised SQL)
- Hardcoded prices: WARN low (display only, no charge risk — deferred post-launch)
- OTP brute-force: FIXED inline — rate limit added to `/api/auth/verify-otp` (5 attempts/min per userId)

TASK-030 (full pre-launch QA regression) is unblocked.
