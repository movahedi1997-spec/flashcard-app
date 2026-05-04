'use client';

import { useState, useRef, useEffect } from 'react';
import { Loader2, Sparkles, Upload, FileText, X, Zap, Coins } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import type { QuizQuestion } from '@/types/api';
import { fetchWithRefresh } from '@/lib/fetchWithRefresh';

interface Props {
  open: boolean;
  onClose: () => void;
  quizDeckId: string;
  onGenerated: (questions: QuizQuestion[]) => void;
}

interface Quota {
  isPro: boolean;
  used: number;
  quizLimit: number;
  quizRemaining: number;
  credits: number;
}

function QuotaBar({ quota }: { quota: Quota }) {
  const totalAvailable = quota.quizRemaining + quota.credits;
  if (quota.isPro) return null;
  const pct = Math.min(100, Math.round((quota.used / quota.quizLimit) * 100));
  const isWarning = pct >= 60 && pct < 90;
  const isDanger  = pct >= 90;

  return (
    <div className={`rounded-xl px-4 py-3 text-sm ${
      isDanger  ? 'bg-red-50 border border-red-100' :
      isWarning ? 'bg-amber-50 border border-amber-100' :
                  'bg-indigo-50 border border-indigo-100'
    }`}>
      <div className="flex justify-between mb-2">
        <span className={`font-medium ${isDanger ? 'text-red-700' : isWarning ? 'text-amber-700' : 'text-indigo-700'}`}>
          {isDanger ? '⚠️ Almost out of free questions!' : isWarning ? '🔥 Using up fast…' : '✨ Free monthly questions'}
        </span>
        <span className={`font-bold tabular-nums ${isDanger ? 'text-red-700' : isWarning ? 'text-amber-700' : 'text-indigo-700'}`}>
          {quota.quizRemaining} left
        </span>
      </div>
      <div className="h-2 bg-white/60 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${isDanger ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-indigo-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className={`text-xs mt-1.5 ${isDanger ? 'text-red-500' : isWarning ? 'text-amber-500' : 'text-indigo-400'}`}>
        {quota.used} / {quota.quizLimit} questions used this month · Resets next month
        {quota.credits > 0 && ` · +${quota.credits} bonus credits`}
      </p>
      {totalAvailable === 0 && (
        <a href="/settings/billing" className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:underline">
          <Zap className="h-3 w-3" /> Buy more credits or upgrade to Pro
        </a>
      )}
    </div>
  );
}

