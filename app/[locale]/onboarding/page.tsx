'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { FlaskConical, Pill, Stethoscope, BookOpen, ArrowRight, Sparkles, Zap, Check } from 'lucide-react';

const SUBJECT_STYLES = {
  medicine:  { gradient: 'from-rose-500 to-pink-600',    bg: 'bg-rose-50',    ring: 'ring-rose-400',    text: 'text-rose-700',    iconBg: 'bg-rose-100',    icon: Stethoscope },
  pharmacy:  { gradient: 'from-emerald-500 to-teal-600', bg: 'bg-emerald-50', ring: 'ring-emerald-400', text: 'text-emerald-700', iconBg: 'bg-emerald-100', icon: Pill },
  chemistry: { gradient: 'from-sky-500 to-blue-600',     bg: 'bg-sky-50',     ring: 'ring-sky-400',     text: 'text-sky-700',     iconBg: 'bg-sky-100',     icon: FlaskConical },
  other:     { gradient: 'from-indigo-500 to-violet-600',bg: 'bg-indigo-50',  ring: 'ring-indigo-400',  text: 'text-indigo-700',  iconBg: 'bg-indigo-100',  icon: BookOpen },
} as const;

type SubjectId = keyof typeof SUBJECT_STYLES;
const SUBJECT_IDS: SubjectId[] = ['medicine', 'pharmacy', 'chemistry', 'other'];

function OnboardingContent() {
  const t = useTranslations('onboarding');
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selected, setSelected] = useState<SubjectId | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleContinue() {
    if (!selected || loading) return;
    setLoading(true);

    try {
      await fetch('/api/onboarding/subject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ subject: selected, locale }),
      });
    } catch {
      // Fail silently — onboarding is not mission-critical
    }

    const next = searchParams.get('next');
    router.push(next && next.startsWith('/') ? next : '/flashcards');
  }

  const selectedDeck = selected ? t(`subjects.${selected}.deck`) : null;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-16 bg-white">
      {/* Header */}
      <div className="mb-10 text-center">
        <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3.5 py-1.5 text-xs font-semibold text-indigo-700">
          <Sparkles className="h-3.5 w-3.5" />
          {t('badge')}
        </span>
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
          {t('title')}
        </h1>
        <p className="mt-3 text-base text-gray-500 max-w-md mx-auto">
          {t('subtitle')}
        </p>
      </div>

      {/* Subject grid */}
      <div className="grid grid-cols-1 gap-4 w-full max-w-lg sm:grid-cols-2">
        {SUBJECT_IDS.map((id) => {
          const style = SUBJECT_STYLES[id];
          const Icon = style.icon;
          const isSelected = selected === id;
          return (
            <button
              key={id}
              onClick={() => setSelected(id)}
              className={`
                group relative flex flex-col items-start gap-3 rounded-2xl border-2 p-5 text-start transition-all duration-200
                ${isSelected
                  ? `border-transparent ring-2 ${style.ring} ${style.bg} shadow-md scale-[1.02]`
                  : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm'
                }
              `}
            >
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${isSelected ? style.iconBg : 'bg-gray-50 group-hover:bg-gray-100'} transition-colors`}>
                <Icon className={`h-5 w-5 ${isSelected ? style.text : 'text-gray-500'}`} />
              </div>

              <div>
                <p className={`text-base font-bold ${isSelected ? style.text : 'text-gray-800'}`}>
                  {t(`subjects.${id}.label`)}
                </p>
                <p className="mt-0.5 text-xs text-gray-500 leading-snug">
                  {t(`subjects.${id}.sub`)}
                </p>
              </div>

              {isSelected && (
                <span className={`absolute top-3 end-3 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br ${style.gradient}`}>
                  <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Continue button */}
      <div className="mt-8 w-full max-w-lg">
        <button
          onClick={handleContinue}
          disabled={!selected || loading}
          className="
            group w-full flex items-center justify-center gap-2 rounded-2xl
            bg-indigo-600 px-8 py-4 text-base font-semibold text-white
            shadow-lg shadow-indigo-200/60
            transition hover:bg-indigo-700 active:scale-95
            disabled:cursor-not-allowed disabled:opacity-40
          "
        >
          {loading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              {t('settingUp')}
            </>
          ) : (
            <>
              {selected
                ? t('continueWith', { deck: selectedDeck ?? '' })
                : t('pickSubject')}
              {!loading && selected && <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />}
            </>
          )}
        </button>

        <p className="mt-4 text-center text-xs text-gray-400">
          {t('footer')}
        </p>
      </div>

      {/* Free vs Pro teaser */}
      <div className="mt-10 w-full max-w-lg">
        <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-400">{t('teaser.title')}</p>
          <div className="grid grid-cols-2 gap-3">
            {/* Free */}
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="mb-3 text-sm font-bold text-gray-700">{t('teaser.freePlan')}</p>
              <ul className="space-y-2">
                {(t.raw('teaser.freeFeatures') as string[]).map((f: string) => (
                  <li key={f} className="flex items-start gap-2 text-xs text-gray-500">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            {/* Pro */}
            <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
              <div className="mb-3 flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-indigo-600" />
                <p className="text-sm font-bold text-indigo-700">{t('teaser.proPlan')}</p>
              </div>
              <ul className="space-y-2">
                {(t.raw('teaser.proFeatures') as string[]).map((f: string) => (
                  <li key={f} className="flex items-start gap-2 text-xs text-indigo-600">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-indigo-400" />
                    {f}
                  </li>
                ))}
              </ul>
              <a
                href="/pricing"
                className="mt-4 block text-center rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors"
              >
                {t('teaser.upgradeButton')}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
      </div>
    }>
      <OnboardingContent />
    </Suspense>
  );
}
