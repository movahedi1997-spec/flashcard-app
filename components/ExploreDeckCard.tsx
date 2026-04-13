'use client';

/**
 * ExploreDeckCard — one card in the public Explore feed.
 *
 * Shows deck metadata, creator, card count, and a "Copy to Library" CTA.
 * Handles copy state locally (copying → copied / error).
 */

import { useState } from 'react';
import Link from 'next/link';
import { BookOpen, Copy, Check, Loader2, BadgeCheck } from 'lucide-react';
import type { PublicDeck } from '@/types/api';
import { fetchWithRefresh } from '@/lib/fetchWithRefresh';

// ── Palette (mirrors BoxCard) ─────────────────────────────────────────────────

const PALETTES: Record<string, { gradient: string; border: string; shadow: string }> = {
  indigo:  { gradient: 'from-indigo-600 to-violet-600',  border: 'border-indigo-100',  shadow: 'hover:shadow-indigo-200/60'  },
  emerald: { gradient: 'from-emerald-600 to-teal-600',   border: 'border-emerald-100', shadow: 'hover:shadow-emerald-200/60' },
  amber:   { gradient: 'from-amber-500 to-orange-500',   border: 'border-amber-100',   shadow: 'hover:shadow-amber-200/60'   },
  rose:    { gradient: 'from-rose-500 to-pink-600',      border: 'border-rose-100',    shadow: 'hover:shadow-rose-200/60'    },
  sky:     { gradient: 'from-sky-500 to-cyan-600',       border: 'border-sky-100',     shadow: 'hover:shadow-sky-200/60'     },
};
const DEFAULT_PALETTE = PALETTES.indigo;
function getPalette(color: string) { return PALETTES[color] ?? DEFAULT_PALETTE; }

interface Props {
  deck: PublicDeck;
  /** Callback so parent grid can update alreadyCopied state */
  onCopied?: (deckId: string) => void;
}

export default function ExploreDeckCard({ deck, onCopied }: Props) {
  const palette = getPalette(deck.color);
  const [copying, setCopying]     = useState(false);
  const [justCopied, setJustCopied] = useState(false);
  const [error, setError]         = useState('');

  async function handleCopy(e: React.MouseEvent) {
    e.preventDefault(); // don't navigate to slug page
    if (deck.alreadyCopied || copying) return;

    setCopying(true);
    setError('');

    try {
      const res = await fetchWithRefresh(`/api/decks/${deck.id}/copy`, { method: 'POST' });

      if (res.status === 401) {
        // Not logged in — send to signup
        window.location.href = `/signup?next=/explore`;
        return;
      }

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? 'Copy failed.');
      }

      setJustCopied(true);
      onCopied?.(deck.id);
      setTimeout(() => setJustCopied(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setTimeout(() => setError(''), 4000);
    } finally {
      setCopying(false);
    }
  }

  const isCopied = deck.alreadyCopied || justCopied;

  return (
    <Link
      href={`/explore/${deck.slug}`}
      className={`group relative flex flex-col rounded-3xl border ${palette.border} bg-white
        transition-all duration-200 hover:-translate-y-1 hover:shadow-xl ${palette.shadow} no-underline`}
    >
      {/* Gradient header */}
      <div className={`bg-gradient-to-br ${palette.gradient} rounded-t-3xl px-5 pt-5 pb-9`}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-white/60 text-[11px] font-semibold uppercase tracking-widest mb-1.5">
              {deck.cardCount} {deck.cardCount === 1 ? 'card' : 'cards'}
              {deck.copyCount != null && deck.copyCount > 0 && (
                <span className="ml-2 opacity-80">· {deck.copyCount} copies</span>
              )}
            </p>
            <h3 className="text-white font-extrabold text-lg leading-snug line-clamp-2">
              {deck.title}
            </h3>
          </div>
          <span className="text-2xl leading-none flex-shrink-0">{deck.emoji}</span>
        </div>
      </div>

      {/* White body */}
      <div className="px-5 pb-5 flex flex-col gap-3 flex-1">
        {/* Floating stub card */}
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm px-4 py-3 -mt-5 z-10 relative">
          <p className="text-xs text-slate-500 line-clamp-2 min-h-[2.5rem]">
            {deck.description || 'No description'}
          </p>
        </div>

        {/* Creator row */}
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <BookOpen className="h-3.5 w-3.5 flex-shrink-0" />
          <span className="truncate">by {deck.creatorName}</span>
          {deck.isVerifiedCreator && (
            <BadgeCheck className="h-3.5 w-3.5 text-indigo-500 flex-shrink-0" />
          )}
          {deck.subject && (
            <>
              <span className="mx-1 opacity-40">·</span>
              <span className="capitalize">{deck.subject}</span>
            </>
          )}
        </div>

        {/* Error toast */}
        {error && (
          <p className="text-xs text-red-500 font-medium">{error}</p>
        )}

        {/* Copy CTA */}
        <button
          onClick={handleCopy}
          disabled={isCopied || copying}
          className={`w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition
            ${isCopied
              ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 cursor-default'
              : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 shadow-sm shadow-indigo-200'
            }
            disabled:opacity-60`}
        >
          {copying ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Copying…</>
          ) : isCopied ? (
            <><Check className="h-4 w-4" /> {justCopied ? 'Copied to library!' : 'Already in library'}</>
          ) : (
            <><Copy className="h-4 w-4" /> Copy to Library</>
          )}
        </button>
      </div>
    </Link>
  );
}
