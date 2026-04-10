import Link from 'next/link';
import { ArrowRight, PlayCircle } from 'lucide-react';

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-white pt-32 pb-20">
      {/* Soft background blobs */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full bg-indigo-100 opacity-40 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-violet-100 opacity-40 blur-3xl"
      />

      <div className="relative mx-auto max-w-4xl px-6 text-center">
        {/* Pill badge */}
        <span className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
          🎓 Built for students &amp; lifelong learners
        </span>

        {/* Headline */}
        <h1 className="text-5xl font-extrabold leading-tight tracking-tight text-gray-900 sm:text-6xl md:text-7xl">
          Study{' '}
          <span className="gradient-text">Smarter</span>,<br />
          Not Harder
        </h1>

        {/* Subheadline */}
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-gray-500 sm:text-xl">
          Create beautiful flashcards, organize your knowledge into decks, and
          master any subject with intelligent spaced repetition — all in one
          place.
        </p>

        {/* CTAs */}
        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-7 py-3.5 text-base font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 active:scale-95"
          >
            Get Started Free
            <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href="#features"
            className="inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-base font-semibold text-gray-600 transition hover:text-indigo-600"
          >
            <PlayCircle className="h-5 w-5" />
            See how it works
          </a>
        </div>

        {/* Social proof */}
        <p className="mt-10 text-sm text-gray-400">
          Free forever · No credit card required · Works on all devices
        </p>
      </div>

      {/* Decorative card preview */}
      <div className="mx-auto mt-20 max-w-3xl px-6">
        <div className="relative rounded-2xl border border-gray-100 bg-white p-1 shadow-2xl shadow-gray-200/60">
          <div className="flex gap-2 rounded-xl bg-gray-50 px-4 py-3">
            <span className="h-3 w-3 rounded-full bg-red-400" />
            <span className="h-3 w-3 rounded-full bg-yellow-400" />
            <span className="h-3 w-3 rounded-full bg-green-400" />
          </div>
          <div className="grid gap-4 p-6 sm:grid-cols-3">
            {[
              { q: 'What is photosynthesis?', deck: 'Biology',  progress: '75%' },
              { q: "Describe Newton's 1st Law",  deck: 'Physics',  progress: '50%' },
              { q: 'Translate: "Bonjour"',       deck: 'French',   progress: '90%' },
            ].map((card) => (
              <div
                key={card.q}
                className="flex flex-col justify-between rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
              >
                <span className="mb-3 inline-block rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-600">
                  {card.deck}
                </span>
                <p className="text-sm font-medium text-gray-800">{card.q}</p>
                <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                  <div className="h-full rounded-full bg-indigo-500" style={{ width: card.progress }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
