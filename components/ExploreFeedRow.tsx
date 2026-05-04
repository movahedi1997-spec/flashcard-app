'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BadgeCheck, Copy, Check, Loader2 } from 'lucide-react';
import type { PublicDeck } from '@/types/api';
import { fetchWithRefresh } from '@/lib/fetchWithRefresh';

const SUBJECT_LABELS: Record<string, string> = {
  medicine:        'Medicine',
  pharmacy:        'Pharmacy',
  chemistry:       'Chemistry',
  languages:       'Languages',
  law:             'Law',
  science:         'Science',
  history:         'History',
  mathematics:     'Mathematics',
  computer_science:'CS',
  other:           'Other',
};

const SUBJECT_COLORS: Record<string, string> = {
  medicine:        'bg-indigo-50 text-indigo-700 border-indigo-100',
  pharmacy:        'bg-emerald-50 text-emerald-700 border-emerald-100',
  chemistry:       'bg-amber-50 text-amber-700 border-amber-100',
  languages:       'bg-violet-50 text-violet-700 border-violet-100',
  law:             'bg-slate-50 text-slate-700 border-slate-100',
  science:         'bg-sky-50 text-sky-700 border-sky-100',
  history:         'bg-orange-50 text-orange-700 border-orange-100',
  mathematics:     'bg-rose-50 text-rose-700 border-rose-100',
  computer_science:'bg-teal-50 text-teal-700 border-teal-100',
  other:           'bg-gray-50 text-gray-600 border-gray-100',
};

interface Props {
  deck: PublicDeck;
  onCopied?: (deckId: string) => void;
}

export default function ExploreFeedRow({ deck, onCopied }: Props) {
  const [copying, setCopying]       = useState(false);
  const [justCopied, setJustCopied] = useState(false);
  const [error, setError]           = useState('');

  const isCopied = deck.alreadyCopied || justCopied;

  async function handleCopy(e: React.MouseEvent) {
    e.preventDefault();
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

  const subjectColor = deck.subject ? (SUBJECT_COLORS[deck.subject] ?? SUBJECT_COLORS.other) : '';
  const subjectLabel = deck.subject ? (SUBJECT_LABELS[deck.subject] ?? deck.subject) : null;
  const handle = deck.creatorUsername ? `@${deck.creatorUsername}` : deck.creatorName;

  return (
    <Link
      href={`/explore/${deck.slug}`}
      className="group flex items-center gap-3 px-4 py-3.5 bg-white hover:bg-gray-50/80 transition-colors border-b border-gray-100 last:border-b-0 no-underline"
    >
      {/* Emoji */}
      <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-xl">
        {deck.emoji}
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-sm font-semibold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
            {deck.title}
          </span>
          {deck.isVerifiedCreator && (
            <BadgeCheck className="h-3.5 w-3.5 text-indigo-500 flex-shrink-0" />
          )}
          {deck.deckType === 'quiz' && (
            <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full flex-shrink-0">
              Quiz
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400 flex-wrap">
          <span className="truncate max-w-[120px]">{handle}</span>
          <span>·</span>
          <span>{deck.cardCount} {deck.deckType === 'quiz' ? 'questions' : 'cards'}</span>
          {(deck.copyCount ?? 0) > 0 && (
            <>
              <span>·</span>
              <span>{deck.copyCount} copies</span>
            </>
          )}
          {subjectLabel && (
            <>
              <span>·</span>
              <span className={`px-1.5 py-0.5 rounded-md border text-[10px] font-semibold uppercase tracking-wide ${subjectColor}`}>
                {subjectLabel}
              </span>
            </>
          )}
        </div>
        {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
      </div>

      {/* Copy button */}
      <button
        onClick={handleCopy}
        disabled={isCopied || copying}
        aria-label={isCopied ? 'Already in library' : 'Copy to library'}
        className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition active:scale-95 ${
          isCopied
            ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 cursor-default'
            : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'
        } disabled:opacity-60`}
      >
        {copying ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : isCopied ? (
          <Check className="h-3.5 w-3.5" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
        <span className="hidden sm:inline">{isCopied ? 'Saved' : 'Copy'}</span>
      </button>
    </Link>
  );
}
