'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FlaskConical, Pill, Stethoscope, BookOpen, ArrowRight, Sparkles } from 'lucide-react';

const SUBJECTS = [
  {
    id: 'medicine',
    label: 'Medicine',
    sub: 'USMLE Step 1 · Step 2 · Boards',
    icon: Stethoscope,
    gradient: 'from-rose-500 to-pink-600',
    bg: 'bg-rose-50',
    ring: 'ring-rose-400',
    text: 'text-rose-700',
    iconBg: 'bg-rose-100',
    deck: 'Pharmacology Fundamentals',
  },
  {
    id: 'pharmacy',
    label: 'Pharmacy',
    sub: 'NAPLEX · MPJE · Drug Therapy',
    icon: Pill,
    gradient: 'from-emerald-500 to-teal-600',
    bg: 'bg-emerald-50',
    ring: 'ring-emerald-400',
    text: 'text-emerald-700',
    iconBg: 'bg-emerald-100',
    deck: 'Top 200 Drugs',
  },
  {
    id: 'chemistry',
    label: 'Chemistry',
    sub: 'AP Chem · Organic · Biochemistry',
    icon: FlaskConical,
    gradient: 'from-sky-500 to-blue-600',
    bg: 'bg-sky-50',
    ring: 'ring-sky-400',
    text: 'text-sky-700',
    iconBg: 'bg-sky-100',
    deck: 'AP Chemistry',
  },
  {
    id: 'other',
    label: 'Other / Mixed',
    sub: 'General studying · Custom decks',
    icon: BookOpen,
    gradient: 'from-indigo-500 to-violet-600',
    bg: 'bg-indigo-50',
    ring: 'ring-indigo-400',
    text: 'text-indigo-700',
    iconBg: 'bg-indigo-100',
    deck: 'Pharmacology Fundamentals',
  },
];

// Inner component that uses useSearchParams — must be wrapped in Suspense
function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleContinue() {
    if (!selected || loading) return;
    setLoading(true);

    try {
      await fetch('/api/onboarding/subject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ subject: selected }),
      });
    } catch {
      // Fail silently — onboarding is not mission-critical
    }

    // If user came from a CTA (e.g. copied a deck from Explore), send them back there
    const next = searchParams.get('next');
    router.push(next && next.startsWith('/') ? next : '/flashcards');
  }

  const selectedSubject = SUBJECTS.find((s) => s.id === selected);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-16 bg-white">
      {/* Header */}
      <div className="mb-10 text-center">
        <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3.5 py-1.5 text-xs font-semibold text-indigo-700">
          <Sparkles className="h-3.5 w-3.5" />
          Almost there — one quick question
        </span>
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
          What are you studying?
        </h1>
        <p className="mt-3 text-base text-gray-500 max-w-md mx-auto">
          We'll add a starter deck to your library so you can jump in right away.
        </p>
      </div>

      {/* Subject grid */}
      <div className="grid grid-cols-1 gap-4 w-full max-w-lg sm:grid-cols-2">
        {SUBJECTS.map((s) => {
          const Icon = s.icon;
          const isSelected = selected === s.id;
          return (
            <button
              key={s.id}
              onClick={() => setSelected(s.id)}
              className={`
                group relative flex flex-col items-start gap-3 rounded-2xl border-2 p-5 text-left transition-all duration-200
                ${isSelected
                  ? `border-transparent ring-2 ${s.ring} ${s.bg} shadow-md scale-[1.02]`
                  : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm'
                }
              `}
            >
              {/* Icon */}
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${isSelected ? s.iconBg : 'bg-gray-50 group-hover:bg-gray-100'} transition-colors`}>
                <Icon className={`h-5 w-5 ${isSelected ? s.text : 'text-gray-500'}`} />
              </div>

              {/* Text */}
              <div>
                <p className={`text-base font-bold ${isSelected ? s.text : 'text-gray-800'}`}>
                  {s.label}
                </p>
                <p className="mt-0.5 text-xs text-gray-500 leading-snug">{s.sub}</p>
              </div>

              {/* Selected indicator */}
              {isSelected && (
                <span className={`absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br ${s.gradient}`}>
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
              Setting up your library…
            </>
          ) : (
            <>
              {selected
                ? `Start with ${selectedSubject?.deck ?? 'a starter deck'} →`
                : 'Pick a subject to continue'}
              {!loading && selected && <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />}
            </>
          )}
        </button>

        <p className="mt-4 text-center text-xs text-gray-400">
          You can always add decks from any subject later.
        </p>
      </div>
    </div>
  );
}

// Wrap in Suspense — required because useSearchParams() opts out of static rendering
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
