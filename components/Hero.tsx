import Link from 'next/link';
import { ArrowRight, Zap, BookOpen } from 'lucide-react';
import { useTranslations } from 'next-intl';

const GRADE_BUTTONS = [
  { label: 'Again', sub: '1d',  bg: 'bg-red-500/20',     text: 'text-red-300'     },
  { label: 'Hard',  sub: '3d',  bg: 'bg-orange-500/20',  text: 'text-orange-300'  },
  { label: 'Good',  sub: '7d',  bg: 'bg-emerald-500/20', text: 'text-emerald-300' },
  { label: 'Easy',  sub: '11d', bg: 'bg-indigo-500/20',  text: 'text-indigo-300'  },
];

export default function Hero() {
  const t = useTranslations('home.hero');

  return (
    <section className="relative overflow-hidden bg-slate-950 pt-28 pb-20 lg:pt-36 lg:pb-28">

      {/* Graph paper overlay */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h40v40H0z' fill='none'/%3E%3Cpath d='M40 0v40M0 0h40' stroke='%23fff' stroke-width='0.5'/%3E%3C/svg%3E")`,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Glow orbs */}
      <div aria-hidden className="orb-pulse pointer-events-none absolute -top-32 left-1/4 h-[500px] w-[500px] rounded-full bg-indigo-600/25 blur-3xl" />
      <div aria-hidden className="orb-pulse pointer-events-none absolute -bottom-20 right-1/4 h-[400px] w-[400px] rounded-full bg-violet-600/20 blur-3xl" style={{ animationDelay: '2.5s' }} />

      <div className="relative mx-auto max-w-6xl px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">

          {/* ── Left: copy ─────────────────────────────────────────────── */}
          <div className="splash-s0">
            {/* Trust badge */}
            <div className="mb-6 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-300 backdrop-blur-sm">
                {t('badgeMadeIn')}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-300 backdrop-blur-sm">
                {t('badgeDsgvo')}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300 backdrop-blur-sm">
                {t('badgeFree')}
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-5xl font-black leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-7xl">
              {t('headline1')}<br />
              <span className="shimmer-text">{t('headline2')}</span>
            </h1>

            {/* Sub */}
            <p className="mt-6 text-lg leading-relaxed text-slate-400 max-w-lg">
              {t('subtext')}
            </p>

            {/* CTAs */}
            <div className="mt-10 flex flex-wrap gap-3">
              <Link
                href="/signup"
                className="group inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-900/50 transition hover:bg-indigo-500 active:scale-[0.98]"
              >
                {t('ctaStart')}
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/explore"
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-6 py-3.5 text-sm font-bold text-slate-200 backdrop-blur-sm transition hover:bg-white/10 active:scale-[0.98]"
              >
                <BookOpen className="h-4 w-4" />
                {t('ctaBrowse')}
              </Link>
            </div>

            {/* Social proof */}
            <p className="mt-6 text-xs text-slate-500">
              {t('socialProof')}
            </p>
          </div>

          {/* ── Right: 3D animated card stack ──────────────────────────── */}
          <div className="flex items-center justify-center lg:justify-end">
            <div className="relative w-[320px] h-[380px] sm:w-[360px]">

              {/* Glow behind cards */}
              <div aria-hidden className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />

              {/* Card 3 — deepest */}
              <div
                aria-hidden
                className="float-card-3 absolute top-14 start-0 h-52 w-72 rounded-2xl border border-white/8 bg-gradient-to-br from-slate-800 to-slate-900"
              />

              {/* Card 2 — middle */}
              <div
                aria-hidden
                className="float-card-2 absolute top-7 start-6 h-52 w-72 rounded-2xl border border-white/10 bg-gradient-to-br from-indigo-900/80 to-violet-900/80"
              />

              {/* Card 1 — front (full UI mockup) */}
              <div
                className="float-card-1 absolute top-0 start-12 w-[280px] rounded-2xl bg-white shadow-2xl shadow-black/50"
              >
                {/* Card header */}
                <div className="flex items-center justify-between border-b border-gray-100 px-5 pt-4 pb-3">
                  <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-600">
                    Cardiology
                  </span>
                  <span className="flex items-center gap-1 text-xs text-gray-300">
                    <Zap className="h-3 w-3 text-amber-400" />
                    3 due today
                  </span>
                </div>

                {/* Question */}
                <div className="px-5 pt-4 pb-3">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5">Question</p>
                  <p className="text-sm font-bold text-gray-900 leading-snug">
                    Mechanism of action of Metoprolol?
                  </p>
                </div>

                {/* Answer */}
                <div className="mx-4 mb-4 rounded-xl bg-indigo-50 px-4 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-indigo-400 mb-1">Answer</p>
                  <p className="text-xs text-indigo-900 leading-relaxed">
                    Selective β₁ blocker → ↓ HR, ↓ contractility, ↓ BP. Used in hypertension & heart failure.
                  </p>
                </div>

                {/* Grade buttons */}
                <div className="grid grid-cols-4 gap-1.5 px-4 pb-4">
                  {GRADE_BUTTONS.map(({ label, sub, bg, text }) => (
                    <div key={label} className={`${bg} rounded-xl py-2 text-center backdrop-blur-sm`}>
                      <p className={`text-[11px] font-bold ${text}`}>{label}</p>
                      <p className={`text-[10px] ${text} opacity-70`}>{sub}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* ── Stats bar ──────────────────────────────────────────────────── */}
        <div className="mt-20 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/8 bg-white/8 sm:grid-cols-4">
          {[
            { value: 'SM-2',    label: t('statsAlgorithm') },
            { value: '3',       label: t('statsModes')     },
            { value: 'Offline', label: t('statsOffline')   },
            { value: '100%',    label: t('statsFree')      },
          ].map(({ value, label }) => (
            <div key={label} className="bg-slate-900/60 px-6 py-5 text-center backdrop-blur-sm">
              <p className="text-2xl font-black text-indigo-400">{value}</p>
              <p className="mt-0.5 text-xs text-slate-500">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
