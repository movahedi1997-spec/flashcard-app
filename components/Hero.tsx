import Link from 'next/link';
import { ArrowRight, CheckCircle2, BookOpen, Upload, LayoutGrid } from 'lucide-react';

const GRADE_BUTTONS = [
  { label: 'Again', sub: '1d',  bg: 'bg-red-50',     text: 'text-red-600',     sub_text: 'text-red-400'     },
  { label: 'Hard',  sub: '3d',  bg: 'bg-orange-50',  text: 'text-orange-600',  sub_text: 'text-orange-400'  },
  { label: 'Good',  sub: '7d',  bg: 'bg-emerald-50', text: 'text-emerald-700', sub_text: 'text-emerald-500' },
  { label: 'Easy',  sub: '11d', bg: 'bg-indigo-50',  text: 'text-indigo-600',  sub_text: 'text-indigo-400'  },
];

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-white pt-28 pb-16 lg:pt-32 lg:pb-24">
      {/* Background blobs */}
      <div aria-hidden className="pointer-events-none absolute -top-60 -right-60 h-[700px] w-[700px] rounded-full bg-indigo-100/60 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-60 -left-60 h-[600px] w-[600px] rounded-full bg-violet-100/50 blur-3xl" />

      <div className="relative mx-auto max-w-6xl px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">

          {/* ── Left: copy ─────────────────────────────────────────────────── */}
          <div>
            {/* Badge */}
            <span className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3.5 py-1.5 text-xs font-semibold text-indigo-700">
              🎓 Built for USMLE · NAPLEX · Chemistry
            </span>

            {/* Headline */}
            <h1 className="text-5xl font-extrabold leading-[1.1] tracking-tight text-gray-900 sm:text-6xl">
              Study Smarter.<br />
              <span className="gradient-text">Master Your Boards.</span>
            </h1>

            {/* Sub */}
            <p className="mt-6 text-lg leading-relaxed text-gray-500 max-w-lg">
              Create flashcard decks, study with intelligent daily scheduling, or cram with Turbo Mode before an exam — all built for medical, pharmacy, and chemistry students.
            </p>

            {/* Trust bullets */}
            <ul className="mt-6 space-y-2">
              {[
                'Daily Review shows only the cards you need today',
                'Turbo Mode for fast, pre-exam cramming',
                'Tracks your retention so you never forget',
              ].map((point) => (
                <li key={point} className="flex items-start gap-2.5 text-sm text-gray-600">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />
                  {point}
                </li>
              ))}
            </ul>

            {/* 3 activation path CTAs */}
            <div className="mt-10 space-y-3">
              {/* Primary CTA — Browse Explore (zero auth) */}
              <Link
                href="/explore"
                className="group flex w-full items-center gap-3 rounded-2xl bg-indigo-600 px-5 py-4 text-base font-semibold text-white shadow-lg shadow-indigo-200/60 transition hover:bg-indigo-700 active:scale-[0.98] sm:w-auto sm:inline-flex"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20">
                  <LayoutGrid className="h-4 w-4" />
                </span>
                <span className="flex-1">Browse 1,000+ Free Flashcard Decks</span>
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </Link>

              {/* Secondary CTAs row */}
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/signup"
                  className="group flex flex-1 items-center gap-2.5 rounded-2xl border-2 border-gray-100 bg-white px-5 py-3.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 active:scale-[0.98]"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100 group-hover:bg-indigo-100">
                    <Upload className="h-3.5 w-3.5" />
                  </span>
                  Upload PDF or AI Generate
                </Link>
                <Link
                  href="/signup"
                  className="group flex flex-1 items-center gap-2.5 rounded-2xl border-2 border-gray-100 bg-white px-5 py-3.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 active:scale-[0.98]"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100 group-hover:bg-indigo-100">
                    <BookOpen className="h-3.5 w-3.5" />
                  </span>
                  Create Deck Manually
                </Link>
              </div>
            </div>

            {/* Social proof */}
            <p className="mt-5 text-xs text-gray-400">
              No account needed to browse · Free forever · Works on all devices
            </p>
          </div>

          {/* ── Right: 3D card illustration ────────────────────────────────── */}
          <div className="flex items-center justify-center lg:justify-end">
            {/* Floating wrapper */}
            <div className="hero-cards-float relative w-[340px] h-[320px]">

              {/* Glow */}
              <div aria-hidden className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-56 w-56 rounded-full bg-indigo-400/20 blur-3xl" />

              {/* Card 3 — back-left */}
              <div
                aria-hidden
                className="absolute top-8 left-0 h-44 w-64 rounded-2xl bg-gradient-to-br from-violet-200 to-indigo-200 shadow-md"
                style={{ transform: 'perspective(800px) rotateY(-18deg) rotateX(6deg)' }}
              />

              {/* Card 2 — mid */}
              <div
                aria-hidden
                className="absolute top-4 left-6 h-44 w-64 rounded-2xl bg-gradient-to-br from-indigo-300 to-violet-300 shadow-lg"
                style={{ transform: 'perspective(800px) rotateY(-12deg) rotateX(4deg)' }}
              />

              {/* Card 1 — front (main) */}
              <div
                className="absolute top-0 left-12 w-[280px] rounded-2xl border border-gray-100 bg-white shadow-2xl shadow-indigo-200/50"
                style={{ transform: 'perspective(800px) rotateY(-6deg) rotateX(3deg)' }}
              >
                {/* Card header */}
                <div className="flex items-center justify-between border-b border-gray-50 px-5 pt-4 pb-3">
                  <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-600">
                    Cardiology
                  </span>
                  <span className="text-xs text-gray-300">3 / 24 due</span>
                </div>

                {/* Question */}
                <div className="px-5 py-4">
                  <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1.5">Question</p>
                  <p className="text-sm font-semibold text-gray-800 leading-snug">
                    Mechanism of action of Metoprolol?
                  </p>
                </div>

                {/* Answer (revealed) */}
                <div className="mx-4 mb-4 rounded-xl bg-indigo-50/70 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-widest text-indigo-400 mb-1">Answer</p>
                  <p className="text-xs text-indigo-800 leading-relaxed">
                    Selective β₁ blocker → ↓ HR, ↓ contractility, ↓ BP. Used in hypertension & heart failure.
                  </p>
                </div>

                {/* Grade buttons */}
                <div className="grid grid-cols-4 gap-1.5 px-4 pb-4">
                  {GRADE_BUTTONS.map(({ label, sub, bg, text, sub_text }) => (
                    <div key={label} className={`${bg} rounded-xl py-2 text-center`}>
                      <p className={`text-xs font-semibold ${text}`}>{label}</p>
                      <p className={`text-xs ${sub_text}`}>{sub}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* ── Stats bar ──────────────────────────────────────────────────────── */}
        <div className="mt-20 grid grid-cols-2 gap-4 border-t border-gray-100 pt-10 sm:grid-cols-4">
          {[
            { value: '3',       label: 'Study modes'        },
            { value: '100%',    label: 'Free to start'      },
            { value: 'Offline', label: 'Works without Wi-Fi' },
            { value: 'SM-2',    label: 'Proven algorithm'   },
          ].map(({ value, label }) => (
            <div key={label} className="text-center">
              <p className="text-2xl font-extrabold text-indigo-600">{value}</p>
              <p className="mt-0.5 text-sm text-gray-500">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
