/**
 * GET /api/explore/categories
 *
 * Returns the subject hub data for the Explore page category tiles.
 * Each category includes a live deck count from the database so the UI
 * always shows accurate numbers without a separate count query per tile.
 *
 * Auth: not required — publicly accessible.
 *
 * Response 200:
 *   {
 *     categories: Array<{
 *       subject:     string,
 *       label:       string,
 *       description: string,
 *       deckCount:   number,
 *       color:       string,   // Tailwind gradient classes for the hub tile
 *       emoji:       string,
 *     }>
 *   }
 */

import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const runtime = 'nodejs';

// Static category metadata — deck counts are merged in dynamically from DB
const CATEGORY_META: Record<
  string,
  { label: string; description: string; color: string; emoji: string }
> = {
  medicine: {
    label:       'Medicine',
    description: 'USMLE Step 1 & 2, MCAT, Anatomy, Physiology, Pathology, Pharmacology',
    color:       'from-indigo-600 to-violet-600',
    emoji:       '🩺',
  },
  pharmacy: {
    label:       'Pharmacy',
    description: 'NAPLEX prep, Top 200 Drugs, Drug Mechanisms, Medicinal Chemistry',
    color:       'from-emerald-600 to-teal-600',
    emoji:       '💊',
  },
  chemistry: {
    label:       'Chemistry',
    description: 'Organic Chemistry, AP Chemistry, Reaction Mechanisms, Biochemistry',
    color:       'from-amber-500 to-orange-500',
    emoji:       '⚗️',
  },
  other: {
    label:       'Other',
    description: 'Biology, Physics, Nursing, Dentistry, and more',
    color:       'from-sky-500 to-cyan-600',
    emoji:       '📖',
  },
};

export async function GET() {
  try {
    // Count public decks per subject in a single query
    const result = await query<{ subject: string; deck_count: string }>(
      `SELECT subject, COUNT(*)::text AS deck_count
         FROM decks
        WHERE is_public = true
          AND subject IS NOT NULL
        GROUP BY subject`,
    );

    // Build a map of subject → count
    const countMap: Record<string, number> = {};
    for (const row of result.rows) {
      countMap[row.subject] = parseInt(row.deck_count, 10);
    }

    // Merge static metadata with live counts, always include all 4 categories
    const categories = Object.entries(CATEGORY_META).map(([subject, meta]) => ({
      subject,
      label:       meta.label,
      description: meta.description,
      color:       meta.color,
      emoji:       meta.emoji,
      deckCount:   countMap[subject] ?? 0,
    }));

    return NextResponse.json({ categories });
  } catch (err) {
    console.error('[GET /api/explore/categories]', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
