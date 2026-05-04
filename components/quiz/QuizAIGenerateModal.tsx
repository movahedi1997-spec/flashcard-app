'use client';

import { useState, useRef } from 'react';
import { Loader2, Sparkles, Upload, FileText, X } from 'lucide-react';
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
  const [tab, setTab]     = useState<'pdf' | 'text'>('pdf');
  const [file, setFile]   = useState<File | null>(null);
  const [text, setText]   = useState('');
  const [count, setCount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

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

  const canGenerate = tab === 'pdf' ? !!file : text.trim().length >= 30;

  return (
    <Modal open={open} onClose={onClose} title="Generate Questions with AI" maxWidth="max-w-xl">
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-3 bg-indigo-50 rounded-xl px-4 py-3">
          <Sparkles className="h-4 w-4 text-indigo-500 mt-0.5 shrink-0" />
          <p className="text-sm text-indigo-700">
            Upload a PDF or paste text. AI will generate 3-option MCQ questions for spaced repetition.
          </p>
        </div>

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
      </div>
    </Modal>
  );
}
