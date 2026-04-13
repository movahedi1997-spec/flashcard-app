/**
 * lib/srs.ts
 * Server-side SM-2 Spaced Repetition Algorithm
 *
 * Implements the SuperMemo SM-2 algorithm (Wozniak, 1990) adapted for a
 * 4-button grading UI (again / hard / good / easy) as used in modern SRS
 * applications like Anki.
 *
 * References:
 *   • Original SM-2: https://www.supermemo.com/en/archives1990-2015/english/ol/sm2
 *   • Anki scheduling (hard/easy button behaviour):
 *     https://faqs.ankiweb.net/what-spaced-repetition-algorithm.html
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ALGORITHM SUMMARY
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Grade mapping to SM-2 quality score (q):
 *    again → q=0  (complete blackout — card failed)
 *    hard  → q=2  (recalled with heavy difficulty)
 *    good  → q=4  (recalled with some hesitation)
 *    easy  → q=5  (instant, perfect recall)
 *
 *  Ease factor update (SM-2 formula, applied for every grade):
 *    newEF = EF + (0.1 − (5 − q) × (0.08 + (5 − q) × 0.02))
 *    newEF = max(1.3, newEF)
 *
 *  Interval rules:
 *    again → interval=1, reviewCount resets to 0
 *    hard  → interval = max(1, round(prevInterval × 1.2))   [count continues]
 *    good  → SM-2 standard progression:
 *              reviewCount=0 → 1d
 *              reviewCount=1 → 6d
 *              reviewCount≥2 → round(prevInterval × newEF)
 *    easy  → same as good, then × EASY_BONUS (1.3)
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * PURE MODULE — no I/O, no database calls.
 * DB persistence is handled in app/api/study/grade/route.ts.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { Grade, SrsState, IntervalPreview } from '@/types/api';

// ── Types ─────────────────────────────────────────────────────────────────────

/** Subset of SrsState used as algorithm input (no timestamps needed). */
export interface SrsInput {
  interval: number;
  easeFactor: number;
  reviewCount: number;
}

/** Full output of schedule() — includes the computed due date. */
export interface SrsOutput extends SrsInput {
  dueDate: Date;
}

// ── Constants ─────────────────────────────────────────────────────────────────

/** Default SRS state for a card that has never been reviewed. */
export const DEFAULT_SRS: SrsInput = {
  interval: 1,
  easeFactor: 2.5,
  reviewCount: 0,
};

/** Ease factor floor — prevents cards from becoming near-impossible to schedule. */
const MIN_EASE_FACTOR = 1.3;

/**
 * SM-2 quality score for each grade button.
 * The formula uses values 0–5; we map our 4 grades onto that range.
 */
const QUALITY: Record<Grade, number> = {
  again: 0, // complete failure
  hard: 2, // borderline fail / painful recall
  good: 4, // correct with effort
  easy: 5, // effortless correct
};

/** Interval multiplier for "easy" grade (Anki default). */
const EASY_BONUS = 1.3;

/** Interval multiplier for "hard" grade (Anki default). */
const HARD_MULTIPLIER = 1.2;

/**
 * Daily session cap — total due cards shown per day per user.
 * Configurable via DAILY_REVIEW_LIMIT env var.
 * Set to 0 to disable the cap entirely.
 */
export const DAILY_REVIEW_LIMIT = parseInt(
  process.env.DAILY_REVIEW_LIMIT ?? '50',
  10,
);

/**
 * Catch-up threshold — if a user has more overdue cards than this number,
 * the session endpoint activates Smart Catch-Up mode and returns only the
 * highest-priority subset.
 */
export const CATCHUP_THRESHOLD = 50;

/**
 * Maximum cards returned in Smart Catch-Up mode.
 * Keeps sessions manageable for users returning after a long absence.
 */
export const CATCHUP_LIMIT = 20;

// ── Core Algorithm ────────────────────────────────────────────────────────────

/**
 * schedule — compute the next SRS state after grading a card.
 *
 * @param input  Current SRS state of the card for this user.
 * @param grade  Grade button the user pressed (again/hard/good/easy).
 * @param now    Reference timestamp — injectable for deterministic unit tests.
 *               Defaults to the current wall-clock time.
 * @returns      New SRS state including the computed due date.
 *
 * @example
 *   // First ever review of a new card, graded "good":
 *   const next = schedule({ interval: 1, easeFactor: 2.5, reviewCount: 0 }, 'good');
 *   // → { interval: 1, easeFactor: 2.5, reviewCount: 1, dueDate: <tomorrow> }
 *
 *   // Second review of the same card, graded "good":
 *   const next2 = schedule({ interval: 1, easeFactor: 2.5, reviewCount: 1 }, 'good');
 *   // → { interval: 6, easeFactor: 2.5, reviewCount: 2, dueDate: <+6 days> }
 */
