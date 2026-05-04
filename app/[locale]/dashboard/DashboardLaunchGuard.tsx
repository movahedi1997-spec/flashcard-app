'use client';

import { useEffect, useRef } from 'react';

/**
 * PWA cold-launch guard for the dashboard page.
 *
 * On mobile the BottomNav home button now points to /flashcards, so users
 * rarely end their session on /dashboard. But as a safety net: if iOS
 * resumes a fully-closed PWA at /dashboard, this component:
 *   1. Renders a white cover over the dashboard so nothing is visible.
 *   2. Immediately checks: standalone mode + no referrer = cold launch.
 *   3a. Cold launch  → redirect to /flashcards (cover stays, no flash).
 *   3b. In-app nav   → remove cover, show dashboard normally.
 *
 * In-app navigation always has a referrer, so the cover is removed in one
 * paint cycle and is imperceptible.
 */
export default function DashboardLaunchGuard() {
  const coverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      Boolean((navigator as Navigator & { standalone?: boolean }).standalone);

    if (isStandalone && document.referrer === '') {
      // Cold PWA launch — redirect before showing anything.
      window.location.replace('/flashcards');
      return; // leave cover in place while redirect happens
    }

    // Normal in-app navigation — remove the cover immediately.
    coverRef.current?.remove();
  }, []);

  return (
    <div
      ref={coverRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: '#f9fafb', // matches dashboard bg-gray-50
      }}
    />
  );
}
