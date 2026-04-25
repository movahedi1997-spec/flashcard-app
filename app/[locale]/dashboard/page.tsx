import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { jwtVerify } from 'jose';
import { BookOpen, Zap, Trophy, LayoutGrid } from 'lucide-react';
import Link from 'next/link';
import AppNav from '@/components/AppNav';
import StudyChart from '@/components/dashboard/StudyChart';
import ProBadge from '@/components/ProBadge';
import GoProBanner from '@/components/GoProBanner';
import { query } from '@/lib/db';
import { getTranslations } from 'next-intl/server';

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
  const [decksRes, cardsRes, todayRes, daysRes, profileRes, proRes] = await Promise.all([
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
    query<{ username: string | null; avatar_url: string | null }>(
      'SELECT username, avatar_url FROM users WHERE id = $1',
      [userId],
    ),
    query<{ is_pro: boolean }>(
      'SELECT is_pro FROM users WHERE id = $1',
      [userId],
    ),
  ]);

  return {
    totalDecks: parseInt(decksRes.rows[0]?.count ?? '0', 10),
    totalCards: parseInt(cardsRes.rows[0]?.count ?? '0', 10),
    cardsToday: parseInt(todayRes.rows[0]?.count ?? '0', 10),
    streak: calculateStreak(daysRes.rows.map((r) => r.review_date)),
    username:  profileRes.rows[0]?.username  ?? null,
    avatarUrl: profileRes.rows[0]?.avatar_url ?? null,
    isPro:     proRes.rows[0]?.is_pro        ?? false,
  };
}

export default async function DashboardPage() {
  const t = await getTranslations('dashboard');
  const user = await getUserFromCookie();
  const data = await getDashboardData(user!.userId);
  const profileHref = data.username ? `/creators/${data.username}` : '/settings';

  return (
    <div className="min-h-screen bg-gray-50">
      <AppNav username={data.username} />

      <main className="mx-auto max-w-6xl px-4 py-8 pb-24 sm:pb-8 space-y-6">
        {/* ── Welcome + profile ────────────────────────────────────────── */}
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <Link href={profileHref} className="flex-shrink-0">
            {data.avatarUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={data.avatarUrl}
                alt={user.name}
                className="h-14 w-14 rounded-full object-cover border-2 border-white shadow-sm ring-2 ring-indigo-100"
              />
            ) : (
              <div className="h-14 w-14 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-xl shadow-sm">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
          </Link>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-extrabold text-gray-900 sm:text-3xl">
                {t('welcome', { name: user.name.split(' ')[0] })}
              </h1>
              <ProBadge isPro={data.isPro} />
            </div>
            {data.username && (
              <p className="text-sm text-indigo-500 font-medium">@{data.username}</p>
            )}
            <p className="text-gray-500 text-sm sm:text-base">
              {t('readyToStudy')}
            </p>
          </div>
        </div>

        {/* ── Stats ────────────────────────────────────────────────────── */}
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          {[
            { icon: BookOpen,   label: t('totalDecks'), value: String(data.totalDecks), color: 'text-indigo-600 bg-indigo-50'   },
            { icon: LayoutGrid, label: t('totalCards'), value: String(data.totalCards), color: 'text-violet-600 bg-violet-50'   },
            { icon: Zap,        label: t('cardsToday'), value: String(data.cardsToday), color: 'text-amber-600 bg-amber-50'     },
            { icon: Trophy,     label: t('dayStreak'),  value: String(data.streak),     color: 'text-emerald-600 bg-emerald-50' },
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

        {/* ── Go Pro banner ────────────────────────────────────────────── */}
        <GoProBanner isPro={data.isPro} context="499 AI cards · Advanced analytics · LaTeX · Premium deck colors" />

        {/* ── Study activity chart ──────────────────────────────────────── */}
        <StudyChart />

        <p className="text-center text-xs text-gray-400">
          {t('loggedInAs', { email: user.email })}
        </p>
      </main>
    </div>
  );
}
