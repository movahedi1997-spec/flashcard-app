'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Download } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPWAButton() {
  const t = useTranslations('common');
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSHint, setShowIOSHint] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Already installed as PWA
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true);
      return;
    }

    // iOS detection
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    setIsIOS(ios);

    // Chrome/Android install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (installed) return null;

  async function handleClick() {
    if (isIOS) {
      setShowIOSHint((v) => !v);
      return;
    }
    if (!prompt) return;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') setInstalled(true);
    setPrompt(null);
  }

  // Only show if there's something to do
  if (!prompt && !isIOS) return null;

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100 hover:text-indigo-600"
        title={t('pwa.installApp')}
      >
        <Download className="h-4 w-4" />
        <span className="hidden sm:inline">{t('pwa.install')}</span>
      </button>

      {/* iOS tip popover */}
      {showIOSHint && (
        <div className="absolute end-0 top-full mt-2 w-64 rounded-2xl border border-gray-100 bg-white p-4 shadow-xl z-50 text-sm text-gray-600">
          <p className="font-semibold text-gray-900 mb-1">{t('pwa.installOnIPhone')}</p>
          <p>{t('pwa.iosInstallHint')}</p>
          <button
            onClick={() => setShowIOSHint(false)}
            className="mt-3 text-xs text-gray-400 hover:text-gray-600"
          >
            {t('pwa.gotIt')} ✕
          </button>
        </div>
      )}
    </div>
  );
}
