import { ArrowRight, Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

export default function CTABanner() {
  const t = useTranslations('home.cta');

  return (
    <section className="bg-gray-50 py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 px-8 py-20 text-center shadow-2xl shadow-indigo-300/40">
          {/* Decorative blobs */}
          <div aria-hidden className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
          <div aria-hidden className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-violet-400/20 blur-3xl" />

          {/* Floating 3D cards decoration */}
          <div aria-hidden className="pointer-events-none absolute left-8 top-8 hidden lg:block">
            <div
              className="h-28 w-44 rounded-2xl border border-white/20 bg-white/10 backdrop-blur-sm"
              style={{ transform: 'perspective(500px) rotateY(18deg) rotateX(-8deg)' }}
            />
          </div>
          <div aria-hidden className="pointer-events-none absolute right-8 bottom-8 hidden lg:block">
            <div
              className="h-24 w-40 rounded-2xl border border-white/20 bg-white/10 backdrop-blur-sm"
              style={{ transform: 'perspective(500px) rotateY(-18deg) rotateX(8deg)' }}
            />
          </div>

          {/* Content */}
          <div className="relative">
            <span className="mb-5 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3.5 py-1.5 text-xs font-semibold text-white">
              <Sparkles className="h-3.5 w-3.5" />
              {t('badge')}
            </span>

            <h2 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
              {t('heading')}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-indigo-200 leading-relaxed">
              {t('subtext')}
            </p>

            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-base font-semibold text-indigo-700 shadow-lg transition hover:bg-indigo-50 active:scale-95"
              >
                {t('ctaStart')}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-xl border border-white/30 px-8 py-3.5 text-base font-semibold text-white transition hover:bg-white/10"
              >
                {t('ctaLogin')}
              </Link>
            </div>

            {/* Mini trust row */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-sm text-indigo-200">
              {([t('trust1'), t('trust2'), t('trust3'), t('trust4')] as string[]).map((item) => (
                <span key={item} className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-300" />
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
