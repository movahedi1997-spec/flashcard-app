import { Brain, Layers, Zap } from 'lucide-react';

const features = [
  {
    icon: Brain,
    color: 'bg-indigo-50 text-indigo-600',
    title: 'Smart Repetition',
    description:
      'Our spaced-repetition algorithm surfaces the cards you need most at exactly the right moment, so nothing slips through the cracks.',
  },
  {
    icon: Layers,
    color: 'bg-violet-50 text-violet-600',
    title: 'Organize Everything',
    description:
      'Group cards into decks by subject, chapter, or topic. Nest decks, tag them, and keep your study materials beautifully tidy.',
  },
  {
    icon: Zap,
    color: 'bg-amber-50 text-amber-600',
    title: 'Multiple Study Modes',
    description:
      'Flip classic flashcards, challenge yourself with type-in answers, or take a quick quiz — study the way that clicks for you.',
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
            <span className="gradient-text">ace your studies</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-gray-500">
            Designed with students in mind — simple enough to start in seconds,
            powerful enough to carry you through finals.
          </p>
        </div>

        {/* Cards */}
        <div className="grid gap-8 sm:grid-cols-3">
          {features.map(({ icon: Icon, color, title, description }) => (
            <div
              key={title}
              className="group rounded-2xl border border-gray-100 bg-white p-8 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <div
                className={`mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl ${color}`}
              >
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="mb-3 text-lg font-bold text-gray-900">{title}</h3>
              <p className="leading-relaxed text-gray-500">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
