'use client';

import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import FlashLogoMark from './FlashLogoMark';
import InstallPWAButton from './InstallPWAButton';
import LocaleSwitcher from './LocaleSwitcher';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const t = useTranslations('common.nav');

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-gray-100/80 bg-white/75 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 font-bold text-gray-900">
          <FlashLogoMark size={30} />
          <span className="text-lg tracking-tight">
            Flashcard<span className="text-violet-600">AI</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-1 md:flex">
          <a
            href="#how-it-works"
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
          >
            {t('howItWorks')}
          </a>
          <a
            href="#features"
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
          >
            {t('features')}
          </a>
          <a
            href="#subjects"
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
          >
            {t('subjects')}
          </a>
          <Link
            href="/blog"
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
          >
            {t('blog')}
          </Link>
          <InstallPWAButton />
          <LocaleSwitcher />
          <div className="mx-2 h-5 w-px bg-gray-200" />
          <Link
            href="/login"
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
          >
            {t('login')}
          </Link>
          <Link
            href="/signup"
            className="ms-1 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-700 active:scale-95"
          >
            {t('getStarted')}
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 md:hidden"
          onClick={() => setOpen(!open)}
          aria-label={t('toggleMenu')}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-gray-100 bg-white/95 backdrop-blur-xl px-6 pb-5 md:hidden">
          <div className="flex flex-col gap-1 pt-3">
            <a href="#how-it-works" onClick={() => setOpen(false)} className="rounded-lg px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100">{t('howItWorks')}</a>
            <a href="#features"     onClick={() => setOpen(false)} className="rounded-lg px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100">{t('features')}</a>
            <a href="#subjects"     onClick={() => setOpen(false)} className="rounded-lg px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100">{t('subjects')}</a>
            <Link href="/blog"      onClick={() => setOpen(false)} className="rounded-lg px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100">{t('blog')}</Link>
            <div className="my-1 h-px bg-gray-100" />
            <Link href="/login"  onClick={() => setOpen(false)} className="rounded-lg px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100">{t('login')}</Link>
            <Link href="/signup" onClick={() => setOpen(false)} className="rounded-xl bg-indigo-600 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-indigo-700">{t('getStarted')}</Link>
          </div>
        </div>
      )}
    </header>
  );
}
