/**
 * app/explore/page.tsx — TASK-013
 *
 * Public Explore page: subject hub tiles + searchable/filterable deck feed.
 *
 * Rendering strategy:
 *   • Server component — category hubs are SSR'd (good for SEO + FCP)
 *   • ExploreGrid is a client component — handles search, filter, pagination
 *
 * Auth: not required. Authenticated users get "already copied" state
 *       and can copy decks without leaving the page.
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { Compass } from 'lucide-react';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { query } from '@/lib/db';
import ExploreGrid from '@/components/ExploreGrid';
import FlashLogoMark from '@/components/FlashLogoMark';

const _secret = new TextEncoder().encode(
  process.env.ACCESS_JWT_SECRET ?? 'dev-access-secret-change-in-production-32x',
);

async function getOptionalUser() {
  const token = cookies().get('token')?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, _secret);
    return { name: payload.name as string };
  } catch {
    return null;
  }
}

export const metadata: Metadata = {
  title: 'Explore Flashcard Decks — FlashcardAI',
  description:
    'Browse thousands of free flashcard decks for medicine, pharmacy, chemistry, and more. ' +
    'Copy any deck to your library and start studying with spaced repetition.',
  openGraph: {
    title: 'Explore Flashcard Decks — FlashcardAI',
    description: 'Free SRS flashcard decks for medicine, pharmacy, chemistry, and more.',
    type: 'website',
  },
};

// ── Category metadata ─────────────────────────────────────────────────────────

const CATEGORY_META: Record<
  string,
  { label: string; description: string; gradient: string; emoji: string }
> = {
  medicine: {
    label:       'Medicine',
    description: 'USMLE, MCAT, Anatomy, Physiology, Pathology, Pharmacology',
    gradient:    'from-indigo-600 to-violet-600',
    emoji:       '🩺',
  },
  pharmacy: {
    label:       'Pharmacy',
    description: 'NAPLEX, Top 200 Drugs, Drug Mechanisms, Medicinal Chemistry',
    gradient:    'from-emerald-600 to-teal-600',
    emoji:       '💊',
  },
  chemistry: {
    label:       'Chemistry',
    description: 'Organic Chemistry, Biochemistry, Reaction Mechanisms',
    gradient:    'from-amber-500 to-orange-500',
    emoji:       '⚗️',
  },
  other: {
    label:       'Other',
    description: 'Biology, Physics, Nursing, Dentistry, and more',
    gradient:    'from-sky-500 to-cyan-600',
    emoji:       '📖',
  },
};

const ORDERED_SUBJECTS = ['medicine', 'pharmacy', 'chemistry', 'other'];

// ── Data fetching ─────────────────────────────────────────────────────────────

async function getCategories() {
  try {
    const result = await query<{ subject: string; deck_count: string }>(
      `SELECT subject, COUNT(*)::text AS deck_count
         FROM decks
        WHERE is_public = true
          AND subject IS NOT NULL
        GROUP BY subject`,
    );
    const countMap: Record<string, number> = {};
    for (const row of result.rows) {
      countMap[row.subject] = parseInt(row.deck_count, 10);
    }
    return ORDERED_SUBJECTS.map((subject) => ({
      subject,
      ...CATEGORY_META[subject],
      deckCount: countMap[subject] ?? 0,
    }));
  } catch {
    // Graceful degradation — show tiles with 0 counts
    return ORDERED_SUBJECTS.map((subject) => ({
      subject,
      ...CATEGORY_META[subject],
      deckCount: 0,
    }));
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function ExplorePage() {
  const [categories, user] = await Promise.all([getCategories(), getOptionalUser()]);

  return (
    <div className="min-h-screen">
      {/* ── Top nav ──────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-gray-100/80 bg-white/80 backdrop-blur-xl">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
          <Link href={user ? '/dashboard' : '/'} className="flex items-center gap-2.5 font-bold text-gray-900">
            <FlashLogoMark size={30} />
            <span className="text-lg tracking-tight">
              Flashcard<span className="text-violet-600">AI</span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <Link
                  href="/flashcards"
                  className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
                >
                  My Decks
                </Link>
                <Link
                  href="/dashboard"
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-700 active:scale-95"
                >
                  ← Dashboard
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-700 active:scale-95"
                >
                  Get Started Free
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10">
        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <div className="mb-10 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-indigo-50 px-4 py-1.5 text-sm font-semibold text-indigo-600">
            <Compass className="h-4 w-4" />
            Explore
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
            Free Flashcard Decks
          </h1>
          <p className="mt-3 text-lg text-gray-500 max-w-2xl mx-auto">
            Browse community-made decks for medicine, pharmacy, chemistry, and more.
            Copy any deck to your library and study with spaced repetition — free.
          </p>
        </div>

        {/* ── Subject hub tiles ─────────────────────────────────────────────── */}
        <section className="mb-10" aria-label="Subject categories">
          <h2 className="sr-only">Browse by subject</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {categories.map((cat) => (
              <div
                key={cat.subject}
                className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${cat.gradient}
                  p-5 text-white transition hover:scale-[1.02] hover:shadow-lg cursor-default`}
              >
                <p className="text-3xl mb-2">{cat.emoji}</p>
                <p className="font-bold text-base">{cat.label}</p>
                <p className="text-white/70 text-xs mt-0.5 line-clamp-2 hidden sm:block">
                  {cat.description}
                </p>
                <p className="mt-3 text-white/80 text-xs font-semibold">
                  {cat.deckCount} {cat.deckCount === 1 ? 'deck' : 'decks'}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Deck feed (client component) ─────────────────────────────────── */}
        <section aria-label="Public deck feed">
          <ExploreGrid />
        </section>
      </main>
    </div>
  );
}
