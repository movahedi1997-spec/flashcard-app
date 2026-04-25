'use client';

import { useState } from 'react';
import { Sparkles, Loader2, Check, X, ArrowRight } from 'lucide-react';
import Modal from '@/components/ui/Modal';

interface Props {
  open: boolean;
  onClose: () => void;
  currentFront: string;
  currentBack: string;
  onApply: (front: string, back: string) => void;
}

export default function AIImproveModal({ open, onClose, currentFront, currentBack, onApply }: Props) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [suggested, setSuggested] = useState<{ front: string; back: string } | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);

  async function handleImprove() {
    setLoading(true);
    setError('');
    setSuggested(null);
    try {
      const res = await fetch('/api/ai/improve-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ front: currentFront, back: currentBack, prompt: prompt.trim() || undefined }),
      });
      const data = await res.json() as {
        suggestedFront?: string;
        suggestedBack?: string;
        remaining?: number;
        error?: string;
        code?: string;
      };
      if (!res.ok) {
        if (data.code === 'QUOTA_EXCEEDED') {
          setError(`Monthly limit reached. Upgrade to Pro for 299 improvements/month.`);
        } else {
          setError(data.error ?? 'Something went wrong.');
        }
        return;
      }
      setSuggested({ front: data.suggestedFront!, back: data.suggestedBack! });
      if (data.remaining !== undefined) setRemaining(data.remaining);
    } finally {
      setLoading(false);
    }
  }

  function handleApply() {
    if (!suggested) return;
    onApply(suggested.front, suggested.back);
    handleClose();
  }

  function handleClose() {
    setPrompt('');
    setError('');
    setSuggested(null);
    setLoading(false);
    onClose();
  }

  return (
    <Modal open={open} onClose={handleClose} title="AI Improve Card" maxWidth="max-w-lg">
      <div className="flex flex-col gap-4">

        {/* Custom prompt */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5">
            Instructions (optional)
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value.slice(0, 350))}
            placeholder='e.g. "Make the answer more concise" or "Add the drug mechanism"'
            rows={2}
            className="w-full text-sm rounded-xl border border-gray-200 px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <p className="text-end text-xs text-gray-300 mt-1">{prompt.length}/350</p>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
            {error}
            {error.includes('Upgrade') && (
              <a href="/pricing" className="ms-2 font-semibold underline">View Pro plans →</a>
            )}
          </div>
        )}

        {/* Preview */}
        {suggested && (
          <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 overflow-hidden">
            <div className="px-4 py-2.5 bg-indigo-50 border-b border-indigo-100 flex items-center gap-2">
              <Sparkles size={13} className="text-indigo-500" />
              <p className="text-xs font-semibold text-indigo-600">AI suggestion — review before applying</p>
            </div>
            <div className="p-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Current</p>
                <p className="text-gray-500 line-through text-xs leading-relaxed">{currentFront}</p>
                <div className="mt-2 pt-2 border-t border-indigo-100">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Answer</p>
                  <p className="text-gray-500 line-through text-xs leading-relaxed">{currentBack}</p>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-indigo-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <ArrowRight size={10} /> Suggested
                </p>
                <p className="text-gray-800 font-medium text-xs leading-relaxed">{suggested.front}</p>
                <div className="mt-2 pt-2 border-t border-indigo-100">
                  <p className="text-xs font-semibold text-indigo-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <ArrowRight size={10} /> Answer
                  </p>
                  <p className="text-gray-800 text-xs leading-relaxed">{suggested.back}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Remaining quota */}
        {remaining !== null && (
          <p className="text-xs text-gray-400 text-center">{remaining} improvements remaining this month</p>
        )}

        {/* Actions */}
        <div className="flex gap-2 justify-end">
          {suggested ? (
            <>
              <button
                onClick={() => setSuggested(null)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <X size={14} /> Discard
              </button>
              <button
                onClick={handleApply}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
              >
                <Check size={14} /> Apply
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleClose}
                className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleImprove}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors"
              >
                {loading
                  ? <><Loader2 size={14} className="animate-spin" /> Improving…</>
                  : <><Sparkles size={14} /> Improve with AI</>
                }
              </button>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}
