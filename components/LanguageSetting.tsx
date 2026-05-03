'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { routing, type Locale } from '@/i18n/routing';

const LOCALE_OPTIONS: { locale: Locale; label: string; flag: string; native: string }[] = [
  { locale: 'en', label: 'English',  flag: '🇬🇧', native: 'English'  },
  { locale: 'de', label: 'German',   flag: '🇩🇪', native: 'Deutsch'  },
  { locale: 'fr', label: 'French',   flag: '🇫🇷', native: 'Français' },
  { locale: 'es', label: 'Spanish',  flag: '🇪🇸', native: 'Español'  },
  { locale: 'fa', label: 'Persian',  flag: '🇮🇷', native: 'فارسی'    },
];

export default function LanguageSetting() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();

  function switchLocale(next: Locale) {
    if (next === locale) return;
    document.cookie = `NEXT_LOCALE=${next}; path=/; max-age=31536000; SameSite=Lax`;
    const localePattern = new RegExp(`^/(${routing.locales.join('|')})(/?)`);
    const stripped = pathname.replace(localePattern, '/');
    const newPath = next === routing.defaultLocale ? stripped : `/${next}${stripped}`;
    router.push(newPath);
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {LOCALE_OPTIONS.map(({ locale: loc, flag, native, label }) => (
        <button
          key={loc}
          onClick={() => switchLocale(loc)}
          className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm transition ${
            loc === locale
              ? 'border-indigo-200 bg-indigo-50 font-semibold text-indigo-700'
              : 'border-gray-100 bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          <span className="text-xl">{flag}</span>
          <span>{native}</span>
          {loc !== locale && (
            <span className="ms-auto text-xs text-gray-400">{label}</span>
          )}
          {loc === locale && (
            <span className="ms-auto text-xs font-medium text-indigo-500">✓</span>
          )}
        </button>
      ))}
    </div>
  );
}
