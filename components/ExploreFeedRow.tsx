'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BadgeCheck, Copy, Check, Loader2, Heart, Share2 } from 'lucide-react';
import type { PublicDeck } from '@/types/api';
import { fetchWithRefresh } from '@/lib/fetchWithRefresh';
import { SUBJECT_LABELS } from '@/lib/subjects';
import { initials } from '@/lib/avatar';

// ── Palette mappings from deck.color ─────────────────────────────────────────

const DECK_GRADIENT: Record<string, string> = {
  indigo:  'from-indigo-600 to-violet-600',
  emerald: 'from-emerald-600 to-teal-600',
  amber:   'from-amber-500 to-orange-500',
  rose:    'from-rose-500 to-pink-600',
  sky:     'from-sky-500 to-cyan-600',
  violet:  'from-violet-600 to-purple-700',
  fuchsia: 'from-fuchsia-500 to-pink-600',
  teal:    'from-teal-500 to-cyan-600',
  gold:    'from-yellow-500 to-amber-600',
  slate:   'from-slate-700 to-slate-900',
};

const DECK_AVATAR_BG: Record<string, string> = {
  indigo:  'bg-indigo-500',
  emerald: 'bg-emerald-500',
  amber:   'bg-amber-500',
  rose:    'bg-rose-500',
  sky:     'bg-sky-500',
  violet:  'bg-violet-500',
  fuchsia: 'bg-fuchsia-500',
  teal:    'bg-teal-500',
  gold:    'bg-yellow-500',
  slate:   'bg-slate-600',
};

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
  isAuthenticated?: boolean | null;
  onAuthRequired?: () => void;
}

