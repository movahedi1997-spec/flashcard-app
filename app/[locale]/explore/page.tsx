import type { Metadata } from 'next';
import { hreflangAlternates } from '@/lib/hreflang';
import { Compass } from 'lucide-react';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { query } from '@/lib/db';
import { getTranslations } from 'next-intl/server';
import ExploreGrid from '@/components/ExploreGrid';
import AppNav from '@/components/AppNav';
import { Link } from '@/i18n/navigation';

const _secret = new TextEncoder().encode(
  process.env.ACCESS_JWT_SECRET ?? 'dev-access-secret-change-in-production-32x',
);

async function getOptionalUser() {
  const token = cookies().get('token')?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, _secret);
    const userId = payload.userId as string;
    const res = await query<{ username: string | null }>('SELECT username FROM users WHERE id = $1', [userId]);
    return { name: payload.name as string, username: res.rows[0]?.username ?? null };
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  return {
    title: 'Explore Flashcard Decks — FlashcardAI',
    description:
      'Browse thousands of free flashcard decks for medicine, pharmacy, chemistry, and more. ' +
      'Copy any deck to your library and start studying with spaced repetition.',
    openGraph: {
      title: 'Explore Flashcard Decks — FlashcardAI',
      description: 'Free SRS flashcard decks for medicine, pharmacy, chemistry, and more.',
      type: 'website',
    },
    alternates: hreflangAlternates(params.locale, '/explore'),
  };
}

const ORDERED_SUBJECTS = ['medicine', 'pharmacy', 'chemistry', 'other'];

const SUBJECT_META: Record<string, { gradient: string; emoji: string }> = {
  medicine:  { gradient: 'from-indigo-600 to-violet-600', emoji: '🩺' },
  pharmacy:  { gradient: 'from-emerald-600 to-teal-600',  emoji: '💊' },
  chemistry: { gradient: 'from-amber-500 to-orange-500',  emoji: '⚗️' },
  other:     { gradient: 'from-sky-500 to-cyan-600',      emoji: '📖' },
};

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
      ...SUBJECT_META[subject],
      deckCount: countMap[subject] ?? 0,
    }));
  } catch {
    return ORDERED_SUBJECTS.map((subject) => ({
      subject,
      ...SUBJECT_META[subject],
      deckCount: 0,
    }));
  }
}

export default async function ExplorePage() {
  const [categories, user, t, tc] = await Promise.all([
    getCategories(),
    getOptionalUser(),
    getTranslations('explore'),
    getTranslations('common'),
  ]);

  return (
    <div className="min-h-screen">
      {user ? (
        <AppNav username={user.username} activePage="explore" />
      ) : (
        <header className="sticky top-0 z-50 border-b border-gray-100/80 bg-white/80 backdrop-blur-xl">
          <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
            <Link href="/" className="flex items-center gap-2.5 font-bold text-gray-900 text-lg tracking-tight">
              Flashcard<span className="text-violet-600">AI</span>
            </Link>
            <div className="flex items-center gap-2">
              <Link href="/login" className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100">{tc('nav.login')}</Link>
              <Link href="/signup" className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700">{tc('nav.getStarted')}</Link>
            </div>
          </nav>
        </header>
      )}

      <main className="mx-auto max-w-7xl px-6 py-10 pb-24 sm:pb-10">
        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <div className="mb-10 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-indigo-50 px-4 py-1.5 text-sm font-semibold text-indigo-600">
            <Compass className="h-4 w-4" />
            {t('badge')}
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
            {t('title')}
          </h1>
          <p className="mt-3 text-lg text-gray-500 max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </div>

        {/* ── Subject hub tiles ─────────────────────────────────────────────── */}
        <section className="mb-10" aria-label={t('browseBySubject')}>
          <h2 className="sr-only">{t('browseBySubject')}</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {categories.map((cat) => (
              <div
                key={cat.subject}
                className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${cat.gradient}
                  p-5 text-white transition hover:scale-[1.02] hover:shadow-lg cursor-default`}
              >
                <p className="text-3xl mb-2">{cat.emoji}</p>
                <p className="font-bold text-base">{t(`subjects.${cat.subject}.label`)}</p>
                <p className="text-white/70 text-xs mt-0.5 line-clamp-2 hidden sm:block">
                  {t(`subjects.${cat.subject}.description`)}
                </p>
                <p className="mt-3 text-white/80 text-xs font-semibold">
                  {cat.deckCount} {cat.deckCount === 1 ? t('deck') : t('decks')}
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
