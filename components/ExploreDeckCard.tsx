'use client';

/**
 * ExploreDeckCard — one card in the public Explore feed.
 *
 * Shows deck metadata, creator, card count, and a "Copy to Library" CTA.
 * Handles copy state locally (copying → copied / error).
 */

import { useState } from 'react';
import Link from 'next/link';
import { BookOpen, Copy, Check, Loader2, BadgeCheck, Flag } from 'lucide-react';
import type { PublicDeck } from '@/types/api';
import { fetchWithRefresh } from '@/lib/fetchWithRefresh';

// ── Palette (mirrors BoxCard) ─────────────────────────────────────────────────

const PALETTES: Record<string, { gradient: string; border: string; shadow: string }> = {
  indigo:  { gradient: 'from-indigo-600 to-violet-600',  border: 'border-indigo-100',  shadow: 'hover:shadow-indigo-200/60'  },
  emerald: { gradient: 'from-emerald-600 to-teal-600',   border: 'border-emerald-100', shadow: 'hover:shadow-emerald-200/60' },
  amber:   { gradient: 'from-amber-500 to-orange-500',   border: 'border-amber-100',   shadow: 'hover:shadow-amber-200/60'   },
  rose:    { gradient: 'from-rose-500 to-pink-600',      border: 'border-rose-100',    shadow: 'hover:shadow-rose-200/60'    },
  sky:     { gradient: 'from-sky-500 to-cyan-600',       border: 'border-sky-100',     shadow: 'hover:shadow-sky-200/60'     },
  violet:  { gradient: 'from-violet-600 to-purple-700',  border: 'border-violet-100',  shadow: 'hover:shadow-violet-200/60'  },
  fuchsia: { gradient: 'from-fuchsia-500 to-pink-600',   border: 'border-fuchsia-100', shadow: 'hover:shadow-fuchsia-200/60' },
  teal:    { gradient: 'from-teal-500 to-cyan-600',      border: 'border-teal-100',    shadow: 'hover:shadow-teal-200/60'    },
  gold:    { gradient: 'from-yellow-500 to-amber-600',   border: 'border-yellow-100',  shadow: 'hover:shadow-yellow-200/60'  },
  slate:   { gradient: 'from-slate-700 to-slate-900',    border: 'border-slate-200',   shadow: 'hover:shadow-slate-300/60'   },
};
const DEFAULT_PALETTE = PALETTES.indigo;
function getPalette(color: string) { return PALETTES[color] ?? DEFAULT_PALETTE; }

interface Props {
  deck: PublicDeck;
  /** Callback so parent grid can update alreadyCopied state */
  onCopied?: (deckId: string) => void;
}

const REPORT_REASONS = [
  { key: 'illegal_content', label: 'Illegal content' },
  { key: 'copyright',       label: 'Copyright violation' },
  { key: 'hate_speech',     label: 'Hate speech' },
  { key: 'misinformation',  label: 'Misinformation' },
  { key: 'spam',            label: 'Spam' },
  { key: 'violence',        label: 'Violence' },
  { key: 'other',           label: 'Other' },
] as const;

export default function ExploreDeckCard({ deck, onCopied }: Props) {
  const palette = getPalette(deck.color);
  const [copying, setCopying]       = useState(false);
  const [justCopied, setJustCopied] = useState(false);
  const [error, setError]           = useState('');
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [reporting, setReporting]   = useState(false);
  const [reported, setReported]     = useState(false);

  async function handleReport(e: React.MouseEvent) {
    e.preventDefault();
    setShowReport(true);
  }

  async function submitReport(e: React.MouseEvent) {
    e.preventDefault();
    if (!reportReason) return;
    setReporting(true);
    try {
      const res = await fetchWithRefresh('/api/decks/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deckId: deck.id, reason: reportReason, details: reportDetails }),
      });
      if (res.status === 401) { window.location.href = '/login'; return; }
      setReported(true);
      setShowReport(false);
    } catch {
      // silent
    } finally {
      setReporting(false);
    }
  }

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
                <span className="ms-2 opacity-80">· {deck.copyCount} copies</span>
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

        {/* Report link */}
        <div className="flex justify-end">
          {reported ? (
            <span className="text-xs text-gray-400">Thanks for your report.</span>
          ) : (
            <button
              onClick={handleReport}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors"
            >
              <Flag size={11} /> Report
            </button>
          )}
        </div>
      </div>

      {/* Report modal */}
      {showReport && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => { e.preventDefault(); setShowReport(false); }}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold text-gray-900 mb-1">Report this deck</h3>
            <p className="text-xs text-gray-400 mb-4">
              Reports are reviewed by our moderation team within 24 hours.
            </p>
            <div className="flex flex-col gap-2 mb-4">
              {REPORT_REASONS.map((r) => (
                <label key={r.key} className="flex items-center gap-2.5 cursor-pointer group">
                  <input
                    type="radio"
                    name="reason"
                    value={r.key}
                    checked={reportReason === r.key}
                    onChange={() => setReportReason(r.key)}
                    className="accent-indigo-600"
                  />
                  <span className="text-sm text-gray-700 group-hover:text-gray-900">{r.label}</span>
                </label>
              ))}
            </div>
            <textarea
              value={reportDetails}
              onChange={(e) => setReportDetails(e.target.value.slice(0, 500))}
              placeholder="Additional details (optional)…"
              rows={2}
              className="w-full text-sm rounded-xl border border-gray-200 px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400 mb-4"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowReport(false)}
                className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={submitReport}
                disabled={!reportReason || reporting}
                className="px-4 py-2 rounded-xl bg-red-600 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {reporting ? 'Submitting…' : 'Submit Report'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Link>
  );
}
