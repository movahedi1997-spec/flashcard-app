'use client';

/**
 * ShareDeckPanel — TASK-017
 *
 * Public/Private visibility toggle + share widget for the deck management view.
 * Shown as a panel inside the deck detail page (BoxView) via a "Share" button.
 *
 * Features:
 *   - Toggle deck visibility (Public ↔ Private) via PATCH /api/decks/[id]
 *   - When public: show the shareable URL + one-click copy-to-clipboard
 *   - Pre-written share messages for WhatsApp and Twitter/X
 *   - Copy count badge (how many users have copied this deck)
 */

import { useState } from 'react';
import { Globe, Lock, Copy, Check, MessageCircle, Twitter } from 'lucide-react';
import type { Deck } from '@/types/api';
import { fetchWithRefresh } from '@/lib/fetchWithRefresh';

interface ShareDeckPanelProps {
  deck: Deck;
  onUpdated: (updated: Deck) => void;
}

export default function ShareDeckPanel({ deck, onUpdated }: ShareDeckPanelProps) {
  const [toggling, setToggling]   = useState(false);
  const [copied, setCopied]       = useState(false);
  const [error, setError]         = useState('');

  const shareUrl = deck.slug
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/explore/${deck.slug}`
    : null;

  // ── Toggle public/private ──────────────────────────────────────────────────

  async function handleToggle() {
    setToggling(true);
    setError('');
    try {
      const res = await fetchWithRefresh(`/api/decks/${deck.id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ is_public: !deck.isPublic }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? 'Failed to update visibility.');
      }
      const { deck: updated } = (await res.json()) as { deck: Deck };
      onUpdated(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setToggling(false);
    }
  }

  // ── Copy URL to clipboard ──────────────────────────────────────────────────

  async function handleCopyUrl() {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Could not copy to clipboard.');
    }
  }

  // ── Pre-written share messages ─────────────────────────────────────────────

  const whatsappMsg = shareUrl
    ? encodeURIComponent(
        `📚 Check out this "${deck.title}" flashcard deck on FlashcardAI — free to study and copy!\n${shareUrl}`,
      )
    : '';

  const twitterMsg = shareUrl
    ? encodeURIComponent(
        `Studying "${deck.title}" on @FlashcardAI 🧠 Free SRS flashcards — copy this deck and start now!\n${shareUrl}`,
      )
    : '';

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 space-y-5">
      <h3 className="text-base font-semibold text-gray-900">Share this deck</h3>

      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</div>
      )}

      {/* Visibility toggle */}
      <div className="flex items-center justify-between gap-4 rounded-xl border border-gray-100 p-4">
        <div className="flex items-center gap-3">
          <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${deck.isPublic ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-100 text-gray-500'}`}>
            {deck.isPublic ? <Globe className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">
              {deck.isPublic ? 'Public' : 'Private'}
            </p>
            <p className="text-xs text-gray-500">
              {deck.isPublic
                ? 'Anyone can find and copy this deck on the Explore page.'
                : 'Only you can see this deck.'}
            </p>
          </div>
        </div>

        {/* Toggle switch */}
        <button
          onClick={handleToggle}
          disabled={toggling}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none disabled:opacity-50 ${deck.isPublic ? 'bg-indigo-600' : 'bg-gray-200'}`}
          aria-label={deck.isPublic ? 'Make private' : 'Make public'}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${deck.isPublic ? 'translate-x-5' : 'translate-x-0'}`}
          />
        </button>
      </div>

      {/* Share URL — only shown when deck is public and has a slug */}
      {deck.isPublic && shareUrl && (
        <div className="space-y-3">
          {/* URL copy field */}
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5">
            <p className="flex-1 truncate text-sm text-gray-600 font-mono">{shareUrl}</p>
            <button
              onClick={handleCopyUrl}
              className="flex-shrink-0 flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-700"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>

          {/* Social share buttons */}
          <div className="flex gap-2">
            <a
              href={`https://wa.me/?text=${whatsappMsg}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-xl border border-gray-100 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-green-50 hover:border-green-200 hover:text-green-700"
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </a>
            <a
              href={`https://twitter.com/intent/tweet?text=${twitterMsg}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-xl border border-gray-100 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-sky-50 hover:border-sky-200 hover:text-sky-600"
            >
              <Twitter className="h-4 w-4" />
              Twitter/X
            </a>
          </div>
        </div>
      )}

      {/* Waiting for slug note — deck just made public, slug generates on first save */}
      {deck.isPublic && !deck.slug && (
        <p className="text-xs text-gray-400">
          Your shareable link is being generated — refresh in a moment.
        </p>
      )}
    </div>
  );
}
