const withPWA = require('@ducanh2912/next-pwa').default;

/**
 * next-pwa configuration.
 *
 * Caching strategy decisions:
 *  - /dashboard, /flashcards — StaleWhileRevalidate (study session flow, must work offline)
 *  - /api/decks, /api/cards — NetworkFirst with 7-day cache (keep data fresh, fallback offline)
 *  - Static assets (JS, CSS, fonts, icons) — CacheFirst (immutable hashes)
 *  - Google Fonts — CacheFirst (external, long TTL)
 *  - Images — CacheFirst (icons, card images)
 *
 * @see https://github.com/DuCanhGH/next-pwa
 */
const pwaConfig = {
  dest: 'public',
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  // Offline fallback page rendered by app/offline/page.tsx
  fallbacks: {
    document: '/offline',
  },
  disable: process.env.NODE_ENV === 'development',
  workboxOptions: {
    disableDevLogs: true,
    // ── Study session flow — cache-first for navigations ───────────────────
    runtimeCaching: [
      // Google Fonts stylesheets
      {
        urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'google-fonts-stylesheets',
          expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
      // Google Fonts webfonts
      {
        urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'google-fonts-webfonts',
          expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
      // App icons & static images
      {
        urlPattern: /\/icons\/.*\.png$/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'pwa-icons',
          expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
      // ── Study session API — NetworkFirst so data is always fresh ──────────
      // Falls back to cache when offline so user can review cached decks.
      {
        urlPattern: /^\/api\/(decks|cards|study).*/i,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'study-api-cache',
          networkTimeoutSeconds: 10,
          expiration: {
            maxEntries: 200,
            maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
          },
          cacheableResponse: { statuses: [0, 200] },
          matchOptions: { ignoreVary: true },
        },
      },
      // Auth endpoints — NetworkOnly (never cache credentials)
      {
        urlPattern: /^\/api\/auth\/.*/i,
        handler: 'NetworkOnly',
      },
      // ── Study & dashboard pages — StaleWhileRevalidate ───────────────────
      // Renders from cache instantly, revalidates in background.
      {
        urlPattern: /^\/(dashboard|flashcards).*/i,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'study-pages',
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 60 * 60 * 24, // 1 day
          },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
      // Next.js static chunks — CacheFirst (long-lived, content-hashed)
      {
        urlPattern: /\/_next\/static\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'next-static',
          expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 365 },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
      // Next.js image-optimisation endpoint
      {
        urlPattern: /\/_next\/image\?.*/i,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'next-images',
          expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
    ],
  },
};

/** @type {import('next').NextConfig} */
// No API rewrites needed — all /api/* routes are handled by Next.js App Router.
// The old Express backend rewrite was removed in TASK-008.
const nextConfig = {};

module.exports = withPWA(pwaConfig)(nextConfig);
