/**
 * GET /api/study/session
 *
 * Returns the cards due for review for the authenticated user.
 * Supports deck-scoped sessions and Smart Catch-Up mode.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * QUERY PARAMETERS
 * ─────────────────────────────────────────────────────────────────────────────
 *   deckId   (optional)  Filter to a single deck.
 *   limit    (optional)  Max cards to return (default 20, max 100).
 *                        Overridden by DAILY_REVIEW_LIMIT env var when smaller.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CATCH-UP MODE (Smart Catch-Up)
 * ─────────────────────────────────────────────────────────────────────────────
 * When a user has more than CATCHUP_THRESHOLD (50) overdue cards, returning
 * every due card would be overwhelming.  Instead, the endpoint:
 *   1. Counts all overdue cards (for the UI's "You have X cards overdue" banner).
 *   2. Sorts them by overdueScore (days overdue ^ 1.5) — most urgent first.
 *   3. Returns only the top CATCHUP_LIMIT (20) cards.
 *   4. Sets `isCatchup: true` in the response so the UI can show the modal.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * RESPONSE 200
 * ─────────────────────────────────────────────────────────────────────────────
 *   {
 *     cards:      StudyCard[],  // due cards with SRS state + button preview intervals
 *     totalDue:   number,       // total overdue count (may exceed cards.length)
 *     isCatchup:  boolean,      // true when Smart Catch-Up is active
 *   }
 *
 * Each StudyCard also contains `preview: IntervalPreview` so the UI can label
 * the grade buttons without an extra round-trip:
 *   "Again → 1d"  |  "Hard → 3d"  |  "Good → 7d"  |  "Easy → 9d"
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { query } from '@/lib/db';
import {
  previewIntervals,
  CATCHUP_THRESHOLD,
  CATCHUP_LIMIT,
  DAILY_REVIEW_LIMIT,
  overdueScore,
} from '@/lib/srs';
import type { StudyCard, StudySessionResponse, SrsState } from '@/types/api';

export const runtime = 'nodejs';

// ── DB row shape ──────────────────────────────────────────────────────────────

interface DueCardRow {
  id: string;
  deck_id: string;
  user_id: string;
  front: string;
  back: string;
  front_image_url: string | null;
  back_image_url: string | null;
  ai_generated: boolean;
  created_at: string;
  updated_at: string;
  srs_interval: number;
  srs_ease_factor: number;
  srs_due_date: string;
  srs_review_count: number;
  srs_last_grade: SrsState['lastGrade'];
  srs_last_reviewed_at: string | null;
}

// ── GET /api/study/session ────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const deckId = searchParams.get('deckId') ?? null;

  // Clamp limit: respect caller's preference but never exceed DAILY_REVIEW_LIMIT
  // when that env var is non-zero.
  const requestedLimit = parseInt(searchParams.get('limit') ?? '20', 10);
  const hardCap = DAILY_REVIEW_LIMIT > 0 ? DAILY_REVIEW_LIMIT : 100;
  const sessionLimit = Math.min(Math.max(1, requestedLimit), hardCap);

  try {
    // ── Step 1: Count total due cards ─────────────────────────────────────────
    // New cards (no srs_state row yet) are always considered due.
    // We LEFT JOIN srs_state and treat a missing row as due_date = epoch.

    const countResult = await query<{ total: string }>(
      `SELECT COUNT(*) AS total
       FROM cards c
       LEFT JOIN srs_state s
         ON s.card_id = c.id AND s.user_id = $1
       WHERE c.user_id = $1
         AND ($2::uuid IS NULL OR c.deck_id = $2::uuid)
         AND COALESCE(s.due_date, '1970-01-01'::timestamptz) <= NOW()`,
      [user.userId, deckId],
    );

    const totalDue = parseInt(countResult.rows[0]?.total ?? '0', 10);

    // ── Step 2: Determine catch-up mode ───────────────────────────────────────

    const isCatchup = totalDue > CATCHUP_THRESHOLD;
    const fetchLimit = isCatchup ? CATCHUP_LIMIT : sessionLimit;

    // ── Step 3: Fetch due cards ───────────────────────────────────────────────
    // Sort strategy:
    //   Normal mode   — oldest due date first (most overdue is highest priority)
    //   Catch-Up mode — computed overdue score handled in JS after fetch
    //                   (PostgreSQL can't run the ^1.5 formula efficiently on index)
    //                   We fetch CATCHUP_LIMIT * 3 candidates then sort + slice.

    const candidateLimit = isCatchup ? CATCHUP_LIMIT * 3 : fetchLimit;

    const cardsResult = await query<DueCardRow>(
      `SELECT
         c.id, c.deck_id, c.user_id, c.front, c.back,
         c.front_image_url, c.back_image_url, c.ai_generated,
         c.created_at, c.updated_at,
         COALESCE(s.interval,        1)::int           AS srs_interval,
         COALESCE(s.ease_factor,     2.5)::float       AS srs_ease_factor,
         COALESCE(s.due_date, '1970-01-01'::timestamptz)
                                                        AS srs_due_date,
         COALESCE(s.review_count,    0)::int           AS srs_review_count,
         s.last_grade                                   AS srs_last_grade,
         s.last_reviewed_at                             AS srs_last_reviewed_at
       FROM cards c
       LEFT JOIN srs_state s
         ON s.card_id = c.id AND s.user_id = $1
       WHERE c.user_id = $1
         AND ($2::uuid IS NULL OR c.deck_id = $2::uuid)
         AND COALESCE(s.due_date, '1970-01-01'::timestamptz) <= NOW()
       ORDER BY COALESCE(s.due_date, '1970-01-01'::timestamptz) ASC
       LIMIT $3`,
      [user.userId, deckId, candidateLimit],
    );

    // ── Step 4: Apply catch-up prioritisation ─────────────────────────────────

    const now = new Date();
    let rows = cardsResult.rows;

    if (isCatchup) {
      rows = rows
        .sort(
          (a, b) =>
            overdueScore(b.srs_due_date, now) - overdueScore(a.srs_due_date, now),
        )
        .slice(0, CATCHUP_LIMIT);
    }

    // ── Step 5: Attach preview intervals ─────────────────────────────────────

    const cards: StudyCard[] = rows.map((row) => {
      const srs: SrsState = {
        interval: row.srs_interval,
        easeFactor: row.srs_ease_factor,
        dueDate: row.srs_due_date,
        reviewCount: row.srs_review_count,
        lastGrade: row.srs_last_grade,
        lastReviewedAt: row.srs_last_reviewed_at,
      };

      const preview = previewIntervals(
        {
          interval: srs.interval,
          easeFactor: srs.easeFactor,
          reviewCount: srs.reviewCount,
        },
        now,
      );

      return {
        id: row.id,
        deckId: row.deck_id,
        userId: row.user_id,
        front: row.front,
        back: row.back,
        frontImageUrl: row.front_image_url,
        backImageUrl: row.back_image_url,
        aiGenerated: row.ai_generated,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        srs,
        preview,
      };
    });

    const response: StudySessionResponse = { cards, totalDue, isCatchup };
    return NextResponse.json(response);
  } catch (err) {
    console.error('[GET /api/study/session]', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
