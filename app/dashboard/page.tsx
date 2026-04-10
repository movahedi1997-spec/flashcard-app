import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { jwtVerify } from 'jose';
import { Layers, BookOpen, Zap, Trophy } from 'lucide-react';
import Link from 'next/link';
import LogoutButton from './LogoutButton';

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET ?? 'dev-secret-key-change-in-production',
);

async function getUserFromCookie() {
  const cookieStore = cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) redirect('/login');

  try {
    const { payload } = await jwtVerify(token, secret);
    return {
      name: payload.name as string,
      email: payload.email as string,
    };
  } catch {
    redirect('/login');
  }
}

const stats = [
  { icon: BookOpen, label: 'Total Decks', value: '—', color: 'text-indigo-600 bg-indigo-50' },
  { icon: Layers,   label: 'Total Cards', value: '—', color: 'text-violet-600 bg-violet-50' },
  { icon: Zap,      label: 'Cards Today', value: '—', color: 'text-amber-600  bg-amber-50'  },
  { icon: Trophy,   label: 'Day Streak',  value: '—', color: 'text-emerald-600 bg-emerald-50' },
];

export default async function DashboardPage() {
  const user = await getUserFromCookie();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <header className="border-b border-gray-100 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2 font-bold text-indigo-600">
            <Layers className="h-6 w-6" />
            <span>FlashCard</span>
          </Link>
          <LogoutButton />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12">
        {/* Welcome */}
        <div className="mb-10">
          <h1 className="text-3xl font-extrabold text-gray-900">
            Welcome back, {user.name.split(' ')[0]}! 👋
          </h1>
          <p className="mt-1 text-gray-500">
            Ready to sharpen your knowledge today?
          </p>
        </div>

        {/* Stats */}
        <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map(({ icon: Icon, label, value, color }) => (
            <div
              key={label}
              className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
            >
              <div
                className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl ${color}`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="mt-0.5 text-sm text-gray-500">{label}</p>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
          <h2 className="mb-6 text-xl font-bold text-gray-900">
            Quick Actions
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Link
              href="/flashcards"
              className="flex items-center gap-4 rounded-xl border border-indigo-100 bg-indigo-50 p-5 transition hover:bg-indigo-100"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white">
                <Layers className="h-5 w-5" />
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
                <p className="text-sm text-gray-500">
                  Review your due cards now
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Account info */}
        <p className="mt-6 text-center text-xs text-gray-400">
          Logged in as {user.email}
        </p>
      </main>
    </div>
  );
}
