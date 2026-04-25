'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { Globe } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { routing, type Locale } from '@/i18n/routing';

const LOCALE_LABELS: Record<Locale, { label: string; flag: string }> = {
  en: { label: 'English', flag: '🇬🇧' },
  de: { label: 'Deutsch', flag: '🇩🇪' },
  fr: { label: 'Français', flag: '🇫🇷' },
  es: { label: 'Español', flag: '🇪🇸' },
  fa: { label: 'فارسی', flag: '🇮🇷' },
};

export default function LocaleSwitcher() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function switchLocale(next: Locale) {
    setOpen(false);
    if (next === locale) return;

    // Strip the current locale prefix from the pathname (if present)
    const localePattern = new RegExp(`^/(${routing.locales.join('|')})(/?)`);
    const stripped = pathname.replace(localePattern, '/');

    // Build the new path with the new locale prefix (skip prefix for default locale)
    const newPath = next === routing.defaultLocale ? stripped : `/${next}${stripped}`;
    router.push(newPath);
  }

  const current = LOCALE_LABELS[locale];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
        aria-label="Switch language"
        aria-expanded={open}
      >
        <Globe className="h-4 w-4" />
        <span>{current.flag}</span>
      </button>

      {open && (
        <div className="absolute end-0 top-full mt-1 w-40 rounded-xl border border-gray-100 bg-white py-1 shadow-lg z-50">
          {routing.locales.map((loc) => {
            const { label, flag } = LOCALE_LABELS[loc];
            return (
              <button
                key={loc}
                onClick={() => switchLocale(loc)}
                className={`flex w-full items-center gap-2.5 px-3 py-2 text-sm transition hover:bg-gray-50 ${
                  loc === locale ? 'font-semibold text-indigo-600' : 'text-gray-700'
                }`}
              >
                <span>{flag}</span>
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
