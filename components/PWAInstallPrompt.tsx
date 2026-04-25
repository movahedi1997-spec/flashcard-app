'use client';

/**
 * PWAInstallPrompt — Add-to-Home-Screen (A2HS) install banner.
 *
 * Strategy:
 *  • Chrome/Edge/Samsung (Android): listen for `beforeinstallprompt`, capture it,
 *    show a custom bottom sheet, trigger native prompt on "Install".
 *  • Safari iOS: detect via UA + not in standalone, show a manual instructions
 *    sheet (Safari doesn't fire `beforeinstallprompt`).
 *  • Desktop Chrome/Edge: same `beforeinstallprompt` path as Android.
 *  • Already installed (standalone mode): never show.
 *
 * Dismissal:
 *  • Stored in localStorage with a 30-day cool-down so we don't pester.
 *  • After successful install the prompt is permanently suppressed for that device.
 */

import { useEffect, useRef, useState } from 'react';
import { X, Share, PlusSquare, Smartphone } from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────────

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<void>;
}

type PromptVariant = 'android' | 'ios' | null;

// ── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY   = 'pwa_install_dismissed_until';
const COOLDOWN_DAYS = 30;
const COOLDOWN_MS   = COOLDOWN_DAYS * 24 * 60 * 60 * 1000;

// ── Helpers ──────────────────────────────────────────────────────────────────

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // @ts-ignore — iOS Safari proprietary
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isDismissed(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    return Date.now() < parseInt(raw, 10);
  } catch {
    return false;
  }
}

function saveDismissal(): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(Date.now() + COOLDOWN_MS));
  } catch { /* localStorage blocked */ }
}

function saveInstalled(): void {
  try {
    // Set cool-down to 10 years — effectively permanent on this device
    localStorage.setItem(STORAGE_KEY, String(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000));
  } catch { /* localStorage blocked */ }
}

// ── Component ────────────────────────────────────────────────────────────────

export default function PWAInstallPrompt() {
  const [variant, setVariant]   = useState<PromptVariant>(null);
  const [visible, setVisible]   = useState(false);
  const [installing, setInstalling] = useState(false);
  const deferredRef = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Already installed or previously dismissed → do nothing
    if (isStandalone() || isDismissed()) return;

    // ── Chrome/Edge/Samsung Android (and desktop Chrome/Edge) ───────────────
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      deferredRef.current = e as BeforeInstallPromptEvent;
      setVariant('android');
      // Slight delay so the page isn't slammed with UI on first load
      setTimeout(() => setVisible(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // ── Safari iOS ───────────────────────────────────────────────────────────
    if (isIOS()) {
      setVariant('ios');
      setTimeout(() => setVisible(true), 3000);
    }

    // ── App installed (fires after native install) ────────────────────────
    const handleAppInstalled = () => {
      saveInstalled();
      setVisible(false);
    };
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // ── Handlers ──────────────────────────────────────────────────────────────

  async function handleInstall() {
    if (!deferredRef.current) return;
    setInstalling(true);
    try {
      await deferredRef.current.prompt();
      const { outcome } = await deferredRef.current.userChoice;
      if (outcome === 'accepted') {
        saveInstalled();
      } else {
        saveDismissal();
      }
    } catch (err) {
      console.warn('[PWA] Install prompt error:', err);
    } finally {
      setInstalling(false);
      setVisible(false);
      deferredRef.current = null;
    }
  }

  function handleDismiss() {
    saveDismissal();
    setVisible(false);
  }

  if (!visible || !variant) return null;

  // ── iOS Manual Instructions Sheet ─────────────────────────────────────────
  if (variant === 'ios') {
    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Install FlashCard on your iPhone"
        className="fixed bottom-0 inset-x-0 z-50 px-4 pb-safe-bottom animate-slide-up"
      >
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm"
          onClick={handleDismiss}
          aria-hidden="true"
        />

        {/* Sheet */}
        <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 max-w-sm mx-auto mb-4">
          {/* Close */}
          <button
            onClick={handleDismiss}
            className="absolute top-4 end-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            aria-label="Dismiss install prompt"
          >
            <X size={20} aria-hidden="true" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/icons/icon-96x96.png"
              alt=""
              width={48}
              height={48}
              className="rounded-xl flex-shrink-0"
            />
            <div>
              <p className="font-bold text-gray-900 dark:text-white">Install FlashCard</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Study offline, anytime</p>
            </div>
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-300 mb-5">
            Add FlashCard to your Home Screen for the full app experience — works offline too!
          </p>

          {/* Steps */}
          <ol className="space-y-3 text-sm text-gray-700 dark:text-gray-200">
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-300 font-bold text-xs">
                1
              </span>
              <span>
                Tap the{' '}
                <Share size={14} className="inline-block align-middle text-indigo-500" aria-hidden="true" />{' '}
                <strong>Share</strong> button in Safari's toolbar
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-300 font-bold text-xs">
                2
              </span>
              <span>
                Scroll down and tap{' '}
                <PlusSquare size={14} className="inline-block align-middle text-indigo-500" aria-hidden="true" />{' '}
                <strong>Add to Home Screen</strong>
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-300 font-bold text-xs">
                3
              </span>
              <span>Tap <strong>Add</strong> — and you're done!</span>
            </li>
          </ol>

          <button
            onClick={handleDismiss}
            className="mt-5 w-full py-2.5 rounded-xl text-sm font-medium text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 transition-colors"
          >
            Maybe later
          </button>
        </div>
      </div>
    );
  }

  // ── Android / Desktop Prompt Banner ───────────────────────────────────────
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Install FlashCard app"
      className="fixed bottom-0 inset-x-0 z-50 px-4 pb-safe-bottom animate-slide-up"
    >
      {/* Backdrop (mobile only) */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm sm:hidden"
        onClick={handleDismiss}
        aria-hidden="true"
      />

      {/* Banner */}
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl px-5 py-4 max-w-sm mx-auto mb-4 border border-gray-100 dark:border-gray-800">
        {/* Close */}
        <button
          onClick={handleDismiss}
          className="absolute top-3 end-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          aria-label="Dismiss install prompt"
        >
          <X size={18} aria-hidden="true" />
        </button>

        {/* Content */}
        <div className="flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icons/icon-96x96.png"
            alt=""
            width={52}
            height={52}
            className="rounded-xl flex-shrink-0"
          />
          <div className="flex-1 min-w-0 pe-4">
            <p className="font-bold text-gray-900 dark:text-white text-sm leading-snug">
              Install FlashCard
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              <Smartphone size={11} className="inline-block me-1 align-middle" aria-hidden="true" />
              Study offline · No app store needed
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={handleInstall}
            disabled={installing}
            className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
          >
            {installing ? 'Installing…' : 'Install'}
          </button>
          <button
            onClick={handleDismiss}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
