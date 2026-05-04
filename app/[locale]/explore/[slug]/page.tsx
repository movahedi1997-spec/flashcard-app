/**
 * app/explore/[slug]/page.tsx — TASK-014
 *
 * SEO landing page for a single public deck.
 *
 * Rendering:
 *   • ISR — revalidates every 3600 s (1 h)
 *   • generateMetadata → per-deck Open Graph title/description/image
 *   • Unauthenticated visitors see card fronts only (backs are blurred/gated)
 *   • A soft auth gate CTA is shown at the bottom for non-users
 *
 * Routes:
 *   GET /explore/[slug]  →  this page
 */

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import {
  BookOpen, Copy, ArrowLeft, BadgeCheck, Eye, EyeOff,
} from 'lucide-react';
import { query } from '@/lib/db';
import { getTranslations } from 'next-intl/server';
import { hreflangAlternates } from '@/lib/hreflang';
import AppNav from '@/components/AppNav';
import CopyDeckButton from './CopyDeckButton';
import ReportDeckButton from '@/components/ReportDeckButton';
import ScrollToTopButton from '@/components/ScrollToTopButton';

export const revalidate = 3600; // ISR: re-render at most once per hour

// ── Secret — same as in dashboard ────────────────────────────────────────────

const secret = new TextEncoder().encode(
  process.env.ACCESS_JWT_SECRET ?? 'dev-access-secret-change-in-production-32x',
);

// ── Types ─────────────────────────────────────────────────────────────────────

interface DeckRow {
  id: string;
  user_id: string;
  creator_name: string;
  is_verified_creator: boolean;
  title: string;
  description: string;
  color: string;
  emoji: string;
  slug: string;
  subject: string | null;
  is_public: boolean;
  copy_count: number;
  created_at: string;
  deck_type: 'flashcard' | 'quiz';
}

interface CardRow {
  id: string;
  front: string;
  back: string;
}

interface CountRow { total: string }

// ── Palette ───────────────────────────────────────────────────────────────────

const GRADIENTS: Record<string, string> = {
  indigo:  'from-indigo-600 to-violet-600',
  emerald: 'from-emerald-600 to-teal-600',
  amber:   'from-amber-500 to-orange-500',
  rose:    'from-rose-500 to-pink-600',
  sky:     'from-sky-500 to-cyan-600',
};

function getGradient(color: string) {
  return GRADIENTS[color] ?? GRADIENTS.indigo;
}

// ── Data fetching ─────────────────────────────────────────────────────────────

async function getDeckBySlug(slug: string) {
  const deckResult = await query<DeckRow>(
    `SELECT d.id, d.user_id, u.name AS creator_name,
            COALESCE(u.is_verified_creator, false) AS is_verified_creator,
            d.title, d.description, d.color, d.emoji, d.slug, d.subject,
            d.is_public, COALESCE(d.copy_count, 0) AS copy_count, d.created_at,
            'flashcard'::text AS deck_type
       FROM decks d
       JOIN users u ON u.id = d.user_id
      WHERE d.slug = $1 AND d.is_public = true
      UNION ALL
     SELECT qd.id, qd.user_id, u.name AS creator_name,
            COALESCE(u.is_verified_creator, false) AS is_verified_creator,
            qd.title, qd.description, qd.color, qd.emoji, qd.slug, qd.subject,
            qd.is_public, 0 AS copy_count, qd.created_at,
            'quiz'::text AS deck_type
       FROM quiz_decks qd
       JOIN users u ON u.id = qd.user_id
      WHERE qd.slug = $1 AND qd.is_public = true
      LIMIT 1`,
    [slug],
  );
  return deckResult.rows[0] ?? null;
}

async function getPreviewCards(deckId: string, showBack: boolean) {
  const result = await query<CardRow>(
    `SELECT id, front, ${showBack ? 'back' : "'' AS back"}
       FROM cards
      WHERE deck_id = $1
      ORDER BY created_at ASC
      LIMIT 10`,
    [deckId],
  );
  return result.rows;
}

async function getTotalCards(deckId: string, deckType: 'flashcard' | 'quiz') {
  const table = deckType === 'quiz' ? 'quiz_questions' : 'cards';
  const col   = deckType === 'quiz' ? 'quiz_deck_id'   : 'deck_id';
  const result = await query<CountRow>(
    `SELECT COUNT(*)::text AS total FROM ${table} WHERE ${col} = $1`,
    [deckId],
  );
  return parseInt(result.rows[0]?.total ?? '0', 10);
}

