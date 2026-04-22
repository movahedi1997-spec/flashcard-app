import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { jwtVerify } from 'jose';
import { User, ShieldAlert, Globe, LogOut, ShieldCheck } from 'lucide-react';
import TwoFAToggle from './TwoFAToggle';
import AppNav from '@/components/AppNav';
import LogoutButton from '@/components/LogoutButton';
import Link from 'next/link';
import DeleteAccountButton from './DeleteAccountButton';
import EditProfileForm from './EditProfileForm';
import SubscriptionSection from './SubscriptionSection';
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
    return { userId: payload.userId as string, name: payload.name as string, email: payload.email as string };
  } catch {
    redirect('/login');
  }
}

interface ProfileRow {
  username: string | null;
  bio: string | null;
  avatar_url: string | null;
  phone_number: string | null;
  two_fa_enabled: boolean;
  is_pro: boolean;
  subscription_status: string | null;
}

export default async function SettingsPage() {
  const user = await getUserFromCookie();

  // Fetch extended profile fields (may not exist on older accounts)
  const profileResult = await query<ProfileRow>(
    `SELECT username, bio, avatar_url, phone_number,
            COALESCE(two_fa_enabled, true) AS two_fa_enabled,
            COALESCE(is_pro, false) AS is_pro,
            subscription_status
     FROM users WHERE id = $1`,
    [user!.userId],
  ).catch(() => ({ rows: [{ username: null, bio: null, avatar_url: null, phone_number: null, two_fa_enabled: true, is_pro: false, subscription_status: null }] }));

  const profile = profileResult.rows[0] ?? { username: null, bio: null, avatar_url: null, phone_number: null, two_fa_enabled: true, is_pro: false, subscription_status: null };

  return (
    <div className="min-h-screen">
      <AppNav username={profile.username} activePage="settings" />

      <main className="mx-auto max-w-2xl px-6 py-12 pb-24 sm:pb-12 space-y-8">
        <h1 className="text-2xl font-extrabold text-gray-900">Account Settings</h1>

        {/* Account info */}
        <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <User className="h-5 w-5" />
            </div>
            <h2 className="text-base font-semibold text-gray-900">Account info</h2>
          </div>
          <dl className="space-y-3 text-sm">
            <div className="flex gap-3">
              <dt className="w-16 text-xs font-semibold text-gray-400 uppercase tracking-wide pt-0.5">Email</dt>
              <dd className="text-gray-800 font-medium">{user!.email}</dd>
            </div>
          </dl>
        </section>

        {/* Public profile */}
        <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Public profile</h2>
              <p className="text-xs text-gray-400">Shown on your creator page and published decks</p>
            </div>
          </div>

          <EditProfileForm
            initialName={user!.name}
            initialUsername={profile.username}
            initialBio={profile.bio}
            initialAvatarUrl={profile.avatar_url}
            initialPhoneNumber={profile.phone_number}
          />
        </section>

        {/* Subscription */}
        <SubscriptionSection isPro={profile.is_pro} subscriptionStatus={profile.subscription_status} />

        {/* Security */}
        <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h2 className="text-base font-semibold text-gray-900">Security</h2>
          </div>
          <TwoFAToggle initialEnabled={profile.two_fa_enabled} />
        </section>

        {/* Sign out */}
        <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-50 text-gray-500">
              <LogOut className="h-5 w-5" />
            </div>
            <h2 className="text-base font-semibold text-gray-900">Sign out</h2>
          </div>
          <p className="text-sm text-gray-500 mb-5">Sign out of your account on this device.</p>
          <LogoutButton />
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
