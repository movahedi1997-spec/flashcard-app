'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

/**
 * Offline fallback page — shown by the service worker when:
 *   • The user navigates to a page that hasn't been cached yet
 *   • The network is unavailable and no cache hit exists
 *
 * Study sessions for already-cached decks still work because the service
 * worker uses NetworkFirst + 7-day cache for /api/decks and /api/cards.
 */
export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline  = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online',  handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online',  handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-indigo-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-8">

        {/* Brand icon */}
        <div className="flex justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icons/icon-192x192.png"
            alt="FlashCard"
            width={96}
            height={96}
            className="rounded-2xl shadow-2xl shadow-indigo-500/30"
          />
        </div>

        {/* Status indicator */}
        <div className="flex items-center justify-center gap-2">
          <span
            className={`inline-block w-2.5 h-2.5 rounded-full transition-colors duration-500 ${
              isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'
            }`}
            aria-hidden="true"
          />
          <span className={`text-sm font-medium ${isOnline ? 'text-emerald-400' : 'text-red-400'}`}>
            {isOnline ? 'Back online!' : 'No internet connection'}
          </span>
        </div>

        {/* Heading */}
        <div className="space-y-3">
          <h1 className="text-3xl font-bold text-white tracking-tight">
            {isOnline ? "You're back online" : "You're offline"}
          </h1>
          <p className="text-indigo-200 leading-relaxed">
            {isOnline
              ? 'Your connection has been restored. Head back to your dashboard to continue studying.'
              : "No internet connection detected. If you've already loaded your decks, you can still study them — the FlashCard app works offline!"}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          {isOnline ? (
            <Link
              href="/dashboard"
              className="w-full py-3 px-6 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-indigo-950"
            >
              Go to Dashboard
            </Link>
          ) : (
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 px-6 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-indigo-950"
            >
              Try Again
            </button>
          )}

          <Link
            href="/dashboard"
            className="w-full py-3 px-6 rounded-xl border border-indigo-700 hover:border-indigo-500 text-indigo-200 hover:text-white font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-indigo-950"
          >
            Study Cached Decks
          </Link>
        </div>

        {/* Tip */}
        <p className="text-xs text-indigo-400 leading-relaxed">
          <strong className="text-indigo-300">Tip:</strong> Decks you've visited in the last 7&nbsp;days
          are cached and available offline. Your progress will sync when you reconnect.
        </p>
      </div>
    </div>
  );
}
