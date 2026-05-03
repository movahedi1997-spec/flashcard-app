'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CreditCard, Sparkles, CheckCircle2, ExternalLink, Zap, XCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';

interface Props {
  isPro: boolean;
  subscriptionStatus: string | null;
}

export default function SubscriptionSection({ isPro, subscriptionStatus }: Props) {
  const t = useTranslations('settings');
  const searchParams = useSearchParams();
  const router = useRouter();
  const [showSuccess, setShowSuccess] = useState(false);
  const [showCancelled, setShowCancelled] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    const param = searchParams.get('upgraded');
    if (param === 'true') {
      setShowSuccess(true);
      router.replace('/settings' as Parameters<typeof router.replace>[0], { scroll: false });
      const t = setTimeout(() => setShowSuccess(false), 6000);
      return () => clearTimeout(t);
    }
    if (param === 'cancelled') {
      setShowCancelled(true);
      router.replace('/settings' as Parameters<typeof router.replace>[0], { scroll: false });
      const t = setTimeout(() => setShowCancelled(false), 6000);
      return () => clearTimeout(t);
    }
  }, [searchParams, router]);

  async function openPortal() {
    setPortalLoading(true);
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' });
      const { url } = await res.json() as { url: string };
      if (url) window.location.href = url;
    } finally {
      setPortalLoading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      {/* Cancelled banner */}
      {showCancelled && (
        <div className="mb-5 flex items-center gap-3 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
          <XCircle size={18} className="text-amber-500 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800">{t('paymentCancelled')}</p>
            <p className="text-xs text-amber-600 mt-0.5">{t('paymentCancelledDesc')}</p>
          </div>
        </div>
      )}

      {/* Success banner */}
      {showSuccess && (
        <div className="mb-5 flex items-center gap-3 rounded-xl bg-green-50 border border-green-200 px-4 py-3">
          <CheckCircle2 size={18} className="text-green-500 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-green-800">{t('nowPro')}</p>
            <p className="text-xs text-green-600 mt-0.5">{t('nowProDesc')}</p>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 mb-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
          <CreditCard className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-gray-900">{t('subscription')}</h2>
          <p className="text-xs text-gray-400">{t('subscriptionDesc')}</p>
        </div>
      </div>

      {isPro ? (
        <div className="space-y-4">
          {/* Pro badge */}
          <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-100 px-4 py-3">
            <div className="flex items-center gap-2.5">
              <Sparkles size={16} className="text-indigo-500" />
              <div>
                <p className="text-sm font-bold text-indigo-700">{t('proPlan')}</p>
                <p className="text-xs text-indigo-400 mt-0.5 capitalize">
                  {subscriptionStatus === 'paused' ? t('proPaused') : t('proActive')}
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-indigo-600 bg-indigo-100 px-2.5 py-1 rounded-full">
              {subscriptionStatus === 'paused' ? t('statusPaused') : t('statusActive')}
            </span>
          </div>

          <button
            onClick={openPortal}
            disabled={portalLoading}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-indigo-600 transition-colors disabled:opacity-50"
          >
            {portalLoading
              ? <span className="h-3.5 w-3.5 rounded-full border-2 border-gray-300 border-t-indigo-500 animate-spin" />
              : <ExternalLink size={14} />
            }
            {t('manageSubscription')}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Free badge */}
          <div className="flex items-center justify-between rounded-xl bg-gray-50 border border-gray-100 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-gray-700">{t('freePlan')}</p>
              <p className="text-xs text-gray-400 mt-0.5">{t('freeHint')}</p>
            </div>
            <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">{t('free')}</span>
          </div>

          <Link
            href="/pricing"
            className="flex items-center justify-center gap-2 w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 transition-colors"
          >
            <Zap size={14} /> {t('upgradeProPrice')}
          </Link>
        </div>
      )}
    </section>
  );
}
