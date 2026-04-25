'use client';

import Link from 'next/link';
import FlashLogoMark from './FlashLogoMark';
import { useTranslations } from 'next-intl';

export default function Footer() {
  const t = useTranslations('common.footer');
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-gray-100 bg-white py-14">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">

          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2.5 font-bold text-gray-900">
              <FlashLogoMark size={26} />
              <span className="text-lg tracking-tight">
                Flashcard<span className="text-violet-600">AI</span>
              </span>
            </Link>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-gray-400">
              {t('tagline')}
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-500">
                {t('madeIn')}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-500">
                {t('gdpr')}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-500">
                {t('free')}
              </span>
            </div>

            <p className="mt-5 text-xs text-gray-300">
              {t('copyright', { year })}
            </p>
          </div>

          {/* Product links */}
          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-gray-400">{t('product')}</p>
            <nav className="flex flex-col gap-2.5 text-sm text-gray-500">
              <a href="#how-it-works" className="transition hover:text-indigo-600">{t('howItWorks')}</a>
              <a href="#features"     className="transition hover:text-indigo-600">{t('features')}</a>
              <a href="#subjects"     className="transition hover:text-indigo-600">{t('subjects')}</a>
              <Link href="/explore"   className="transition hover:text-indigo-600">{t('exploreDecks')}</Link>
              <Link href="/blog"      className="transition hover:text-indigo-600">{t('blog')}</Link>
              <Link href="/signup"    className="transition hover:text-indigo-600">{t('getStartedFree')}</Link>
            </nav>
          </div>

          {/* Account */}
          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-gray-400">{t('account')}</p>
            <nav className="flex flex-col gap-2.5 text-sm text-gray-500">
              <Link href="/login"     className="transition hover:text-indigo-600">{t('loginLink')}</Link>
              <Link href="/signup"    className="transition hover:text-indigo-600">{t('signupLink')}</Link>
              <Link href="/dashboard" className="transition hover:text-indigo-600">{t('dashboard')}</Link>
              <Link href="/settings"  className="transition hover:text-indigo-600">{t('settingsLink')}</Link>
            </nav>
          </div>
        </div>

        {/* Legal bar */}
        <div className="mt-10 border-t border-gray-100 pt-6 flex flex-wrap items-center justify-between gap-4">
          <p className="text-xs text-gray-300">{t('copyrightFull', { year })}</p>
          <nav className="flex flex-wrap gap-4 text-xs text-gray-400">
            <Link href="/privacy"   className="transition hover:text-indigo-600">{t('privacy')}</Link>
            <Link href="/terms"     className="transition hover:text-indigo-600">{t('terms')}</Link>
            <Link href="/cookies"   className="transition hover:text-indigo-600">{t('cookies')}</Link>
            <Link href="/impressum" className="transition hover:text-indigo-600">{t('impressum')}</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
