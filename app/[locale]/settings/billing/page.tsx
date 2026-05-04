import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { jwtVerify } from 'jose';
import { ArrowLeft, Sparkles, Zap, CheckCircle2, Coins } from 'lucide-react';
import Link from 'next/link';
import { query } from '@/lib/db';
import AppNav from '@/components/AppNav';
import BuyCreditsButton from './BuyCreditsButton';
import { CREDIT_PACKAGES } from '@/lib/creditPackages';

export const dynamic = 'force-dynamic';

const secret = new TextEncoder().encode(
  process.env.ACCESS_JWT_SECRET ?? 'dev-access-secret-change-in-production-32x',
);

const FLASHCARD_FREE_LIMIT = 189;
const FLASHCARD_PRO_LIMIT  = 499;
const QUIZ_FREE_LIMIT      = 94;
const QUIZ_PRO_LIMIT       = 499;

interface UserRow {
  username:            string | null;
  is_pro:              boolean;
  subscription_status: string | null;
  ai_credits:          number;
}

export default async function BillingPage() {
  const token = cookies().get('token')?.value;
  if (!token) redirect('/login');

  let userId: string;
  try {
    const { payload } = await jwtVerify(token, secret);
    userId = payload.userId as string;
  } catch {
    redirect('/login');
  }

  const [userResult, usageResult] = await Promise.all([
    query<UserRow>(
      `SELECT username, COALESCE(is_pro, false) AS is_pro, subscription_status,
              COALESCE(ai_credits, 0) AS ai_credits
       FROM users WHERE id = $1`,
      [userId],
    ),
    query<{ cards_generated: number }>(
      'SELECT cards_generated FROM ai_usage WHERE user_id = $1 AND month = $2',
      [userId, new Date().toISOString().slice(0, 7)],
    ),
  ]);

  const user  = userResult.rows[0]!;
  const used  = usageResult.rows[0]?.cards_generated ?? 0;
  const isPro = user.is_pro;

  const flashcardLimit    = isPro ? FLASHCARD_PRO_LIMIT : FLASHCARD_FREE_LIMIT;
  const quizLimit         = isPro ? QUIZ_PRO_LIMIT : QUIZ_FREE_LIMIT;
  const flashcardMonthly  = Math.max(0, flashcardLimit - used);
  const quizMonthly       = Math.max(0, quizLimit - used);
  const flashcardPct      = Math.min(100, Math.round((used / flashcardLimit) * 100));
  const quizPct           = Math.min(100, Math.round((used / quizLimit) * 100));

  return (
    <div className="min-h-screen bg-gray-50">
      <AppNav username={user.username} activePage="settings" />

      <main className="mx-auto max-w-xl px-4 py-10 pb-24 sm:pb-10 space-y-4">
        <div className="flex items-center gap-3 px-1 mb-6">
          <Link href="/settings" className="text-gray-400 hover:text-indigo-600 transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-bold text-gray-900">Credits &amp; Billing</h1>
        </div>

        {/* ── Current plan ──────────────────────────────────────────────────── */}
        <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Sparkles className="h-4 w-4" />
            </div>
            <h2 className="text-sm font-semibold text-gray-900">Your Plan</h2>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Free plan */}
            <div className={`rounded-xl border p-4 ${!isPro ? 'border-indigo-300 bg-indigo-50' : 'border-gray-100 bg-gray-50 opacity-60'}`}>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Free</p>
              <p className="text-2xl font-black text-gray-900">€0</p>
              <p className="text-xs text-gray-400 mb-3">per month</p>
              <ul className="space-y-1 text-xs text-gray-600">
                <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" /> 189 AI flashcards/month</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" /> 94 AI quiz questions/month</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" /> Buy extra credits</li>
              </ul>
              {!isPro && (
                <span className="mt-3 inline-block text-xs font-bold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full">Current plan</span>
              )}
            </div>

            {/* Pro plan */}
            <div className={`rounded-xl border p-4 ${isPro ? 'border-indigo-300 bg-indigo-50' : 'border-gray-100 bg-white'}`}>
              <p className="text-xs font-bold text-indigo-500 uppercase tracking-wider mb-2">Pro</p>
              <p className="text-2xl font-black text-gray-900">€6.99</p>
              <p className="text-xs text-gray-400 mb-3">per month</p>
              <ul className="space-y-1 text-xs text-gray-600">
                <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" /> 499 AI flashcards/month</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" /> 499 AI quiz questions/month</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" /> Priority AI generation</li>
              </ul>
              {isPro ? (
                <span className="mt-3 inline-block text-xs font-bold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full">
                  {user.subscription_status === 'paused' ? 'Paused' : 'Active'}
                </span>
              ) : (
                <Link
                  href="/pricing"
                  className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-lg transition"
                >
                  <Zap className="h-3 w-3" /> Upgrade
                </Link>
              )}
            </div>
          </div>
        </section>

        {/* ── AI usage this month ────────────────────────────────────────────── */}
        <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Zap className="h-4 w-4" />
            </div>
            <h2 className="text-sm font-semibold text-gray-900">AI Usage This Month</h2>
          </div>

          {/* Flashcards */}
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="font-medium text-gray-600">Flashcard generation</span>
              <span className="font-bold text-gray-800 tabular-nums">{flashcardMonthly} remaining</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${flashcardPct >= 90 ? 'bg-red-500' : flashcardPct >= 60 ? 'bg-amber-500' : 'bg-indigo-500'}`}
                style={{ width: `${flashcardPct}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">{used} / {flashcardLimit} used</p>
          </div>

          {/* Quiz questions */}
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="font-medium text-gray-600">Quiz question generation</span>
              <span className="font-bold text-gray-800 tabular-nums">{quizMonthly} remaining</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${quizPct >= 90 ? 'bg-red-500' : quizPct >= 60 ? 'bg-amber-500' : 'bg-indigo-500'}`}
                style={{ width: `${quizPct}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">{used} / {quizLimit} used · Resets next month</p>
          </div>
        </section>

        {/* ── Bonus credits balance ──────────────────────────────────────────── */}
        <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <Coins className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Bonus Credits</h2>
                <p className="text-xs text-gray-400">Used after your monthly quota runs out</p>
              </div>
            </div>
            <span className="text-2xl font-black text-gray-900 tabular-nums">{user.ai_credits}</span>
          </div>
        </section>

        {/* ── Buy credits ────────────────────────────────────────────────────── */}
        <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Coins className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Buy More Credits</h2>
              <p className="text-xs text-gray-400">One-time purchase · Never expire · Works for flashcards &amp; quizzes</p>
            </div>
          </div>

          <div className="space-y-2.5">
            {CREDIT_PACKAGES.map((pkg, i) => (
              <BuyCreditsButton
                key={pkg.id}
                packageId={pkg.id}
                label={pkg.label}
                price={pkg.price}
                credits={pkg.credits}
                highlighted={i === 3}
              />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
