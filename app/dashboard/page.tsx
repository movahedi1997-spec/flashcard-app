import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { jwtVerify } from 'jose';
import { BookOpen, Zap, Trophy, Settings, LayoutGrid, Compass, User } from 'lucide-react';
import Link from 'next/link';
import HomeButton from './HomeButton';
import LogoutButton from './LogoutButton';
import StudyChart from '@/components/dashboard/StudyChart';
import { query } from '@/lib/db';

const secret = new TextEncoder().encode(
  process.env.ACCESS_JWT_SECRET ?? 'dev-access-secret-change-in-production-32x',
);

async function getUserFromCookie() {
  const cookieStore = cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) redirect('/login');

  try {
    const { payload } = await jwtVerify(token, secret);
    return {
      userId: payload.userId as string,
      name: payload.name as string,
      email: payload.email as string,
    };
  } catch {
    redirect('/login');
  }
}

function calculateStreak(sortedDates: string[]): number {
  if (sortedDates.length === 0) return 0;
  const todayStr = new Date().toISOString().split('T')[0];
  const yesterdayStr = new Date(Date.now() - 86_400_000).toISOString().split('T')[0];
  if (sortedDates[0] !== todayStr && sortedDates[0] !== yesterdayStr) return 0;
  let streak = 1;
  for (let i = 1; i < sortedDates.length; i++) {
    const prev = new Date(sortedDates[i - 1] + 'T00:00:00Z');
    const curr = new Date(sortedDates[i] + 'T00:00:00Z');
    const diffDays = Math.round((prev.getTime() - curr.getTime()) / 86_400_000);
    if (diffDays === 1) streak++;
    else break;
  }
  return streak;
}

async function getDashboardData(userId: string) {
  const [decksRes, cardsRes, todayRes, daysRes, profileRes] = await Promise.all([
    query<{ count: string }>(
      'SELECT COUNT(*)::text AS count FROM decks WHERE user_id = $1',
      [userId],
    ),
    query<{ count: string }>(
      'SELECT COUNT(*)::text AS count FROM cards WHERE user_id = $1',
      [userId],
    ),
    query<{ count: string }>(
      `SELECT COUNT(*)::text AS count
         FROM srs_state
        WHERE user_id = $1
          AND DATE(last_reviewed_at AT TIME ZONE 'UTC') = CURRENT_DATE`,
      [userId],
    ),
    query<{ review_date: string }>(
      `SELECT DISTINCT DATE(last_reviewed_at AT TIME ZONE 'UTC')::text AS review_date
         FROM srs_state
        WHERE user_id = $1
          AND last_reviewed_at IS NOT NULL
        ORDER BY review_date DESC
        LIMIT 365`,
      [userId],
    ),
    query<{ username: string | null }>(
      'SELECT username FROM users WHERE id = $1',
      [userId],
    ),
  ]);

  return {
    totalDecks: parseInt(decksRes.rows[0]?.count ?? '0', 10),
    totalCards: parseInt(cardsRes.rows[0]?.count ?? '0', 10),
    cardsToday: parseInt(todayRes.rows[0]?.count ?? '0', 10),
    streak: calculateStreak(daysRes.rows.map((r) => r.review_date)),
    username: profileRes.rows[0]?.username ?? null,
  };
}

export default async function DashboardPage() {
  const user = await getUserFromCookie();
  const data = await getDashboardData(user!.userId);
  const profileHref = data.username ? `/creators/${data.username}` : '/settings';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Top bar ────────────────────────────────────────────────────── */}
      <header
        className="border-b border-gray-100 bg-white sticky top-0 z-40"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <HomeButton />

          <nav className="flex items-center gap-1">
            {/* Explore */}
            <Link
              href="/explore"
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-indigo-50 hover:text-indigo-600"
            >
              <Compass className="h-4 w-4" />
              <span className="hidden sm:inline">Explore</span>
            </Link>

            {/* Profile */}
            <Link
              href={profileHref}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-indigo-50 hover:text-indigo-600"
            >
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Profile</span>
            </Link>

            {/* Settings */}
            <Link
              href="/settings"
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-indigo-50 hover:text-indigo-600"
            >
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Settings</span>
            </Link>

            <LogoutButton />
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 space-y-6">
        {/* ── Welcome ──────────────────────────────────────────────────── */}
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 sm:text-3xl">
            Welcome back, {user.name.split(' ')[0]}! 👋
          </h1>
          <p className="mt-1 text-gray-500 text-sm sm:text-base">
            Ready to sharpen your knowledge today?
          </p>
        </div>

        {/* ── Quick Actions ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Link
            href="/flashcards"
            className="flex items-center gap-3 rounded-xl border border-indigo-100 bg-white p-4 shadow-sm transition hover:border-indigo-300 hover:shadow-md"
          >
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <BookOpen className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 text-sm">My Decks</p>
              <p className="text-xs text-gray-500 hidden sm:block">Study &amp; manage</p>
            </div>
          </Link>

          <Link
            href="/explore"
            className="flex items-center gap-3 rounded-xl border border-emerald-100 bg-white p-4 shadow-sm transition hover:border-emerald-300 hover:shadow-md"
          >
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white">
              <Compass className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 text-sm">Explore</p>
              <p className="text-xs text-gray-500 hidden sm:block">Find public decks</p>
            </div>
          </Link>

          <Link
            href={profileHref}
            className="flex items-center gap-3 rounded-xl border border-violet-100 bg-white p-4 shadow-sm transition hover:border-violet-300 hover:shadow-md col-span-2 sm:col-span-1"
          >
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-violet-600 text-white">
              <User className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 text-sm">My Profile</p>
              <p className="text-xs text-gray-500 hidden sm:block">Public creator page</p>
            </div>
          </Link>
        </div>

        {/* ── Stats ────────────────────────────────────────────────────── */}
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          {[
            { icon: BookOpen,   label: 'Total Decks', value: String(data.totalDecks), color: 'text-indigo-600 bg-indigo-50'   },
            { icon: LayoutGrid, label: 'Total Cards', value: String(data.totalCards), color: 'text-violet-600 bg-violet-50'   },
            { icon: Zap,        label: 'Cards Today', value: String(data.cardsToday), color: 'text-amber-600 bg-amber-50'     },
            { icon: Trophy,     label: 'Day Streak',  value: String(data.streak),     color: 'text-emerald-600 bg-emerald-50' },
          ].map(({ icon: Icon, label, value, color }) => (
            <div
              key={label}
              className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6"
            >
              <div className={`mb-2 inline-flex h-9 w-9 items-center justify-center rounded-xl ${color}`}>
                <Icon className="h-4 w-4" />
              </div>
              <p className="text-xl font-bold text-gray-900 sm:text-2xl">{value}</p>
              <p className="mt-0.5 text-xs text-gray-500 sm:text-sm">{label}</p>
            </div>
          ))}
        </div>

        {/* ── Study activity chart ──────────────────────────────────────── */}
        <StudyChart />

        <p className="text-center text-xs text-gray-400">
          Logged in as {user.email}
        </p>
      </main>
    </div>
  );
}