export default function QuizAIGenerateModal({ open, onClose, quizDeckId, onGenerated }: Props) {
  const [tab, setTab]     = useState<'pdf' | 'text'>('pdf');
  const [file, setFile]   = useState<File | null>(null);
  const [text, setText]   = useState('');
  const [count, setCount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [quota, setQuota] = useState<Quota | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    fetch('/api/ai/quota', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => setQuota(d as Quota))
      .catch(() => {});
  }, [open]);

  async function handleGenerate() {
    if (tab === 'pdf' && !file)              { setError('Select a PDF file.'); return; }
    if (tab === 'text' && text.trim().length < 30) { setError('Enter at least 30 characters of text.'); return; }
    setLoading(true);
    setError('');
    try {
      const form = new FormData();
      form.append('quizDeckId', quizDeckId);
      form.append('count', String(count));
      if (tab === 'pdf' && file) form.append('file', file);
      if (tab === 'text')        form.append('text', text.trim());

      const res = await fetchWithRefresh('/api/quiz/generate', { method: 'POST', body: form });
      const data = await res.json() as { questions?: QuizQuestion[]; error?: string; code?: string };
      if (!res.ok) {
        setError(data.code === 'QUOTA_EXCEEDED' ? 'Monthly AI limit reached. Upgrade to Pro for more.' : (data.error ?? 'Generation failed.'));
        return;
      }
      onGenerated(data.questions ?? []);
      setText('');
      setFile(null);
      onClose();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const totalAvailable = quota ? quota.quizRemaining + quota.credits : null;
  const isExhausted    = totalAvailable === 0;
  const canGenerate    = !isExhausted && (tab === 'pdf' ? !!file : text.trim().length >= 30);

  return (
    <Modal open={open} onClose={onClose} title="Generate Questions with AI" maxWidth="max-w-xl">
      <div className="flex flex-col gap-4">
        {/* Quota bar — hidden when exhausted (redundant with the exhausted screen) */}
        {quota && !isExhausted && <QuotaBar quota={quota} />}

        {/* Exhausted state */}
        {isExhausted ? (
          quota?.isPro ? (
            /* Pro user — 499 monthly used up, offer credits */
            <div className="flex flex-col items-center py-6 gap-4 text-center">
              <div className="h-16 w-16 rounded-2xl bg-amber-50 flex items-center justify-center">
                <Coins className="h-8 w-8 text-amber-400" />
              </div>
              <div>
                <p className="text-base font-bold text-gray-900">Monthly quota used up</p>
                <p className="text-sm text-gray-500 mt-1">
                  You've used all 499 Pro questions this month.<br />
                  Buy bonus credits to keep going — they never expire.
                </p>
              </div>
              <a
                href="/settings/billing"
                className="flex items-center justify-center gap-2 w-full rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white hover:bg-indigo-700 transition-colors"
              >
                <Coins className="h-4 w-4" /> Buy more credits
              </a>
              <p className="text-xs text-gray-400">One-time purchase · Never expire · Works for flashcards &amp; quizzes</p>
            </div>
          ) : (
            /* Free user — offer Pro (primary) or buy credits (secondary) */
            <div className="flex flex-col items-center py-6 gap-4 text-center">
              <div className="h-16 w-16 rounded-2xl bg-red-50 flex items-center justify-center">
                <Zap className="h-8 w-8 text-red-400" />
              </div>
              <div>
                <p className="text-base font-bold text-gray-900">Monthly limit reached</p>
                <p className="text-sm text-gray-500 mt-1">
                  You've used all 94 free AI questions this month.<br />
                  Upgrade for more, or top up with credits.
                </p>
              </div>
              <a
                href="/pricing"
                className="flex items-center justify-center gap-2 w-full rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white hover:bg-indigo-700 transition-colors"
              >
                <Sparkles className="h-4 w-4" /> Go Pro — 499 questions/month
              </a>
              <p className="text-xs text-gray-400">€6.99/month · Cancel anytime</p>
              <div className="w-full border-t border-gray-100 pt-3">
                <p className="text-xs text-gray-500 mb-2">Or top up without subscribing</p>
                <a
                  href="/settings/billing"
                  className="flex items-center justify-center gap-2 w-full rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-700 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 transition"
                >
                  <Coins className="h-4 w-4" /> Buy credits
                </a>
              </div>
            </div>
          )
        ) : (
          <>
        <div className="flex items-start gap-3 bg-indigo-50 rounded-xl px-4 py-3">
          <Sparkles className="h-4 w-4 text-indigo-500 mt-0.5 shrink-0" />
          <p className="text-sm text-indigo-700">
            Upload a PDF or paste text. AI will generate 3-option MCQ questions for spaced repetition.
          </p>
        </div>

        <p className="text-xs text-gray-400 -mt-2">
          Your PDF and text are used only to generate questions and are never stored on our servers.
        </p>

        {/* Tab switcher */}
        <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
          {(['pdf', 'text'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => { setTab(t); setError(''); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium rounded-lg transition ${
                tab === t ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t === 'pdf' ? <Upload className="h-3.5 w-3.5" /> : <FileText className="h-3.5 w-3.5" />}
              {t === 'pdf' ? 'Upload PDF' : 'Paste Text'}
            </button>
          ))}
        </div>

        {/* PDF upload */}
        {tab === 'pdf' && (
          <div
            onClick={() => fileRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition ${
              file ? 'border-indigo-300 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
            }`}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,application/pdf"
              className="hidden"
              onChange={(e) => { setFile(e.target.files?.[0] ?? null); setError(''); }}
            />
            {file ? (
              <div className="flex items-center justify-center gap-2 text-indigo-700">
                <FileText className="h-5 w-5" />
                <span className="text-sm font-medium truncate max-w-xs">{file.name}</span>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setFile(null); }}
                  className="ms-1 text-indigo-400 hover:text-indigo-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <>
                <Upload className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Click to upload a PDF</p>
                <p className="text-xs text-gray-400 mt-1">Max 20 MB · Text-based PDFs only</p>
              </>
            )}
          </div>
        )}

        {/* Text input */}
        {tab === 'text' && (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">Source text</label>
            <textarea
              value={text}
              onChange={(e) => { setText(e.target.value); setError(''); }}
              placeholder="Paste the text you want questions generated from… (min 30 characters)"
              rows={6}
              maxLength={8000}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
            />
            <p className="text-xs text-slate-400 text-right">{text.length} / 8000</p>
          </div>
        )}

        {/* Count selector */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700">Number of questions</label>
          <div className="flex gap-2">
            {[5, 10, 15, 20].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setCount(n)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold border transition ${
                  count === n
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex gap-3 justify-end pt-1">
          <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button onClick={() => void handleGenerate()} disabled={loading || !canGenerate}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {loading ? 'Generating…' : `Generate ${count} questions`}
          </Button>
        </div>
          </>
        )}
      </div>
    </Modal>
  );
}
