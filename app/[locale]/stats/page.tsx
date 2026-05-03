import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { jwtVerify } from 'jose';
import { query } from '@/lib/db';
import { getTranslations } from 'next-intl/server';
import AppNav from '@/components/AppNav';
import SRSStatsClient from './SRSStatsClient';
import { Link } from '@/i18n/navigation';
import { Zap } from 'lucide-react';

const secret = new TextEncoder().encode(
  process.env.ACCESS_JWT_SECRET ?? 'dev-access-secret-change-in-production-32x',
);

export const metadata = { title: 'Study Analytics · FlashcardAI' };

async function getUser() {
  const token = cookies().get('token')?.value;
  if (!token) redirect('/login?next=/stats');
  try {
    const { payload } = await jwtVerify(token, secret);
    return {
      userId: payload.userId as string,
      name:   payload.name   as string,
    };
  } catch {
    redirect('/login?next=/stats');
  }
}

export default async function StatsPage() {
  const user = await getUser();
  const t = await getTranslations('stats');

  const [profileRow, usernameRow] = await Promise.all([
    query<{ is_pro: boolean }>('SELECT is_pro FROM users WHERE id = $1', [user!.userId]),
    query<{ username: string | null }>('SELECT username FROM users WHERE id = $1', [user!.userId]),
  ]);

  const isPro     = profileRow.rows[0]?.is_pro ?? false;
  const username  = usernameRow.rows[0]?.username ?? null;

  if (!isPro) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppNav username={username} activePage="stats" />
        <main className="mx-auto max-w-2xl px-4 py-20 text-center">
          <div className="rounded-2xl border border-indigo-100 bg-white p-10 shadow-sm">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50">
              <Zap className="h-8 w-8 text-indigo-500" />
            </div>
            <h1 className="text-2xl font-black text-gray-900">{t('proTitle')}</h1>
            <p className="mt-3 text-gray-500 max-w-sm mx-auto">
              {t('proDescription')}
            </p>
            <Link
              href="/pricing"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white hover:bg-indigo-700 transition-colors"
            >
              <Zap size={15} /> {t('upgradeToPro')}
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppNav username={username} activePage="stats" />
      <main className="mx-auto max-w-5xl px-4 py-8 pb-24 sm:pb-8">
        <div className="mb-6">
          <h1 className="text-2xl font-black text-gray-900">{t('title')}</h1>
          <p className="text-sm text-gray-500 mt-1">{t('subtitle')}</p>
        </div>
        <SRSStatsClient />
      </main>
    </div>
  );
}
