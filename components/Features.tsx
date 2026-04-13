import { Brain, Zap, CalendarClock, FlaskConical, WifiOff, BarChart3 } from 'lucide-react';

const FEATURES = [
  {
    icon: Brain,
    bg: 'bg-indigo-600',
    glow: 'shadow-indigo-200',
    title: 'Daily Review',
    description:
      'The SM-2 algorithm tracks every answer and calculates exactly when each card should come back. You only study what you need today — nothing more.',
    badge: 'Core',
  },
  {
    icon: Zap,
    bg: 'bg-amber-500',
    glow: 'shadow-amber-200',
    title: 'Turbo Mode',
    description:
      'Flip through every card in your deck in random order without recording any grades. Perfect for last-minute cramming before boards.',
    badge: 'Fast review',
  },
  {
    icon: CalendarClock,
    bg: 'bg-violet-600',
    glow: 'shadow-violet-200',
    title: 'Smart Scheduling',
    description:
      "Cards you answer with 'Easy' are pushed weeks out. Cards you struggle with come back tomorrow. Your schedule adapts in real time.",
    badge: 'SM-2 algorithm',
  },
  {
    icon: FlaskConical,
    bg: 'bg-emerald-600',
    glow: 'shadow-emerald-200',
    title: 'Domain-Specific',
    description:
      'Built for high-stakes exams — USMLE Steps 1–3, NAPLEX, MPJE, Organic Chemistry, and AP exams. Deck subjects match the material.',
    badge: 'Medicine · Pharmacy · Chem',
  },
  {
    icon: WifiOff,
    bg: 'bg-rose-500',
    glow: 'shadow-rose-200',
    title: 'Works Offline',
    description:
      'Install FlashCard as a PWA on your phone or tablet. Study sessions work without internet — ideal for commutes, libraries, or low-signal areas.',
    badge: 'PWA',
  },
  {
    icon: BarChart3,
    bg: 'bg-cyan-600',
    glow: 'shadow-cyan-200',
    title: 'Progress Tracking',
    description:
      'Session stats, retention percentage, day streak, and cards reviewed today — all on your dashboard so you always know how you are doing.',
    badge: 'Analytics',
  },
];

export default function Features() {
  return (
    <section id="features" className="bg-gray-50 py-24">
      <div className="mx-auto max-w-6xl px-6">
        {/* Heading */}
        <div className="mb-16 text-center">
          <span className="mb-3 inline-block rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
            Why FlashCard?
          </span>
          <h2 className="text-4xl font-extrabold tracking-tight text-gray-900">
            Everything you need to{' '}
            <span className="gradient-text">ace your exams</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-gray-500">
            Simple enough to start in seconds. Powerful enough to carry you through finals, boards, and beyond.
          </p>
        </div>

        {/* Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, bg, glow, title, description, badge }) => (
            <div
              key={title}
              className="group relative rounded-2xl border border-gray-100 bg-white p-7 shadow-sm transition duration-300 hover:-translate-y-1.5 hover:shadow-lg"
            >
              {/* 3D icon — flat on top, depth on bottom-right */}
              <div className="mb-5 inline-block">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl ${bg} text-white shadow-lg ${glow}`}
                  style={{
                    boxShadow: `0 6px 0 -1px color-mix(in srgb, currentColor 30%, transparent), 0 8px 16px -2px color-mix(in srgb, currentColor 20%, transparent)`,
                  }}
                >
                  <Icon className="h-6 w-6" />
                </div>
              </div>

              {/* Badge */}
              <span className="mb-3 inline-block rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500">
                {badge}
              </span>

              <h3 className="mb-2 text-lg font-bold text-gray-900">{title}</h3>
              <p className="text-sm leading-relaxed text-gray-500">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
