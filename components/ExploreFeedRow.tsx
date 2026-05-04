'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BadgeCheck, Copy, Check, Loader2 } from 'lucide-react';
import type { PublicDeck } from '@/types/api';
import { fetchWithRefresh } from '@/lib/fetchWithRefresh';
import { SUBJECT_LABELS } from '@/lib/subjects';
import { avatarColor, initials } from '@/lib/avatar';

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo}mo`;
  return `${Math.floor(mo / 12)}y`;
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  deck: PublicDeck;
  onCopied?: (deckId: string) => void;
}

export default function ExploreFeedRow({ deck, onCopied }: Props) {
  const router = useRouter();
  const [copying, setCopying]       = useState(false);
  const [justCopied, setJustCopied] = useState(false);
  const [error, setError]           = useState('');

  const isCopied = deck.alreadyCopied || justCopied;
  const handle   = deck.creatorUsername ?? deck.creatorName;
  const avatarBg = avatarColor(deck.creatorUsername ?? deck.creatorName);
  const subjectLabel = deck.subject ? (SUBJECT_LABELS[deck.subject] ?? deck.subject) : null;
  const ago      = timeAgo(deck.createdAt);

  async function handleCopy(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (isCopied || copying) return;
    setCopying(true);
    setError('');
    try {
      const res = await fetchWithRefresh(`/api/decks/${deck.id}/copy`, { method: 'POST' });
      if (res.status === 401) { window.location.href = `/signup?next=/explore`; return; }
      if (!res.ok) {
        const d = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(d.error ?? 'Copy failed.');
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

  const creatorHref = deck.creatorUsername ? `/creators/${deck.creatorUsername}` : null;

  function handleCardClick(e: React.MouseEvent) {
    // Let inner interactive elements handle their own clicks
    const target = e.target as HTMLElement;
    if (target.closest('button, a')) return;
    router.push(`/explore/${deck.slug}`);
  }

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={(e) => { if (e.key === 'Enter') router.push(`/explore/${deck.slug}`); }}
      className="flex gap-3 px-4 py-3.5 bg-white hover:bg-gray-50/60 transition-colors border-b border-gray-100 last:border-b-0 cursor-pointer"
    >
      {/* Left — avatar */}
      <div className="flex-shrink-0 pt-0.5">
        {creatorHref ? (
          <a
            href={creatorHref}
            aria-label={`View ${deck.creatorName}'s profile`}
            className="block"
          >
            <div className={`w-9 h-9 rounded-full ${avatarBg} flex items-center justify-center text-xs font-bold text-white select-none`}>
              {initials(deck.creatorName)}
            </div>
          </a>
        ) : (
          <div className={`w-9 h-9 rounded-full ${avatarBg} flex items-center justify-center text-xs font-bold text-white select-none`}>
            {initials(deck.creatorName)}
          </div>
        )}
      </div>

      {/* Right — content */}
      <div className="flex-1 min-w-0 flex flex-col gap-0.5">

        {/* Row 1: username + verified + time */}
        <div className="flex items-center gap-1 min-w-0">
          {creatorHref ? (
            <a
              href={creatorHref}
              className="text-xs font-semibold text-gray-800 hover:text-indigo-600 transition-colors truncate max-w-[140px]"
            >
              @{handle}
            </a>
          ) : (
            <span className="text-xs font-semibold text-gray-800 truncate max-w-[140px]">
              @{handle}
            </span>
          )}
          {deck.isVerifiedCreator && (
            <BadgeCheck className="h-3.5 w-3.5 text-indigo-500 flex-shrink-0" />
          )}
          <span className="text-xs text-gray-300 flex-shrink-0">·</span>
          <span className="text-xs text-gray-400 flex-shrink-0 ms-auto">{ago}</span>
        </div>

        {/* Row 2: emoji + title + quiz badge */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-base leading-none">{deck.emoji}</span>
          <span className="text-sm font-semibold text-gray-900 leading-snug">
            {deck.title}
          </span>
          {deck.deckType === 'quiz' && (
            <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full flex-shrink-0">
              Quiz
            </span>
          )}
        </div>

        {/* Row 3: description */}
        {deck.description && (
          <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
            {deck.description}
          </p>
        )}

        {/* Row 4: meta + copy button */}
        <div className="flex items-center gap-2 mt-1">
          <div className="flex items-center gap-1.5 text-xs text-gray-400 flex-1 min-w-0 flex-wrap">
            <span>{deck.cardCount} {deck.deckType === 'quiz' ? 'questions' : 'cards'}</span>
            {subjectLabel && (
              <>
                <span className="text-gray-200">·</span>
                <span>{subjectLabel}</span>
              </>
            )}
            {(deck.copyCount ?? 0) > 0 && (
              <>
                <span className="text-gray-200">·</span>
                <span>{deck.copyCount} copies</span>
              </>
            )}
          </div>

          <button
            onClick={handleCopy}
            disabled={isCopied || copying}
            aria-label={isCopied ? 'Already in library' : 'Copy to library'}
            className={`flex-shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition active:scale-95 ${
              isCopied
                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 cursor-default'
                : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
            } disabled:opacity-60`}
          >
            {copying ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : isCopied ? (
              <Check className="h-3 w-3" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
            {isCopied ? 'Saved' : 'Copy'}
          </button>
        </div>

        {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
      </div>
    </div>
  );
}
