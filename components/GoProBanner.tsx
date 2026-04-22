'use client';

import Link from 'next/link';
import { Zap } from 'lucide-react';

interface Props {
  /** Pass false to show the banner, true to hide it. */
  isPro: boolean;
  /** Context label shown in the banner body */
  context?: string;
}

/**
 * Compact horizontal "Upgrade to Pro" CTA banner.
 * Hidden when isPro is true.
 */
export default function GoProBanner({ isPro, context }: Props) {
  if (isPro) return null;

  return (
    <div className="rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-4 flex items-center justify-between gap-4 shadow-md shadow-indigo-200/50">
      <div className="flex items-center gap-3 min-w-0">
        <div className="shrink-0 h-9 w-9 rounded-xl bg-white/20 flex items-center justify-center">
          <Zap className="h-4 w-4 text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-white">Upgrade to Pro</p>
          <p className="text-xs text-indigo-200 truncate">
            {context ?? '499 AI cards · Analytics · LaTeX · Premium colors'}
          </p>
        </div>
      </div>
      <Link
        href="/pricing"
        className="shrink-0 rounded-xl bg-white px-4 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-50 transition-colors"
      >
        Go Pro →
      </Link>
    </div>
  );
}
