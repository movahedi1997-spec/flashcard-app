import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { jwtVerify } from 'jose';
import { User, ShieldCheck, Languages, CreditCard, LogOut } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import TwoFAToggle from './TwoFAToggle';
import AppNav from '@/components/AppNav';
import LogoutButton from '@/components/LogoutButton';
import DeleteAccountButton from './DeleteAccountButton';
import EditProfileForm from './EditProfileForm';
import SubscriptionSection from './SubscriptionSection';
import LanguageSetting from '@/components/LanguageSetting';
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

// ── Shared section wrapper ────────────────────────────────────────────────────

function Section({
  icon,
  title,
  subtitle,
  children,
  danger,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <section className={`rounded-2xl bg-white p-6 shadow-sm border ${danger ? 'border-red-100' : 'border-gray-100'}`}>
      <div className="flex items-center gap-3 mb-5">
        <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${danger ? 'bg-red-50 text-red-500' : 'bg-indigo-50 text-indigo-600'}`}>
          {icon}
        </div>
        <div>
          <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
          {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

export default async function SettingsPage() {
  const user = await getUserFromCookie();
  const t = await getTranslations('settings');

  const profileResult = await query<ProfileRow>(
    `SELECT username, bio, avatar_url, phone_number,
            COALESCE(two_fa_enabled, true) AS two_fa_enabled,
            COALESCE(is_pro, false) AS is_pro,
            subscription_status
     FROM users WHERE id = $1`,
    [user!.userId],
  ).catch(() => ({
    rows: [{
      username: null, bio: null, avatar_url: null, phone_number: null,
      two_fa_enabled: true, is_pro: false, subscription_status: null,
    }],
  }));

  const profile = profileResult.rows[0] ?? {
    username: null, bio: null, avatar_url: null, phone_number: null,
    two_fa_enabled: true, is_pro: false, subscription_status: null,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AppNav username={profile.username} activePage="settings" />

      <main className="mx-auto max-w-xl px-4 py-10 pb-24 sm:pb-10 space-y-4">
        <h1 className="text-xl font-bold text-gray-900 px-1">{t('title')}</h1>

        {/* ── 1. Account ─────────────────────────────────────────────────────── */}
        <Section
          icon={<User className="h-4 w-4" />}
          title={t('accountInfo')}
          subtitle={user!.email}
        >
          <EditProfileForm
            initialName={user!.name}
            initialUsername={profile.username}
            initialBio={profile.bio}
            initialAvatarUrl={profile.avatar_url}
            initialPhoneNumber={profile.phone_number}
          />
        </Section>

        {/* ── 2. Language ────────────────────────────────────────────────────── */}
        <Section
          icon={<Languages className="h-4 w-4" />}
          title={t('language')}
          subtitle={t('languageDesc')}
        >
          <LanguageSetting />
        </Section>

        {/* ── 3. Security ────────────────────────────────────────────────────── */}
        <Section
          icon={<ShieldCheck className="h-4 w-4" />}
          title={t('security')}
        >
          <TwoFAToggle initialEnabled={profile.two_fa_enabled} />
        </Section>

        {/* ── 4. Subscription ────────────────────────────────────────────────── */}
        <SubscriptionSection isPro={profile.is_pro} subscriptionStatus={profile.subscription_status} />

        {/* ── 5. Sign out + Danger zone ──────────────────────────────────────── */}
        <Section
          icon={<LogOut className="h-4 w-4" />}
          title={t('signOut')}
          danger
        >
          <div className="space-y-6">
            {/* Sign out */}
            <div>
              <p className="text-sm text-gray-500 mb-3">{t('signOutDesc')}</p>
              <LogoutButton />
            </div>

            {/* Divider */}
            <div className="border-t border-red-100" />

            {/* Delete account */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-1">{t('dangerZone')}</p>
              <p className="text-sm text-gray-400 mb-4 leading-relaxed">
                {t('deleteWarningDetail')}
              </p>
              <DeleteAccountButton />
            </div>
          </div>
        </Section>
      </main>
    </div>
  );
}
