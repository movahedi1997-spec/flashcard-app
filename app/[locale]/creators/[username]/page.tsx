/**
 * app/creators/[username]/page.tsx — TASK-016
 *
 * Public creator profile page at /creators/[username].
 *
 * Rendering: SSR (no ISR — profiles update often during early growth phase)
 * Auth: optional — public page, but authenticated users see copy CTAs.
 */

import type { Metadata } from 'next';
import { notFound }      from 'next/navigation';
import Link              from 'next/link';
import { BadgeCheck, BookOpen, Copy } from 'lucide-react';
import { cookies }        from 'next/headers';
import { jwtVerify }      from 'jose';
import { query }          from '@/lib/db';
import AppNav             from '@/components/AppNav';
import ExploreDeckCard    from '@/components/ExploreDeckCard';
import ProBadge           from '@/components/ProBadge';
import ReportProfileButton from '@/components/ReportProfileButton';
import type { PublicDeck } from '@/types/api';

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
    return { userId, name: payload.name as string, username: res.rows[0]?.username ?? null };
  } catch {
    return null;
  }
}

export const dynamic = 'force-dynamic'; // SSR on every request

type Props = { params: { username: string } };

// ── Types ─────────────────────────────────────────────────────────────────────

interface UserRow {
  id:                  string;
  name:                string;
  username:            string;
  bio:                 string | null;
  avatar_url:          string | null;
  is_verified_creator: boolean;
  is_pro:              boolean;
  created_at:          string;
}

interface DeckRow {
  id:          string;
  title:       string;
  description: string;
  color:       string;
  emoji:       string;
  slug:        string;
  subject:     string | null;
  card_count:  string;
  copy_count:  string;
  created_at:  string;
  updated_at:  string;
}

// ── Data fetching ─────────────────────────────────────────────────────────────

async function getCreatorByUsername(username: string) {
  const result = await query<UserRow>(
    `SELECT id, name, username, bio, avatar_url,
            COALESCE(is_verified_creator, false) AS is_verified_creator,
            COALESCE(is_pro, false) AS is_pro,
            created_at
       FROM users
      WHERE LOWER(username) = LOWER($1)`,
    [username],
  );
  return result.rows[0] ?? null;
}

async function getPublicDecks(userId: string): Promise<DeckRow[]> {
  const result = await query<DeckRow>(
    `SELECT d.id, d.title, d.description, d.color, d.emoji, d.slug, d.subject,
            COUNT(c.id)::text AS card_count,
            COALESCE(d.copy_count, 0)::text AS copy_count,
            d.created_at, d.updated_at
       FROM decks d
       LEFT JOIN cards c ON c.deck_id = d.id
      WHERE d.user_id = $1 AND d.is_public = true
      GROUP BY d.id
      ORDER BY d.created_at DESC`,
    [userId],
  );
  return result.rows;
}

// ── generateMetadata ──────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const creator = await getCreatorByUsername(params.username).catch(() => null);
  if (!creator) return { title: 'Creator Not Found' };

  return {
    title: `${creator.name}'s Flashcard Decks — FlashcardAI`,
    description:
      creator.bio ??
      `Browse free flashcard decks by ${creator.name} on FlashcardAI.`,
    openGraph: {
      title: `${creator.name} — FlashcardAI Creator`,
      type:  'profile',
    },
  };
}

// ── Avatar placeholder ────────────────────────────────────────────────────────

