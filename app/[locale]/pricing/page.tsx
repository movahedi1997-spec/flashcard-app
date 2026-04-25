'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Sparkles, Zap } from 'lucide-react';
import Link from 'next/link';

const PRICES = {
  monthly: {
    id: process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY!,
    amount: '€6.99',
    period: '/month',
    total: null,
  },
  annual: {
    id: process.env.NEXT_PUBLIC_STRIPE_PRICE_ANNUAL!,
    amount: '€5.83',
    period: '/month',
    total: '€69.99 billed annually',
  },
};

const FREE_FEATURES = [
  '189 AI-generated cards per month',
  '49 AI card improvements per month',
  'Up to 50 cards per generation',
  'Unlimited manual flashcards',
  'Spaced repetition (SRS)',
  'PDF & text upload',
  'Public deck sharing',
];

const PRO_FEATURES = [
  '499 AI-generated cards per month',
  '299 AI card improvements per month',
  'Up to 50 cards per generation',
  'Advanced SRS analytics',
  'Early access to new features',
  'All Free features included',
];

export default function PricingPage() {
  const [billing, setBilling] = useState<'monthly' | 'annual'>('annual');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleUpgrade() {
    setLoading(true);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId: PRICES[billing].id }),
      });
      if (res.status === 401) { router.push('/login?next=/pricing'); return; }
      const { url } = await res.json() as { url: string };
      if (url) window.location.href = url;
    } finally {
      setLoading(false);
    }
  }

  const price = PRICES[billing];
  const saving = billing === 'annual' ? 'Save 17%' : null;

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white px-4 py-16">
      <div className="mx-auto max-w-4xl">

        {/* Header */}
        <div className="text-center mb-12">
          <Link href="/" className="text-sm text-indigo-600 hover:underline">← Back to FlashcardAI</Link>
          <h1 className="mt-6 text-4xl font-black text-gray-900 tracking-tight">Simple, honest pricing</h1>
          <p className="mt-3 text-lg text-gray-500">Start free. Upgrade when you need more AI power.</p>
        </div>

        {/* Billing toggle */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex rounded-xl border border-gray-200 bg-white p-1 shadow-sm">
            <button
              onClick={() => setBilling('monthly')}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                billing === 'monthly'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBilling('annual')}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                billing === 'annual'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Annual
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                billing === 'annual' ? 'bg-white/20 text-white' : 'bg-green-100 text-green-700'
              }`}>
                Save 17%
              </span>
            </button>
          </div>
        </div>

        {/* Cards */}
        <div className="grid gap-6 sm:grid-cols-2">

          {/* Free */}
          <div className="rounded-2xl border border-gray-200 bg-white p-8">
            <div className="mb-6">
              <p className="text-sm font-semibold uppercase tracking-widest text-gray-400">Free</p>
              <p className="mt-2 text-4xl font-black text-gray-900">€0</p>
              <p className="text-sm text-gray-400 mt-1">forever</p>
            </div>
            <ul className="space-y-3 mb-8">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm text-gray-600">
                  <Check size={16} className="text-gray-400 mt-0.5 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/signup"
              className="block w-full text-center rounded-xl border border-gray-200 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Get started free
            </Link>
          </div>

          {/* Pro */}
          <div className="rounded-2xl border-2 border-indigo-500 bg-gradient-to-b from-indigo-50/50 to-white p-8 relative shadow-lg shadow-indigo-100">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-600 px-4 py-1 text-xs font-bold text-white">
                <Sparkles size={11} /> Most popular
              </span>
            </div>

            <div className="mb-6">
              <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">Pro</p>
              <div className="mt-2 flex items-end gap-1">
                <p className="text-4xl font-black text-gray-900">{price.amount}</p>
                <p className="text-gray-400 mb-1">{price.period}</p>
              </div>
              {price.total && (
                <p className="text-xs text-gray-400 mt-1">{price.total}</p>
              )}
              {saving && billing === 'monthly' && (
                <p className="text-xs text-green-600 mt-1 font-medium">Switch to annual and save 17%</p>
              )}
            </div>

            <ul className="space-y-3 mb-8">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm text-gray-700">
                  <Check size={16} className="text-indigo-500 mt-0.5 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>

            <button
              onClick={handleUpgrade}
              disabled={loading}
              className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white hover:bg-indigo-700 active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              ) : (
                <><Zap size={15} /> Upgrade to Pro</>
              )}
            </button>
            <p className="text-center text-xs text-gray-400 mt-3">Cancel anytime · Secure payment via Stripe</p>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-16 max-w-xl mx-auto space-y-6">
          <h2 className="text-xl font-bold text-gray-900 text-center">Common questions</h2>
          {[
            {
              q: 'Can I cancel anytime?',
              a: 'Yes. You can cancel your subscription at any time from Settings → Subscription. You keep Pro access until the end of your billing period.',
            },
            {
              q: 'What happens to my cards if I cancel?',
              a: 'All your flashcards and study progress are kept forever. You simply return to the free plan limits.',
            },
            {
              q: 'Is there a student discount?',
              a: 'Not yet, but we\'re working on a .edu pricing tier. Join the waitlist by emailing contact@movahedi.net.',
            },
            {
              q: 'Do you offer refunds?',
              a: 'Yes. EU and UK users have a 14-day right of withdrawal. Contact contact@movahedi.net for any refund requests.',
            },
          ].map(({ q, a }) => (
            <div key={q}>
              <p className="font-semibold text-gray-800">{q}</p>
              <p className="mt-1 text-sm text-gray-500">{a}</p>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-gray-300 mt-12">
          © {new Date().getFullYear()} FlashcardAI ·{' '}
          <Link href="/privacy" className="hover:text-indigo-500">Privacy</Link> ·{' '}
          <Link href="/terms" className="hover:text-indigo-500">Terms</Link>
        </p>
      </div>
    </main>
  );
}