export default function ExploreFeedRow({ deck, onCopied, isAuthenticated, onAuthRequired }: Props) {
  const router = useRouter();
  const [copying, setCopying]       = useState(false);
  const [justCopied, setJustCopied] = useState(false);
  const [liked, setLiked]           = useState(deck.isLiked ?? false);
  const [justShared, setJustShared] = useState(false);
  const [error, setError]           = useState('');

  const isCopied = deck.alreadyCopied || justCopied;
  const handle   = deck.creatorUsername ?? deck.creatorName;
  const subjectLabel = deck.subject ? (SUBJECT_LABELS[deck.subject] ?? deck.subject) : null;
  const ago      = timeAgo(deck.createdAt);
  const gradient = DECK_GRADIENT[deck.color] ?? 'from-indigo-600 to-violet-600';
  const avatarBg = DECK_AVATAR_BG[deck.color] ?? 'bg-indigo-500';

  async function handleCopy(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (isCopied || copying) return;
    if (isAuthenticated === false) { onAuthRequired?.(); return; }
    setCopying(true);
    setError('');
    try {
      const res = await fetchWithRefresh(`/api/decks/${deck.id}/copy`, { method: 'POST' });
      if (res.status === 401) { onAuthRequired?.(); return; }
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

  function handleShare(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (isAuthenticated === false) { onAuthRequired?.(); return; }
    const url = `${window.location.origin}/explore/${deck.slug}`;
    if (navigator.share) {
      navigator.share({ title: deck.title, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url).then(() => {
        setJustShared(true);
        setTimeout(() => setJustShared(false), 1500);
      }).catch(() => {});
    }
  }

  const creatorHref = deck.creatorUsername ? `/creators/${deck.creatorUsername}` : null;

  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">

      {/* ── Creator header ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2.5 px-4 pt-3.5 pb-3">
        {/* Avatar — uses deck color; shows profile picture when available */}
        {creatorHref ? (
          <a href={creatorHref} className="flex-shrink-0" aria-label={`View ${deck.creatorName}'s profile`}>
            <div className={`w-8 h-8 rounded-full ${avatarBg} flex items-center justify-center text-xs font-bold text-white select-none overflow-hidden`}>
              {deck.creatorAvatarUrl
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={deck.creatorAvatarUrl} alt="" className="w-full h-full object-cover" />
                : initials(deck.creatorName)}
            </div>
          </a>
        ) : (
          <div className={`w-8 h-8 rounded-full ${avatarBg} flex items-center justify-center text-xs font-bold text-white select-none overflow-hidden flex-shrink-0`}>
            {deck.creatorAvatarUrl
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={deck.creatorAvatarUrl} alt="" className="w-full h-full object-cover" />
              : initials(deck.creatorName)}
          </div>
        )}

        <div className="flex-1 min-w-0 flex items-center gap-1">
          {creatorHref ? (
            <a href={creatorHref} className="text-sm font-semibold text-gray-800 hover:text-indigo-600 transition-colors truncate max-w-[160px]">
              @{handle}
            </a>
          ) : (
            <span className="text-sm font-semibold text-gray-800 truncate max-w-[160px]">@{handle}</span>
          )}
          {deck.isVerifiedCreator && (
            <BadgeCheck className="h-3.5 w-3.5 text-indigo-500 flex-shrink-0" />
          )}
        </div>

        <span className="text-xs text-gray-400 flex-shrink-0">{ago}</span>
      </div>

      {/* ── Deck card (clickable, navigates to deck page) ──────────────────── */}
      <div
        role="link"
        tabIndex={0}
        onClick={(e) => {
          if ((e.target as HTMLElement).closest('button, a')) return;
          router.push(`/explore/${deck.slug}`);
        }}
        onKeyDown={(e) => { if (e.key === 'Enter') router.push(`/explore/${deck.slug}`); }}
        className="mx-3 mb-3 rounded-2xl overflow-hidden border border-gray-100 cursor-pointer"
      >
        {/* Gradient header */}
        <div className={`bg-gradient-to-br ${gradient} px-4 pt-4 pb-8`}>
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              {deck.deckType === 'quiz' && (
                <span className="inline-block text-white/80 text-[10px] font-bold uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded-full mb-1.5">
                  Quiz
                </span>
              )}
              <h3 className="text-white font-bold text-base leading-snug line-clamp-2">
                {deck.title}
              </h3>
            </div>
            <span className="text-2xl leading-none flex-shrink-0 mt-0.5">{deck.emoji}</span>
          </div>
        </div>

        {/* White body — overlaps gradient slightly */}
        <div className="bg-white px-4 pb-4 -mt-5">
          <div className="rounded-xl border border-gray-100 bg-white shadow-sm px-3.5 py-3 mb-3">
            {deck.description ? (
              <p className="text-sm text-gray-600 line-clamp-4 leading-relaxed">{deck.description}</p>
            ) : (
              <p className="text-sm text-gray-400 italic leading-relaxed">No description</p>
            )}
          </div>

          {/* Meta row */}
          <div className="flex items-center gap-1.5 text-xs text-gray-400 flex-wrap">
            <span>{deck.cardCount} {deck.deckType === 'quiz' ? 'questions' : 'cards'}</span>
            {subjectLabel && (
              <>
                <span className="text-gray-200">·</span>
                <span className="truncate">{subjectLabel}</span>
              </>
            )}
            {(deck.copyCount ?? 0) > 0 && (
              <>
                <span className="text-gray-200">·</span>
                <span className="flex-shrink-0">{deck.copyCount} copies</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Twitter-style action row ────────────────────────────────────────── */}
      <div className="flex items-center px-4 pb-3.5 pt-1 border-t border-gray-50 gap-1">
        {deck.deckType !== 'quiz' && (
          <button
            onClick={handleCopy}
            disabled={isCopied || copying}
            aria-label={isCopied ? 'Already in library' : 'Copy to library'}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition active:scale-95 ${
              isCopied
                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 cursor-default'
                : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
            } disabled:opacity-60`}
          >
            {copying ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : isCopied ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
            {isCopied ? 'Saved' : 'Copy'}
          </button>
        )}

        <div className="flex items-center ms-auto gap-0.5">
          <button
            onClick={async (e) => {
              e.preventDefault(); e.stopPropagation();
              if (isAuthenticated === false) { onAuthRequired?.(); return; }
              setLiked((l) => !l);
              try {
                const res = await fetchWithRefresh('/api/explore/likes', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ deckId: deck.id }),
                });
                if (res.status === 401) { onAuthRequired?.(); return; }
                if (!res.ok) setLiked((l) => !l);
              } catch { setLiked((l) => !l); }
            }}
            aria-label={liked ? 'Unlike' : 'Like'}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs transition active:scale-95 ${
              liked ? 'text-rose-500' : 'text-gray-400 hover:text-rose-400'
            }`}
          >
            <Heart className={`h-3.5 w-3.5 ${liked ? 'fill-rose-400' : ''}`} />
          </button>

          <button
            onClick={handleShare}
            aria-label="Share deck"
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs transition active:scale-95 ${
              justShared ? 'text-indigo-500' : 'text-gray-400 hover:text-indigo-500'
            }`}
          >
            {justShared ? <Check className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {error && <p className="text-xs text-red-500 px-4 pb-3 -mt-1">{error}</p>}
    </div>
  );
}