function AvatarFallback({ name, size = 80 }: { name: string; size?: number }) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <div
      style={{ width: size, height: size, fontSize: size * 0.38 }}
      className="rounded-full bg-gradient-to-br from-indigo-500 to-violet-600
                 flex items-center justify-center text-white font-bold flex-shrink-0"
    >
      {initials}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function CreatorProfilePage({ params }: Props) {
  const [creator, authUser] = await Promise.all([
    getCreatorByUsername(params.username).catch(() => null),
    getOptionalUser(),
  ]);
  if (!creator) notFound();

  const isOwnProfile = authUser?.userId === creator.id;

  const deckRows = await getPublicDecks(creator.id).catch(() => []);

  const totalCopies = deckRows.reduce((s, d) => s + parseInt(d.copy_count, 10), 0);

  const decks: PublicDeck[] = deckRows.map((d) => ({
    id:           d.id,
    userId:       creator.id,
    creatorName:  creator.name,
    isVerifiedCreator: creator.is_verified_creator,
    title:        d.title,
    description:  d.description,
    color:        d.color ?? 'indigo',
    emoji:        d.emoji ?? '📚',
    isPublic:     true,
    slug:         d.slug,
    subject:      d.subject as PublicDeck['subject'],
    cardCount:    parseInt(d.card_count, 10),
    copyCount:    parseInt(d.copy_count, 10),
    alreadyCopied: false,
    createdAt:    d.created_at,
    updatedAt:    d.updated_at,
  }));

  const joinYear = new Date(creator.created_at).getFullYear();

  return (
    <div className="min-h-screen">
      {/* Nav */}
      {authUser ? (
        <AppNav username={authUser.username} activePage="profile" />
      ) : (
        <header className="sticky top-0 z-50 border-b border-gray-100/80 bg-white/80 backdrop-blur-xl">
          <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3.5">
            <Link href="/" className="flex items-center gap-2.5 font-bold text-gray-900 text-lg tracking-tight">
              Flashcard<span className="text-violet-600">AI</span>
            </Link>
            <Link href="/signup" className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700">
              Get Started Free
            </Link>
          </nav>
        </header>
      )}

      <main className="mx-auto max-w-5xl px-6 py-10 pb-24 sm:pb-10">
        {/* Profile header */}
        <div className="flex flex-col items-center text-center sm:flex-row sm:text-start sm:items-start gap-6 mb-12">
          {creator.avatar_url ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={creator.avatar_url}
              alt={creator.name}
              width={80} height={80}
              className="w-20 h-20 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <AvatarFallback name={creator.name} size={80} />
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
              <h1 className="text-2xl font-extrabold text-gray-900">{creator.name}</h1>
              {creator.is_verified_creator && (
                <BadgeCheck className="h-6 w-6 text-indigo-500 flex-shrink-0" />
              )}
              <ProBadge isPro={creator.is_pro} size="md" />
            </div>
            {creator.username && (
              <p className="text-sm text-gray-400 mt-0.5">@{creator.username}</p>
            )}
            {creator.bio && (
              <p className="mt-2 text-gray-600 text-sm max-w-xl leading-relaxed">{creator.bio}</p>
            )}

            {/* Stats row */}
            <div className="mt-4 flex items-center justify-center sm:justify-start gap-5 text-sm text-gray-500">
              <div className="flex items-center gap-1.5">
                <BookOpen className="h-4 w-4" />
                <span><strong className="text-gray-900">{deckRows.length}</strong> public deck{deckRows.length !== 1 ? 's' : ''}</span>
              </div>
              {totalCopies > 0 && (
                <div className="flex items-center gap-1.5">
                  <Copy className="h-4 w-4" />
                  <span><strong className="text-gray-900">{totalCopies.toLocaleString()}</strong> total copies</span>
                </div>
              )}
              <span className="text-gray-300">·</span>
              <span>Joined {joinYear}</span>
            </div>

            {/* Report button — only for authenticated non-own-profile viewers */}
            {authUser && !isOwnProfile && (
              <div className="mt-3">
                <ReportProfileButton
                  reportedUserId={creator.id}
                  reportedName={creator.username ?? creator.name}
                />
              </div>
            )}
          </div>
        </div>

        {/* Deck grid */}
        {decks.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-center">
            <p className="text-4xl mb-4">📭</p>
            <p className="font-semibold text-gray-700">No public decks yet</p>
            <p className="text-sm text-gray-400 mt-1">
              {creator.name} hasn&apos;t published any decks.
            </p>
          </div>
        ) : (
          <>
            <h2 className="text-lg font-bold text-gray-900 mb-5">
              Public Decks
              <span className="ms-2 text-sm font-normal text-gray-400">({decks.length})</span>
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {decks.map((deck) => (
                <ExploreDeckCard key={deck.id} deck={deck} />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
