import { PlusSquare, BookOpen, TrendingUp } from 'lucide-react';

const STEPS = [
  {
    num: '01',
    icon: PlusSquare,
    iconBg: 'bg-indigo-600',
    title: 'Create your deck',
    description:
      'Add cards manually with a question and answer. Group them into decks by subject, chapter, or exam block. Import from JSON or let AI generate them from your PDF (coming soon).',
    card: {
      label: 'New card',
      front: 'What is the half-life of Digoxin?',
      back:  '36–48 hours — renally excreted.',
    },
  },
  {
    num: '02',
    icon: BookOpen,
    iconBg: 'bg-violet-600',
    title: 'Study daily or cram with Turbo',
    description:
      'Daily Review shows only the cards due today — no more, no less. When exams are close, switch to Turbo Mode to flip through every card in random order.',
    card: {
      label: 'Daily Review',
      front: 'Define: Afterload',
      back:  'Resistance the heart must overcome to eject blood (↑ with hypertension).',
    },
  },
  {
    num: '03',
    icon: TrendingUp,
    iconBg: 'bg-emerald-600',
    title: 'Retain more, study less',
    description:
      'After every session, the app adjusts your schedule. Cards you know well are pushed further out. Weak cards come back sooner. Over time your retention grows — automatically.',
    card: {
      label: 'Progress',
      front: 'Day Streak: 14 🔥',
      back:  'Retention this week: 89%',
    },
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-white py-24">
      <div className="mx-auto max-w-6xl px-6">
        {/* Heading */}
        <div className="mb-16 text-center">
          <span className="mb-3 inline-block rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">
            How it works
          </span>
          <h2 className="text-4xl font-extrabold tracking-tight text-gray-900">
            From zero to{' '}
            <span className="gradient-text">exam-ready</span>
            {' '}in three steps
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-gray-500">
            No complicated setup. Start studying in under a minute.
          </p>
        </div>

        {/* Steps */}
        <div className="relative grid gap-8 lg:grid-cols-3">
          {/* Connector line — desktop only */}
          <div
            aria-hidden
            className="absolute top-16 left-[calc(33%+2rem)] right-[calc(33%+2rem)] hidden h-px bg-gradient-to-r from-indigo-200 via-violet-200 to-emerald-200 lg:block"
          />

          {STEPS.map(({ num, icon: Icon, iconBg, title, description, card }) => (
            <div key={num} className="flex flex-col items-center text-center lg:items-start lg:text-left">
              {/* Step number + icon */}
              <div className="relative mb-6">
                <span className="absolute -top-3 -left-3 text-6xl font-black text-gray-100 select-none leading-none z-0">
                  {num}
                </span>
                <div className={`relative z-10 flex h-12 w-12 items-center justify-center rounded-2xl ${iconBg} text-white shadow-lg`}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>

              <h3 className="mb-2 text-xl font-bold text-gray-900">{title}</h3>
              <p className="text-sm leading-relaxed text-gray-500 mb-6">{description}</p>

              {/* Mini 3D card illustration */}
              <div
                className="w-full max-w-xs rounded-2xl border border-gray-100 bg-white shadow-xl shadow-gray-200/60 overflow-hidden"
                style={{ transform: 'perspective(600px) rotateX(4deg) rotateY(-4deg)' }}
              >
                <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-400">{card.label}</span>
                  <div className="flex gap-1">
                    <span className="h-2 w-2 rounded-full bg-gray-200" />
                    <span className="h-2 w-2 rounded-full bg-gray-200" />
                    <span className="h-2 w-2 rounded-full bg-gray-200" />
                  </div>
                </div>
                <div className="px-4 pt-3 pb-2">
                  <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">Front</p>
                  <p className="text-sm font-semibold text-gray-800">{card.front}</p>
                </div>
                <div className="mx-4 mb-4 rounded-xl bg-indigo-50 px-3 py-2.5">
                  <p className="text-xs font-semibold uppercase tracking-widest text-indigo-400 mb-1">Back</p>
                  <p className="text-xs text-indigo-700">{card.back}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
