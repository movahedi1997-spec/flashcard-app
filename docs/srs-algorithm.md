# Spaced Repetition Algorithm

FlashcardAI uses the **SM-2 algorithm** (SuperMemo 2, Wozniak 1990), adapted for a four-button grading UI following Anki's conventions.

The implementation lives in [`lib/srs.ts`](../lib/srs.ts) and is a **pure module** — no database calls, no side effects. All persistence is handled by `POST /api/study/grade`.

---

## References

- [Original SM-2 specification — Wozniak, 1990](https://www.supermemo.com/en/archives1990-2015/english/ol/sm2)
- [Anki's scheduling FAQ (hard/easy button adaptations)](https://faqs.ankiweb.net/what-spaced-repetition-algorithm.html)

---

## Core concepts

**Interval** — number of days until the card is shown again.

**Ease factor (EF)** — a per-card multiplier that grows when you recall easily and shrinks when you struggle. Clamped to a minimum of **1.3** so cards never become unschedulable. New cards start at **2.5**.

**Review count** — how many times the card has been answered correctly in succession. Resets to 0 on *Again*.

---

## Grade mapping

The UI presents four buttons. Internally each maps to an SM-2 quality score (0–5):

| Button | Quality (q) | Meaning |
|---|---|---|
| Again | 0 | Complete blackout — forgot entirely |
| Hard | 2 | Recalled, but with painful difficulty |
| Good | 4 | Recalled with some hesitation |
| Easy | 5 | Instant, effortless recall |

---

## Ease factor update

Applied after every grade:

```
EF' = EF + (0.1 − (5 − q) × (0.08 + (5 − q) × 0.02))
EF' = max(1.3, EF')
```

| Grade | Δ EF (starting from 2.5) |
|---|---|
| Again (q=0) | −0.80 → EF = 1.70 |
| Hard (q=2) | −0.14 → EF = 2.36 |
| Good (q=4) | +0.10 → EF = 2.50 (no change at q=4, which is intended) |
| Easy (q=5) | +0.10 → EF = 2.60 |

> **Note:** The original SM-2 spec does not modify EF on failed recalls (q < 3). This implementation applies the penalty on *Again* and *Hard* as Anki does, leading to more conservative scheduling for consistently difficult cards.

---

## Interval rules

### Again

```
interval    = 1
reviewCount = 0   ← resets the learning sequence
```

The card is scheduled for tomorrow and treated as new.

### Hard

```
interval    = max(1, round(prevInterval × 1.2))
reviewCount = reviewCount + 1
```

Interval grows by only 20% — less than a normal *Good* progression — providing extra exposure for shaky material. The ease factor drop further slows long-term scheduling.

### Good

```
reviewCount = 0  →  interval = 1
reviewCount = 1  →  interval = 6
reviewCount ≥ 2  →  interval = round(prevInterval × newEF)
reviewCount = reviewCount + 1
```

This is the standard SM-2 fixed-start sequence: 1 day → 6 days → then exponential growth driven by the ease factor.

### Easy

Same as *Good*, then multiplied by the **easy bonus (1.3)**:

```
interval = round(goodInterval × 1.3)
```

An easy card grows roughly 30% faster than a good one at the same stage.

---

## Due date calculation

After computing the new interval, the due date is set to:

```
dueDate = today + newInterval days, normalised to midnight (00:00:00)
```

All cards due on the same calendar day share the same midnight cutoff, so the session endpoint can fetch them with a single `WHERE due_date <= NOW()` query.

---

## Session modes

### SRS mode (default)

Returns only cards where `due_date <= today`. Limited to **50 cards per day** per user (configurable via `DAILY_REVIEW_LIMIT` env var).

### Turbo mode

Returns all cards in a deck, ignoring due dates. Used for cramming or reviewing a deck before an exam.

### Smart Catch-Up mode

Activated automatically when a user has more than **50 overdue cards**. Returns only the 20 highest-priority cards, prioritised by:

```
priority = (days overdue)^1.5
```

The 1.5 exponent means severely overdue cards dominate the queue:

| Days overdue | Score |
|---|---|
| 1 day | 1.0 |
| 2 days | 2.8 |
| 5 days | 11.2 |
| 10 days | 31.6 |

---

## Interval preview

Before grading, the study UI shows what interval each button would produce. This is computed by `previewIntervals()` — calling `schedule()` four times with the card's current state — and rendered as button labels:

```
Again → 1d   |   Hard → 3d   |   Good → 7d   |   Easy → 9d
```

The preview for the *next* card is returned in the `POST /api/study/grade` response (field: `preview`) so the client can pre-render it without an extra round-trip.

---

## Interval formatting

`formatInterval(days)` converts raw day counts to human-readable labels:

| Days | Label |
|---|---|
| 1 | `1d` |
| 6 | `6d` |
| 14 | `2w` |
| 60 | `2mo` |
| 365 | `1.0y` |

---

## Example scheduling trace

Starting state: `{ interval: 1, easeFactor: 2.5, reviewCount: 0 }` (brand new card)

| Review # | Grade | New interval | New EF | New reviewCount |
|---|---|---|---|---|
| 1 | Good | 1d | 2.50 | 1 |
| 2 | Good | 6d | 2.50 | 2 |
| 3 | Good | 15d | 2.50 | 3 |
| 4 | Hard | 18d | 2.36 | 4 |
| 5 | Good | 42d | 2.36 | 5 |
| 6 | Again | 1d | 1.76 | 0 ← reset |
| 7 | Good | 1d | 1.86 | 1 |
| 8 | Good | 6d | 1.96 | 2 |
| 9 | Easy | 15d | 2.06 | 3 |
