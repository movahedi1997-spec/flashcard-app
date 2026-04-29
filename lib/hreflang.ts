import { routing } from '@/i18n/routing';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://flashcard.app';

/**
 * Returns the absolute URL for a given locale + path, respecting localePrefix: 'as-needed'
 * (English = no prefix, all other locales get /{locale} prefix).
 */
export function localeUrl(locale: string, path: string): string {
  const prefix = locale === routing.defaultLocale ? '' : `/${locale}`;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const resolved = `${prefix}${normalizedPath === '/' ? '' : normalizedPath}`;
  return `${BASE_URL}${resolved || '/'}`;
}

/**
 * Builds the `alternates.languages` object for Next.js generateMetadata.
 * Includes all supported locales + x-default (→ English / no prefix).
 *
 * Usage in a page:
 *   export async function generateMetadata({ params }) {
 *     return { alternates: hreflangAlternates(params.locale, '/pricing') };
 *   }
 */
export function hreflangAlternates(
  _currentLocale: string,
  path: string,
): { canonical: string; languages: Record<string, string> } {
  const languages: Record<string, string> = {};

  for (const locale of routing.locales) {
    languages[locale] = localeUrl(locale, path);
  }
  languages['x-default'] = localeUrl(routing.defaultLocale, path);

  return {
    canonical: localeUrl(routing.defaultLocale, path),
    languages,
  };
}
