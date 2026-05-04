import type { Metadata, Viewport } from 'next';
import { Inter, Vazirmatn } from 'next/font/google';
import './globals.css';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';
import CookieConsent from '@/components/CookieConsent';
import { headers } from 'next/headers';

const inter = Inter({ subsets: ['latin'], display: 'swap' });
const vazirmatn = Vazirmatn({ subsets: ['arabic'], display: 'swap', variable: '--font-vazirmatn' });

// ─── Viewport (must be exported separately in Next.js 14) ────────────────────
export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#6366f1' },
    { media: '(prefers-color-scheme: dark)',  color: '#4f46e5' },
  ],
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover', // respects iPhone notch / safe-areas
};

// ─── Metadata ────────────────────────────────────────────────────────────────
export const metadata: Metadata = {
  // ── Base URL (required for absolute OG/Twitter image resolution) ──────────
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? 'https://flashcard.app'
  ),

  // ── Core ──────────────────────────────────────────────────────────────────
  title: {
    default: 'FlashCard — Study Smarter',
    template: '%s | FlashCard',
  },
  description:
    'Create beautiful flashcards, organize your knowledge, and master any subject with intelligent spaced repetition.',
  applicationName: 'FlashCard',
  keywords: ['flashcards', 'spaced repetition', 'USMLE', 'NAPLEX', 'study', 'SRS'],
  authors: [{ name: 'FlashCard Team' }],
  creator: 'FlashCard',
  publisher: 'FlashCard',

  // ── PWA / App install ─────────────────────────────────────────────────────
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'FlashCard',
    startupImage: [
      // iPhone 14 Pro Max
      {
        url: '/icons/icon-512x512.png',
        media:
          '(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)',
      },
      // Generic fallback
      { url: '/icons/icon-512x512.png' },
    ],
  },
  formatDetection: { telephone: false },

  // ── Icons ─────────────────────────────────────────────────────────────────
  icons: {
    icon: [
      { url: '/icons/icon-96x96.png',   sizes: '96x96',   type: 'image/png' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { rel: 'mask-icon', url: '/favicon.svg', color: '#6366f1' },
    ],
  },

  // ── Open Graph ────────────────────────────────────────────────────────────
  openGraph: {
    type: 'website',
    siteName: 'FlashCard',
    title: 'FlashCard — Study Smarter',
    description:
      'Create beautiful flashcards, organize your knowledge, and master any subject with intelligent spaced repetition.',
    images: [{ url: '/icons/icon-512x512.png', width: 512, height: 512 }],
  },

  // ── Twitter / X ───────────────────────────────────────────────────────────
  twitter: {
    card: 'summary',
    title: 'FlashCard — Study Smarter',
    description:
      'Create beautiful flashcards and master any subject with spaced repetition.',
    images: ['/icons/icon-512x512.png'],
  },
};

// ─── Root layout ─────────────────────────────────────────────────────────────
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // next-intl middleware injects this header so we can set lang/dir here
  const locale = headers().get('x-next-intl-locale') ?? 'en';
  const isRtl = locale === 'fa';
  const bodyClass = isRtl
    ? `${vazirmatn.variable} font-vazirmatn`
    : inter.className;

  return (
    <html lang={locale} dir={isRtl ? 'rtl' : 'ltr'}>
      <head>
        {/* MS Tiles (Windows pinned sites) */}
        <meta name="msapplication-TileColor" content="#6366f1" />
        <meta name="msapplication-TileImage" content="/icons/icon-144x144.png" />
        <meta name="msapplication-config" content="none" />
        {/* Safari pinned tab */}
        <link rel="mask-icon" href="/favicon.svg" color="#6366f1" />
      </head>
      <body className={bodyClass}>
        {children}
        <PWAInstallPrompt />
        <CookieConsent />
      </body>
    </html>
  );
}
