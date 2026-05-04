'use client';

import { useState } from 'react';
import { Flag, X } from 'lucide-react';
import { fetchWithRefresh } from '@/lib/fetchWithRefresh';

const REPORT_REASONS = [
  { key: 'illegal_content', label: 'Illegal content' },
  { key: 'copyright',       label: 'Copyright violation' },
  { key: 'hate_speech',     label: 'Hate speech' },
  { key: 'misinformation',  label: 'Misinformation' },
  { key: 'spam',            label: 'Spam' },
  { key: 'violence',        label: 'Violence' },
  { key: 'other',           label: 'Other' },
] as const;

export default function ReportDeckButton({ deckId }: { deckId: string }) {
  const [open, setOpen]       = useState(false);
  const [reason, setReason]   = useState('');
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone]       = useState(false);

  async function submit() {
    if (!reason) return;
    setLoading(true);
    try {
      const res = await fetchWithRefresh('/api/decks/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deckId, reason, details: details.trim() || undefined }),
      });
      if (res.status === 401) { window.location.href = '/login'; return; }
      setDone(true);
      setOpen(false);
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return <span className="text-xs text-gray-400">Thanks for your report.</span>;
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 transition-colors"
      >
        <Flag size={12} />
        Report this deck
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-gray-900">Report this deck</h3>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={16} />
              </button>
            </div>
            <p className="text-xs text-gray-400 mb-4">
              Reports are reviewed by our moderation team within 24 hours.
            </p>
            <div className="flex flex-col gap-2 mb-4">
              {REPORT_REASONS.map((r) => (
                <label key={r.key} className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="radio"
                    name="deck-report-reason"
                    value={r.key}
                    checked={reason === r.key}
                    onChange={() => setReason(r.key)}
                    className="accent-indigo-600"
                  />
                  <span className="text-sm text-gray-700">{r.label}</span>
                </label>
              ))}
            </div>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value.slice(0, 500))}
              placeholder="Additional details (optional)…"
              rows={2}
              className="w-full text-sm rounded-xl border border-gray-200 px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400 mb-4"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setOpen(false)}
                className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={submit}
                disabled={!reason || loading}
                className="px-4 py-2 rounded-xl bg-red-600 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? 'Submitting…' : 'Submit report'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
