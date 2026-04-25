'use client';

/**
 * CopyDeckButton — thin client wrapper used by the ISR deck landing page.
 *
 * The parent page is a server component and can't contain interactive state,
 * so we isolate the copy action here. This keeps the parent fully SSR/ISR.
 */

import { useState } from 'react';
import Link from 'next/link';
import { Copy, Check, Loader2 } from 'lucide-react';
import { fetchWithRefresh } from '@/lib/fetchWithRefresh';

interface Props {
  deckId: string;
  alreadyCopied: boolean;
}

export default function CopyDeckButton({ deckId, alreadyCopied: initialCopied }: Props) {
  const [copied, setCopied]   = useState(initialCopied);
  const [copying, setCopying] = useState(false);
  const [error, setError]     = useState('');

  async function handleCopy() {
    if (copied || copying) return;
    setCopying(true);
    setError('');

    try {
      const res = await fetchWithRefresh(`/api/decks/${deckId}/copy`, { method: 'POST' });

      if (res.status === 401) {
        window.location.href = '/signup';
        return;
      }
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? 'Copy failed.');
      }
      setCopied(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setCopying(false);
    }
  }

  if (copied) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-center gap-2 w-full rounded-xl bg-emerald-50 border border-emerald-200 py-3 text-sm font-semibold text-emerald-700">
          <Check className="h-4 w-4" />
          Added to your library!
        </div>
        <Link
          href="/flashcards"
          className="block w-full text-center rounded-xl border border-indigo-200 py-2.5 text-sm font-semibold text-indigo-600 transition hover:bg-indigo-50"
        >
          Go to My Library →
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleCopy}
        disabled={copying}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-700 active:scale-95 disabled:opacity-60"
      >
        {copying
          ? <><Loader2 className="h-4 w-4 animate-spin" /> Copying…</>
          : <><Copy className="h-4 w-4" /> Copy to My Library</>
        }
      </button>
      {error && (
        <p className="text-xs text-red-500 text-center">{error}</p>
      )}
    </div>
  );
}