// ── Auth helper (optional — graceful fallback) ────────────────────────────────

async function tryGetUser(): Promise<{ userId: string; username: string | null } | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.userId as string;
    const res = await query<{ username: string | null }>('SELECT username FROM users WHERE id = $1', [userId]);
    return { userId, username: res.rows[0]?.username ?? null };
  } catch {
    return null;
  }
}

// ── generateMetadata ──────────────────────────────────────────────────────────

type Props = { params: { slug: string; locale: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const deck = await getDeckBySlug(params.slug);
  if (!deck) return { title: 'Deck Not Found' };

  const title       = `${deck.emoji} ${deck.title} — Free Flashcards | FlashcardAI`;
  const description = deck.description ||
    `Study "${deck.title}" with free spaced-repetition flashcards on FlashcardAI. Copy this deck and start learning today.`;
  const siteUrl     = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://flashcard.app';
  const deckPath    = `/explore/${deck.slug}`;
  const ogImageUrl  = `${siteUrl}/api/og?deckId=${deck.id}&format=landscape`;
  const ogUrl       = `${siteUrl}${params.locale === 'en' ? '' : `/${params.locale}`}${deckPath}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: ogUrl,
      type: 'website',
      siteName: 'FlashcardAI',
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: deck.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImageUrl],
    },
    alternates: hreflangAlternates(params.locale, deckPath),
  };
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function DeckLandingPage({ params }: Props) {
  const [deck, t] = await Promise.all([
    getDeckBySlug(params.slug),
    getTranslations('explore'),
  ]);
  if (!deck) notFound();

  const authUser  = await tryGetUser();
  const userId    = authUser?.userId ?? null;
  const isOwner   = userId === deck.user_id;
  const showBack  = !!userId; // authenticated users see both faces

  const isQuiz = deck.deck_type === 'quiz';

  const [cards, totalCards] = await Promise.all([
    isQuiz ? Promise.resolve([]) : getPreviewCards(deck.id, showBack),
    getTotalCards(deck.id, deck.deck_type),
  ]);

  // alreadyCopied check (only for non-owners of flashcard decks)
  let alreadyCopied = false;
  if (!isQuiz && userId && !isOwner) {
    const check = await query<{ id: string }>(
      'SELECT id FROM decks WHERE user_id = $1 AND copied_from_id = $2 LIMIT 1',
      [userId, deck.id],
    );
    alreadyCopied = (check.rowCount ?? 0) > 0;
  }

  const gradient = getGradient(deck.color ?? 'indigo');

  return (
    <div className="min-h-screen">
      {/* ── Nav ──────────────────────────────────────────────────────────────── */}
      {authUser ? (
        <AppNav username={authUser.username} activePage="explore" />
      ) : (
        <header className="sticky top-0 z-50 border-b border-gray-100/80 bg-white/80 backdrop-blur-xl">
          <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3.5">
            <Link href="/" className="flex items-center gap-2.5 font-bold text-gray-900 text-lg tracking-tight">
              Flashcard<span className="text-violet-600">AI</span>
            </Link>
            <div className="flex items-center gap-2">
              <Link href="/login" className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100">{t('logIn')}</Link>
              <Link href="/signup" className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700">{t('getStartedFree')}</Link>
            </div>
          </nav>
        </header>
      )}

      <main className="mx-auto max-w-5xl px-6 py-10 pb-24 sm:pb-10">
        {/* ── Back link ────────────────────────────────────────────────────── */}
        <Link
          href="/explore"
          className="mb-8 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-800 transition"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {t('backToExplore')}
        </Link>

        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          {/* ── Left column: deck info + card previews ─────────────────────── */}
          <div className="space-y-6">
            {/* Hero card */}
            <div className={`rounded-3xl bg-gradient-to-br ${gradient} p-8 text-white`}>
              <div className="flex items-start gap-4">
                <span className="text-5xl leading-none">{deck.emoji}</span>
                <div className="min-w-0">
                  <h1 className="text-2xl font-extrabold leading-snug sm:text-3xl">{deck.title}</h1>
                  {deck.description && (
                    <p className="mt-2 text-white/70 text-sm leading-relaxed line-clamp-3">
                      {deck.description}
                    </p>
                  )}
                  <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-white/70">
                    {isQuiz && (
                      <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold">
                        Quiz
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <BookOpen className="h-4 w-4" />
                      {totalCards} {isQuiz ? 'questions' : (totalCards === 1 ? t('card') : t('cards'))}
                    </span>
                    {!isQuiz && deck.copy_count > 0 && (
                      <span className="flex items-center gap-1">
                        <Copy className="h-4 w-4" />
                        {deck.copy_count.toLocaleString()} {deck.copy_count === 1 ? t('copy') : t('copies')}
                      </span>
                    )}
                    {deck.subject && (
                      <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold capitalize">
                        {deck.subject}
                      </span>
                    )}
                  </div>
                  <div className="mt-3 flex items-center gap-1.5 text-sm text-white/70">
                    <span>{t('by')} {deck.creator_name}</span>
                    {deck.is_verified_creator && (
                      <BadgeCheck className="h-4 w-4 text-white" />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Preview cards — flashcard decks only */}
            {!isQuiz && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-gray-900">
                  {t('preview')}
                  <span className="ms-2 text-sm font-normal text-gray-500">
                    {t('previewCount', { shown: cards.length, total: totalCards })}
                  </span>
                </h2>
                {!showBack && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <EyeOff className="h-3.5 w-3.5" />
                    {t('backHidden')}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                {cards.map((card, idx) => (
                  <div
                    key={card.id}
                    className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-400">
                        {idx + 1}
                      </span>
                      <div className="flex-1 min-w-0 grid gap-3 sm:grid-cols-2">
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1">{t('frontLabel')}</p>
                          <p className="text-sm text-gray-800 leading-relaxed">{card.front}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1 flex items-center gap-1">
                            {t('backLabel')}
                            {!showBack && <EyeOff className="h-3 w-3 text-gray-300" />}
                          </p>
                          {showBack ? (
                            <p className="text-sm text-gray-800 leading-relaxed">{card.back}</p>
                          ) : (
                            <div className="space-y-1.5 pt-0.5">
                              <div className="h-2.5 w-4/5 rounded-full bg-gray-200" />
                              <div className="h-2.5 w-3/5 rounded-full bg-gray-200" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {totalCards > cards.length && (
                <p className="mt-3 text-center text-sm text-gray-400">
                  {t('moreCards', { count: totalCards - cards.length })}
                </p>
              )}
            </div>
            )}
          </div>

          {/* ── Right column: sticky CTA panel ─────────────────────────────── */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm space-y-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900">{t('studyThisDeck')}</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {t('studyThisDeckDesc')}
                </p>
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <span className="text-base">🧠</span>
                  <span>{t('featureSRS')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-base">📱</span>
                  <span>{t('featureDevice')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-base">✏️</span>
                  <span>{t('featureEdit')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-base">🆓</span>
                  <span>{t('featureFree')}</span>
                </div>
              </div>

              {/* Copy button — flashcard decks only */}
              {isQuiz ? (
                <div className="rounded-xl bg-gray-50 border border-gray-200 px-4 py-3 text-sm text-gray-600 text-center">
                  Open in the app to study this quiz
                </div>
              ) : isOwner ? (
                <div className="rounded-xl bg-gray-50 border border-gray-200 px-4 py-3 text-sm text-gray-600 text-center">
                  {t('yourDeck')}
                </div>
              ) : userId ? (
                <CopyDeckButton
                  deckId={deck.id}
                  alreadyCopied={alreadyCopied}
                />
              ) : (
                <div className="space-y-3">
                  <Link
                    href={`/signup?next=/explore/${deck.slug}`}
                    className="block w-full text-center rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-700 active:scale-95"
                  >
                    {t('signUpToCopy')}
                  </Link>
                  <p className="text-center text-xs text-gray-400">
                    {t('alreadyHaveAccount')}{' '}
                    <Link href={`/login?next=/explore/${deck.slug}`} className="text-indigo-600 hover:underline">
                      {t('logIn')}
                    </Link>
                  </p>
                </div>
              )}
            </div>

            {/* Report — only for authenticated non-owners */}
            {userId && !isOwner && (
              <div className="flex justify-center pt-1">
                <ReportDeckButton deckId={deck.id} />
              </div>
            )}
          </div>
        </div>
      </main>
      <ScrollToTopButton />
    </div>
  );
}
