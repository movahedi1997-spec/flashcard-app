import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { jwtVerify } from 'jose';
import { User, ShieldAlert } from 'lucide-react';
import FlashLogoMark from '@/components/FlashLogoMark';
import Link from 'next/link';
import DeleteAccountButton from './DeleteAccountButton';

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
      name:  payload.name  as string,
      email: payload.email as string,
    };
  } catch {
    redirect('/login');
  }
}

export default async function SettingsPage() {
  const user = await getUserFromCookie();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-100 bg-white">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5 font-bold text-gray-900">
            <FlashLogoMark size={26} />
            <span>Flash<span className="text-indigo-600">Card</span></span>
          </Link>
          <Link
            href="/dashboard"
            className="text-sm text-gray-500 hover:text-indigo-600 transition"
          >
            ← Dashboard
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-12 space-y-8">
        <h1 className="text-2xl font-extrabold text-gray-900">Account Settings</h1>

        {/* Account info */}
        <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <User className="h-5 w-5" />
            </div>
            <h2 className="text-base font-semibold text-gray-900">Account info</h2>
          </div>

          <dl className="space-y-4">
            <div>
              <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Name</dt>
              <dd className="text-sm font-medium text-gray-900">{user!.name}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Email</dt>
              <dd className="text-sm font-medium text-gray-900">{user!.email}</dd>
            </div>
          </dl>
        </section>

        {/* Danger zone */}
        <section className="rounded-2xl border border-red-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-500">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <h2 className="text-base font-semibold text-gray-900">Danger Zone</h2>
          </div>

          <p className="text-sm text-gray-500 mb-5 leading-relaxed">
            Permanently delete your account and all data — decks, cards, study history, and SRS
            progress. This cannot be undone.
          </p>

          <DeleteAccountButton />
        </section>
      </main>
    </div>
  );
}
