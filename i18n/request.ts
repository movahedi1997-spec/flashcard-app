import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !(routing.locales as readonly string[]).includes(locale)) {
    locale = routing.defaultLocale;
  }

  const namespaces = ['common', 'auth', 'onboarding', 'dashboard', 'flashcards', 'study', 'explore', 'settings', 'pricing', 'errors'];
  const loaded = await Promise.all(
    namespaces.map((ns) => import(`../messages/${locale}/${ns}.json`).then((m) => m.default)),
  );

  const messages = Object.fromEntries(namespaces.map((ns, i) => [ns, loaded[i]]));

  return { locale, messages };
});
