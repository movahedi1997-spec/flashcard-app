import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { jwtVerify } from 'jose';
import { BookOpen, Zap, Trophy, Settings, LayoutGrid } from 'lucide-react';
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

async function getDashboardStats(userId: string) {
  const [decksRes, cardsRes, todayRes, daysRes] = await Promise.all([
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
  ]);

  return {
    totalDecks: parseInt(decksRes.rows[0]?.count ?? '0', 10),
    totalCards: parseInt(cardsRes.rows[0]?.count ?? '0', 10),
    cardsToday: parseInt(todayRes.rows[0]?.count ?? '0', 10),
    streak: calculateStreak(daysRes.rows.map((r) => r.review_date)),
  };
}

export default async function DashboardPage() {
  const user = await getUserFromCookie();
  const dbStats = await getDashboardStats(user!.userId);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Top bar ────────────────────────────────────────────────────── */}
      <header className="border-b border-gray-100 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          {/* Logo → logs out and returns to marketing homepage */}
          <HomeButton />
          <div className="flex items-center gap-2">
            <Link
              href="/settings"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
            >
              <Settings className="h-4 w-4" />
              Settings
            </Link>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12 space-y-8">
        {/* ── Welcome ──────────────────────────────────────────────────── */}
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">
            Welcome back, {user.name.split(' ')[0]}! 👋
          </h1>
          <p className="mt-1 text-gray-500">
            Ready to sharpen your knowledge today?
          </p>
        </div>

        {/* ── Quick Actions (CTA — shown first so they're immediately visible) ── */}
        <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
          <h2 className="mb-6 text-xl font-bold text-gray-900">Start Study</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Link
              href="/flashcards"
              className="flex items-center gap-4 rounded-xl border border-indigo-100 bg-indigo-50 p-5 transition hover:bg-indigo-100"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">My Decks</p>
                <p className="text-sm text-gray-500">
                  Create and manage your flashcard decks
                </p>
              </div>
            </Link>
            <div className="flex items-center gap-4 rounded-xl border border-gray-100 bg-gray-50 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-white">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Quick Study</p>
                <p className="text-sm text-gray-500">Review your due cards now</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Stats ────────────────────────────────────────────────────── */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: BookOpen,    label: 'Total Decks', value: String(dbStats.totalDecks), color: 'text-indigo-600 bg-indigo-50'   },
            { icon: LayoutGrid,  label: 'Total Cards', value: String(dbStats.totalCards), color: 'text-violet-600 bg-violet-50'   },
            { icon: Zap,         label: 'Cards Today', value: String(dbStats.cardsToday), color: 'text-amber-600 bg-amber-50'     },
            { icon: Trophy,      label: 'Day Streak',  value: String(dbStats.streak),     color: 'text-emerald-600 bg-emerald-50' },
          ].map(({ icon: Icon, label, value, color }) => (
            <div
              key={label}
              className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
            >
              <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="mt-0.5 text-sm text-gray-500">{label}</p>
            </div>
          ))}
        </div>

        {/* ── Study activity chart ──────────────────────────────────────── */}
        <StudyChart />

        {/* ── Account info ─────────────────────────────────────────────── */}
        <p className="text-center text-xs text-gray-400">
          Logged in as {user.email}
        </p>
      </main>
    </div>
  );
}
