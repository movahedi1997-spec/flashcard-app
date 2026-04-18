'use client';

import { useState, useRef } from 'react';
import { Sparkles, Upload, FileText, X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface Props {
  deckId: string;
  onClose: () => void;
  onGenerated: (count: number) => void;
}

type Mode = 'idle' | 'loading' | 'done' | 'error';

export default function AIGenerateModal({ deckId, onClose, onGenerated }: Props) {
  const [mode, setMode]       = useState<Mode>('idle');
  const [tab, setTab]         = useState<'pdf' | 'text'>('pdf');
  const [file, setFile]       = useState<File | null>(null);
  const [text, setText]       = useState('');
  const [count, setCount]     = useState(20);
  const [message, setMessage] = useState('');
  const [generated, setGenerated] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleGenerate() {
    if (tab === 'pdf' && !file) { setMessage('Please select a PDF file.'); return; }
    if (tab === 'text' && text.trim().length < 50) { setMessage('Please enter at least 50 characters of text.'); return; }

    setMode('loading');
    setMessage('');

    const form = new FormData();
    form.append('deckId', deckId);
    form.append('count', String(count));
    if (tab === 'pdf' && file) form.append('file', file);
    if (tab === 'text') form.append('text', text);

    try {
      const res = await fetch('/api/ai/generate', { method: 'POST', body: form, credentials: 'include' });
      const data = await res.json() as Record<string, unknown>;

      if (!res.ok) {
        setMode('error');
        setMessage((data.error as string) ?? 'Generation failed. Please try again.');
        return;
      }

      setGenerated(data.generated as number);
      setMode('done');
      onGenerated(data.generated as number);
    } catch {
      setMode('error');
      setMessage('Network error. Please try again.');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-indigo-50 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-indigo-600" />
            </div>
            <h2 className="text-base font-bold text-gray-900">Generate with AI</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Success state */}
          {mode === 'done' ? (
            <div className="flex flex-col items-center py-8 gap-4 text-center">
              <div className="h-16 w-16 rounded-2xl bg-emerald-50 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900">{generated} cards generated!</p>
                <p className="text-sm text-gray-500 mt-1">They've been added to your deck.</p>
              </div>
              <button
                onClick={onClose}
                className="mt-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                View cards
              </button>
            </div>
          ) : (
            <>
              {/* Tab switcher */}
              <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
                {(['pdf', 'text'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
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
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  />
                  {file ? (
                    <div className="flex items-center justify-center gap-2 text-indigo-700">
                      <FileText className="h-5 w-5" />
                      <span className="text-sm font-medium">{file.name}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); setFile(null); }}
                        className="ml-1 text-indigo-400 hover:text-indigo-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Click to upload a PDF</p>
                      <p className="text-xs text-gray-400 mt-1">Max 10 MB · Text-based PDFs only</p>
                    </>
                  )}
                </div>
              )}

              {/* Text input */}
              {tab === 'text' && (
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Paste your lecture notes, textbook excerpts, or study material here…"
                  rows={8}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none resize-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
              )}

              {/* Card count slider */}
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Number of cards</label>
                  <span className="text-sm font-bold text-indigo-600">{count}</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={50}
                  step={5}
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                  className="w-full accent-indigo-600"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>5</span><span>50</span>
                </div>
              </div>

              {/* Error */}
              {(mode === 'error' || message) && (
                <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {message}
                </div>
              )}

              {/* Generate button */}
              <button
                onClick={handleGenerate}
                disabled={mode === 'loading'}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white hover:bg-indigo-700 active:scale-95 disabled:opacity-60 transition"
              >
                {mode === 'loading' ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Generating…</>
                ) : (
                  <><Sparkles className="h-4 w-4" /> Generate {count} cards</>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
