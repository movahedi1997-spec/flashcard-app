import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function CTABanner() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-600 px-8 py-16 text-center shadow-xl shadow-indigo-200">
          {/* Background decoration */}
          <div
            aria-hidden
            className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-white/10 blur-2xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-white/10 blur-2xl"
          />

          <span className="mb-4 inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white">
            🚀 Start for free today
          </span>
          <h2 className="relative text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            Ready to ace your next exam?
          </h2>
          <p className="relative mx-auto mt-4 max-w-xl text-lg text-indigo-100">
            Join thousands of students already studying smarter. Create your
            first deck in under a minute.
          </p>
          <div className="relative mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 text-base font-semibold text-indigo-700 shadow-lg transition hover:bg-indigo-50 active:scale-95"
            >
              Sign Up Free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl border border-white/30 px-7 py-3.5 text-base font-semibold text-white transition hover:bg-white/10"
            >
              Already have an account?
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
