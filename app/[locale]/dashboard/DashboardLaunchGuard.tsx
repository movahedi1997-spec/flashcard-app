'use client';

import { useEffect } from 'react';

/**
 * PWA cold-launch guard for the dashboard page.
 *
 * When the app is fully closed and reopened on mobile (iOS restores the last
 * visited URL instead of start_url), this redirects to My Decks so the user
 * always starts there — not on the dashboard.
 *
 * Detection logic:
 *   - display-mode: standalone  → running as an installed PWA (not a browser tab)
 *   - document.referrer === ''  → no previous page in this session = cold launch
 *
 * In-app navigation to /dashboard always has a referrer, so it is never affected.
 */
export default function DashboardLaunchGuard() {
  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      Boolean((navigator as Navigator & { standalone?: boolean }).standalone);

    if (!isStandalone) return; // browser tab — leave it alone

    const isColdLaunch = document.referrer === '';
    if (isColdLaunch) {
      window.location.replace('/flashcards');
    }
  }, []);

  return null;
}