export function schedule(
  input: SrsInput,
  grade: Grade,
  now: Date = new Date(),
): SrsOutput {
  const q = QUALITY[grade];
  const { interval, easeFactor, reviewCount } = input;

  // ── 1. Update ease factor (SM-2 formula) ─────────────────────────────────
  //   EF' = EF + (0.1 − (5 − q) × (0.08 + (5 − q) × 0.02))
  //   Clamped to MIN_EASE_FACTOR so cards never become unschedulably hard.
  // NOTE: Anki adaptation — original SM-2 does not change EF on q < 3 (failure).
  // We apply the penalty on 'again' (q=0) and 'hard' (q=2) for more conservative
  // scheduling. Ref: https://faqs.ankiweb.net/what-spaced-repetition-algorithm.html
  const rawEF = easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  const newEF = parseFloat(Math.max(MIN_EASE_FACTOR, rawEF).toFixed(4));

  // ── 2. Compute next interval ──────────────────────────────────────────────
  let newInterval: number;
  let newReviewCount: number;

  switch (grade) {
    case 'again':
      // Failed recall — restart the learning sequence from scratch.
      newInterval = 1;
      newReviewCount = 0;
      break;

    case 'hard':
      // Recalled but with painful difficulty.
      // Interval grows slightly (× 1.2) to give more exposure,
      // but the ease factor drop already ensures slower growth long-term.
      newInterval = Math.max(1, Math.round(interval * HARD_MULTIPLIER));
      newReviewCount = reviewCount + 1;
      break;

    case 'good':
    case 'easy': {
      // Standard SM-2 interval progression:
      //   1st successful review → 1 day
      //   2nd successful review → 6 days
      //   Subsequent reviews    → prevInterval × newEF
      let base: number;
      if (reviewCount === 0) {
        base = 1;
      } else if (reviewCount === 1) {
        base = 6;
      } else {
        base = Math.round(interval * newEF);
      }

      // "Easy" gets a bonus multiplier on top of the normal interval.
      newInterval = grade === 'easy' ? Math.round(base * EASY_BONUS) : base;
      newReviewCount = reviewCount + 1;
      break;
    }
  }

  // ── 3. Due date ───────────────────────────────────────────────────────────
  // Advance from NOW by the new interval.
  // Normalised to midnight so "due today" cards all share the same cutoff.
  const dueDate = new Date(now);
  dueDate.setDate(dueDate.getDate() + newInterval);
  dueDate.setHours(0, 0, 0, 0);

  return {
    interval: newInterval,
    easeFactor: newEF,
    reviewCount: newReviewCount,
    dueDate,
  };
}

// ── Preview Helpers ───────────────────────────────────────────────────────────

/**
 * previewIntervals — computes the hypothetical next interval for all 4 grades
 * given the card's current SRS state.
 *
 * The UI uses these values to label the grade buttons before the user taps one:
 *   "Again → 1d"  |  "Hard → 3d"  |  "Good → 7d"  |  "Easy → 9d"
 *
 * @param input  Current SRS state of the card.
 * @param now    Reference timestamp (injectable for tests).
 */
export function previewIntervals(
  input: SrsInput,
  now: Date = new Date(),
): IntervalPreview {
  return {
    again: schedule(input, 'again', now).interval,
    hard: schedule(input, 'hard', now).interval,
    good: schedule(input, 'good', now).interval,
    easy: schedule(input, 'easy', now).interval,
  };
}

/**
 * previewIntervalsFromSrsState — convenience wrapper that accepts a full
 * SrsState object (as returned by the API) instead of SrsInput.
 */
export function previewIntervalsFromSrsState(
  srs: Pick<SrsState, 'interval' | 'easeFactor' | 'reviewCount'>,
  now: Date = new Date(),
): IntervalPreview {
  return previewIntervals(
    { interval: srs.interval, easeFactor: srs.easeFactor, reviewCount: srs.reviewCount },
    now,
  );
}

// ── Overdue Utilities ─────────────────────────────────────────────────────────

/**
 * isOverdue — returns true when a card's due date is in the past.
 *
 * @param dueDate  ISO string or Date object.
 * @param now      Reference timestamp (injectable for tests).
 */
export function isOverdue(dueDate: Date | string, now: Date = new Date()): boolean {
  return new Date(dueDate) <= now;
}

/**
 * overdueScore — priority score for Smart Catch-Up mode.
 * Higher score = more overdue = studied first.
 *
 * Formula: (days overdue)^1.5
 * The exponent means a card 10 days overdue scores ~31.6, while a card
 * 2 days overdue scores only ~2.8 — severely overdue cards dominate the queue.
 *
 * @param dueDate  ISO string or Date object.
 * @param now      Reference timestamp (injectable for tests).
 */
export function overdueScore(dueDate: Date | string, now: Date = new Date()): number {
  const ms = now.getTime() - new Date(dueDate).getTime();
  const daysOverdue = Math.max(0, ms / (1000 * 60 * 60 * 24));
  return Math.pow(daysOverdue, 1.5);
}

// ── Formatting ────────────────────────────────────────────────────────────────

/**
 * formatInterval — human-readable label for an interval in days.
 * Used on study buttons and summary screens.
 *
 * @example
 *   formatInterval(1)   // "1d"
 *   formatInterval(7)   // "1w"
 *   formatInterval(30)  // "1mo"
 *   formatInterval(365) // "1.0y"
 */
export function formatInterval(days: number): string {
  if (days < 1) return '<1d';
  if (days < 7) return `${days}d`;
  if (days < 30) return `${Math.round(days / 7)}w`;
  if (days < 365) return `${Math.round(days / 30)}mo`;
  return `${(days / 365).toFixed(1)}y`;
}
