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
