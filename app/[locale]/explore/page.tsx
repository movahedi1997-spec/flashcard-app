import type { Metadata } from 'next';
import { hreflangAlternates } from '@/lib/hreflang';
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

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  return {
    title: 'Explore Flashcard Decks — FlashcardAI',
    description:
      'Browse free flashcard decks on medicine, languages, law, computer science, and more. ' +
      'Copy any deck and study with spaced repetition.',
    openGraph: {
      title: 'Explore Flashcard Decks — FlashcardAI',
      description: 'Free SRS flashcard decks — medicine, languages, law, CS, and more.',
      type: 'website',
    },
    alternates: hreflangAlternates(params.locale, '/explore'),
  };
}

export default async function ExplorePage() {
  const [user, tc] = await Promise.all([
    getOptionalUser(),
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

      <main className="mx-auto max-w-3xl px-4 sm:px-6 py-8 pb-24 sm:pb-10">
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-gray-900">Explore</h1>
          <p className="text-sm text-gray-500 mt-1">
            Discover and copy free flashcard decks from the community.
          </p>
        </div>

        <ExploreGrid />
      </main>
    </div>
  );
}
