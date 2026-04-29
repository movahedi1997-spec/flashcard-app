import { MetadataRoute } from 'next';
import { routing } from '@/i18n/routing';
import { localeUrl } from '@/lib/hreflang';

// Static public pages with their SEO priorities
const PUBLIC_PAGES: Array<{
  path: string;
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'];
}> = [
  { path: '/',           priority: 1.0, changeFrequency: 'weekly'  },
  { path: '/explore',    priority: 0.9, changeFrequency: 'daily'   },
  { path: '/pricing',    priority: 0.8, changeFrequency: 'weekly'  },
  { path: '/blog',       priority: 0.7, changeFrequency: 'weekly'  },
  { path: '/signup',     priority: 0.6, changeFrequency: 'monthly' },
  { path: '/login',      priority: 0.5, changeFrequency: 'monthly' },
  { path: '/privacy',    priority: 0.3, changeFrequency: 'monthly' },
  { path: '/terms',      priority: 0.3, changeFrequency: 'monthly' },
  { path: '/cookies',    priority: 0.3, changeFrequency: 'monthly' },
  { path: '/impressum',  priority: 0.3, changeFrequency: 'yearly'  },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return PUBLIC_PAGES.map(({ path, priority, changeFrequency }) => {
    // Build hreflang alternates for every supported locale
    const languages: Record<string, string> = {};
    for (const locale of routing.locales) {
      languages[locale] = localeUrl(locale, path);
    }
    // x-default → English (no prefix), canonical for Google
    languages['x-default'] = localeUrl(routing.defaultLocale, path);

    return {
      url: localeUrl(routing.defaultLocale, path), // canonical = English URL
      lastModified: now,
      changeFrequency,
      priority,
      alternates: { languages },
    };
  });
}
