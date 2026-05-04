'use client';

import { useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
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

export default function QuizAIGenerateModal({ open, onClose, quizDeckId, onGenerated }: Props) {
  const [text, setText] = useState('');
  const [count, setCount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleGenerate() {
    if (text.trim().length < 30) { setError('Enter at least 30 characters of text.'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetchWithRefresh('/api/quiz/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizDeckId, text: text.trim(), count }),
      });
      const data = await res.json() as { questions?: QuizQuestion[]; error?: string; code?: string };
      if (!res.ok) {
        if (data.code === 'QUOTA_EXCEEDED') {
          setError(`Monthly AI limit reached. Upgrade to Pro for more.`);
        } else {
          setError(data.error ?? 'Generation failed.');
        }
        return;
      }
      onGenerated(data.questions ?? []);
      setText('');
      onClose();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Generate Questions with AI" maxWidth="max-w-xl">
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-3 bg-indigo-50 rounded-xl px-4 py-3">
          <Sparkles className="h-4 w-4 text-indigo-500 mt-0.5 shrink-0" />
          <p className="text-sm text-indigo-700">
            Paste a passage, textbook excerpt, or any topic text. AI will generate 3-option MCQ questions from it.
          </p>
        </div>

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
          <Button onClick={() => void handleGenerate()} disabled={loading || text.trim().length < 30}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {loading ? 'Generating…' : `Generate ${count} questions`}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
