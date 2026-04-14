/**
 * POST /api/study/grade
 *
 * Grades a card during a study session and persists the updated SRS state.
 * Returns the new SRS state plus preview intervals for all four grade buttons
 * (used to animate the "next" card's button labels without an extra round-trip).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * REQUEST BODY
 * ─────────────────────────────────────────────────────────────────────────────
 *   {
 *     cardId: string,                       // UUID of the card being graded
 *     grade:  "again" | "hard" | "good" | "easy"
 *   }
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * RESPONSE 200
 * ─────────────────────────────────────────────────────────────────────────────
 *   {
 *     cardId:        string,
 *     grade:         "again" | "hard" | "good" | "easy",
 *     newInterval:   number,   // days until next review
 *     newEaseFactor: number,
 *     newDueDate:    string,   // ISO timestamp
 *     newReviewCount: number,
 *     preview: {               // hypothetical intervals for the NEXT grading
 *       again: number,
 *       hard:  number,
 *       good:  number,
 *       easy:  number,
 *     }
 *   }
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * OWNERSHIP & SECURITY
 * ─────────────────────────────────────────────────────────────────────────────
 * The card must belong to the authenticated user (checked via user_id = $userId
 * in the cards table).  This prevents IDOR — a user cannot grade another
 * user's cards even if they know the UUID.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * SRS STATE PERSISTENCE
 * ─────────────────────────────────────────────────────────────────────────────
 * Uses an UPSERT (INSERT … ON CONFLICT DO UPDATE) on the srs_state table
 * so a new row is created on first review and updated on every subsequent one.
 * The unique constraint (card_id, user_id) guarantees one row per card per user.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { schedule, previewIntervals, DEFAULT_SRS } from '@/lib/srs';
import type { Grade, GradeResponse, SrsState } from '@/types/api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Valid grade values — validated at runtime (never trust client input)
const VALID_GRADES: readonly Grade[] = ['again', 'hard', 'good', 'easy'];

// ── DB row shape returned from srs_state ──────────────────────────────────────

interface SrsRow {
  interval: number;
  ease_factor: number;
  due_date: string;
  review_count: number;
  last_grade: Grade | null;
  last_reviewed_at: string | null;
}

// ── POST /api/study/grade ─────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  // ── Parse & validate body ─────────────────────────────────────────────────

  const body = (await req.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;

  if (!body) {
    return NextResponse.json({ error: 'Request body is required.' }, { status: 400 });
  }

  const { cardId, grade } = body;

  if (!cardId || typeof cardId !== 'string') {
    return NextResponse.json({ error: 'cardId is required.' }, { status: 400 });
  }

  if (!grade || !VALID_GRADES.includes(grade as Grade)) {
    return NextResponse.json(
      { error: `grade must be one of: ${VALID_GRADES.join(', ')}.` },
      { status: 400 },
    );
  }

  const validGrade = grade as Grade;

  try {
    // ── Ownership check ───────────────────────────────────────────────────────
    // Verify the card belongs to the requesting user — prevents IDOR attacks.

    const cardCheck = await query<{ id: string }>(
      'SELECT id FROM cards WHERE id = $1 AND user_id = $2',
      [cardId, user.userId],
    );

    if ((cardCheck.rowCount ?? 0) === 0) {
      return NextResponse.json({ error: 'Card not found.' }, { status: 404 });
    }

    // ── Fetch current SRS state ────────────────────────────────────────────────
    // If no row exists (first review), use DEFAULT_SRS.

    const srsResult = await query<SrsRow>(
      `SELECT interval, ease_factor, due_date, review_count, last_grade, last_reviewed_at
       FROM srs_state
       WHERE card_id = $1 AND user_id = $2`,
      [cardId, user.userId],
    );

    const currentSrs = srsResult.rows[0]
      ? {
          interval: srsResult.rows[0].interval,
          easeFactor: srsResult.rows[0].ease_factor,
          reviewCount: srsResult.rows[0].review_count,
        }
      : DEFAULT_SRS;

    // ── Compute new SRS state (pure algorithm — no side effects) ──────────────

    const now = new Date();
    const next = schedule(currentSrs, validGrade, now);

    // ── Persist to srs_state (UPSERT) ─────────────────────────────────────────
    // INSERT on first review, UPDATE on every subsequent review.
    // The unique constraint (card_id, user_id) governs the conflict target.

    await query(
      `INSERT INTO srs_state
         (card_id, user_id, interval, ease_factor, due_date, review_count, last_grade, last_reviewed_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (card_id, user_id) DO UPDATE SET
         interval         = EXCLUDED.interval,
         ease_factor      = EXCLUDED.ease_factor,
         due_date         = EXCLUDED.due_date,
         review_count     = EXCLUDED.review_count,
         last_grade       = EXCLUDED.last_grade,
         last_reviewed_at = EXCLUDED.last_reviewed_at`,
      [
        cardId,
        user.userId,
        next.interval,
        next.easeFactor,
        next.dueDate.toISOString(),
        next.reviewCount,
        validGrade,
        now.toISOString(),
      ],
    );

    // ── Append to review_log (analytics / dashboard chart) ────────────────────
    // Fire-and-forget — a failure here must never block the grade response.
    query(
      `INSERT INTO review_log (user_id, card_id, grade, reviewed_at)
       VALUES ($1, $2, $3, $4)`,
      [user.userId, cardId, validGrade, now.toISOString()],
    ).catch((err) => console.error('[review_log insert]', err));

    // ── Compute preview intervals for the updated state ────────────────────────
    // The UI uses these to label the grade buttons on the NEXT card shown,
    // so it can pre-render them without another fetch.

    const preview = previewIntervals(
      {
        interval: next.interval,
        easeFactor: next.easeFactor,
        reviewCount: next.reviewCount,
      },
      now,
    );

    const response: GradeResponse = {
      cardId,
      grade: validGrade,
      newInterval: next.interval,
      newEaseFactor: next.easeFactor,
      newDueDate: next.dueDate.toISOString(),
      newReviewCount: next.reviewCount,
      preview,
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error('[POST /api/study/grade]', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
