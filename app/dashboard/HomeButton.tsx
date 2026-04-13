'use client';

/**
 * app/dashboard/HomeButton.tsx
 *
 * Logs the user out then redirects to the marketing home page.
 * Used as the logo link in the dashboard header so hitting the
 * logo always returns to the public site with a clean session.
 */

import { useRouter } from 'next/navigation';
import FlashLogoMark from '@/components/FlashLogoMark';

export default function HomeButton() {
  const router = useRouter();

  async function handleClick() {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    router.push('/');
    router.refresh();
  }

  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-2.5 font-bold text-gray-900 hover:opacity-75 transition-opacity cursor-pointer"
    >
      <FlashLogoMark size={26} />
      <span>
        Flash<span className="text-indigo-600">Card</span>
      </span>
    </button>
  );
}
