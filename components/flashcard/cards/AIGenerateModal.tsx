'use client';

import { useState, useRef, useEffect } from 'react';
import { Sparkles, Upload, FileText, X, CheckCircle2, AlertCircle, Zap } from 'lucide-react';

interface Props {
  deckId: string;
  onClose: () => void;
  onGenerated: (count: number) => void;
}

interface Quota {
  isPro: boolean;
  used: number;
  limit: number | null;
  remaining: number | null;
}

type Mode = 'idle' | 'loading' | 'done' | 'error';

// ── Generating steps shown during 3D animation ────────────────────────────────
const STEPS = [
  'Reading your material…',
  'Identifying key concepts…',
  'Extracting important facts…',
  'Building flashcard pairs…',
  'Optimising for memory retention…',
  'Finalising your cards…',
];

// ── 3D Card Stack Animation ───────────────────────────────────────────────────
function CardStackAnimation({ count }: { count: number }) {
  const [step, setStep] = useState(0);
  const [cardCount, setCardCount] = useState(0);

  useEffect(() => {
    const stepTimer = setInterval(() => setStep((s) => (s + 1) % STEPS.length), 2200);
    const cardTimer = setInterval(() => setCardCount((c) => (c < count ? c + 1 : c)), 300);
    return () => { clearInterval(stepTimer); clearInterval(cardTimer); };
  }, [count]);

  return (
    <div className="flex flex-col items-center py-8 gap-6">
      {/* 3D card stack */}
      <div className="relative h-36 w-28" style={{ perspective: '600px' }}>
        {/* Static stack layers */}
        {[4, 3, 2, 1].map((i) => (
          <div
            key={i}
            className="absolute inset-0 rounded-xl border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-violet-50"
            style={{
              transform: `translateY(${i * -5}px) translateX(${i * 3}px) rotateX(8deg)`,
              opacity: 1 - i * 0.15,
              transformStyle: 'preserve-3d',
            }}
          />
        ))}

        {/* Animated top card — flips continuously */}
        <div
          className="absolute inset-0 rounded-xl border-2 border-indigo-400 bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-200"
          style={{
            transformStyle: 'preserve-3d',
            animation: 'cardFlip 2.2s ease-in-out infinite',
            transform: 'translateY(-20px) rotateX(8deg)',
          }}
        >
          {/* Front face */}
          <div
            className="absolute inset-0 rounded-xl flex items-center justify-center"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <Sparkles className="h-8 w-8 text-white opacity-90" />
          </div>
          {/* Back face */}
          <div
            className="absolute inset-0 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <div className="space-y-1.5 px-3 w-full">
              <div className="h-1.5 bg-white/40 rounded-full w-full" />
              <div className="h-1.5 bg-white/30 rounded-full w-4/5" />
              <div className="h-1.5 bg-white/20 rounded-full w-3/5" />
            </div>
          </div>
        </div>
      </div>

      {/* Card counter */}
      <div className="flex items-center gap-2">
        <div className="flex gap-1">
          {Array.from({ length: Math.min(count, 10) }).map((_, i) => (
            <div
              key={i}
              className={`h-2 w-2 rounded-full transition-all duration-300 ${
                i < Math.floor((cardCount / count) * Math.min(count, 10))
                  ? 'bg-indigo-500 scale-110'
                  : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
        <span className="text-sm font-bold text-indigo-600 tabular-nums w-16">
          {cardCount} / {count}
        </span>
      </div>

      {/* Step label */}
      <p className="text-sm text-gray-500 animate-pulse text-center h-5">{STEPS[step]}</p>

      <style>{`
        @keyframes cardFlip {
          0%   { transform: translateY(-20px) rotateX(8deg) rotateY(0deg); }
          40%  { transform: translateY(-28px) rotateX(8deg) rotateY(180deg); }
          60%  { transform: translateY(-28px) rotateX(8deg) rotateY(180deg); }
          100% { transform: translateY(-20px) rotateX(8deg) rotateY(360deg); }
        }
      `}</style>
    </div>
  );
}

// ── Quota bar ─────────────────────────────────────────────────────────────────
function QuotaBar({ quota }: { quota: Quota }) {
  if (quota.isPro || quota.limit === null || quota.remaining === null) return null;
  const pct = Math.round((quota.used / quota.limit) * 100);
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
          {isDanger  ? '⚠️ Almost out of free cards!' :
           isWarning ? '🔥 Using up fast…' :
                       '✨ Free daily cards'}
        </span>
        <span className={`font-bold tabular-nums ${isDanger ? 'text-red-700' : isWarning ? 'text-amber-700' : 'text-indigo-700'}`}>
          {quota.remaining} left
        </span>
      </div>
      <div className="h-2 bg-white/60 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isDanger ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-indigo-500'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className={`text-xs mt-1.5 ${isDanger ? 'text-red-500' : isWarning ? 'text-amber-500' : 'text-indigo-400'}`}>
        {quota.used} / {quota.limit} cards used this month · Resets next month
      </p>
    </div>
  );
}

// ── Main modal ────────────────────────────────────────────────────────────────
export default function AIGenerateModal({ deckId, onClose, onGenerated }: Props) {
  const [mode, setMode]       = useState<Mode>('idle');
  const [tab, setTab]         = useState<'pdf' | 'text'>('pdf');
  const [file, setFile]       = useState<File | null>(null);
  const [text, setText]       = useState('');
  const [count, setCount]     = useState(20);
  const [message, setMessage] = useState('');
  const [generated, setGenerated] = useState(0);
  const [quota, setQuota]     = useState<Quota | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/ai/quota', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => setQuota(d as Quota))
      .catch(() => {});
  }, []);

  // Cap count to remaining quota
  const effectiveMax = quota?.remaining !== null && quota?.remaining !== undefined
    ? Math.min(50, quota.remaining)
    : 50;

  async function handleGenerate() {
    if (tab === 'pdf' && !file)              { setMessage('Please select a PDF file.'); return; }
    if (tab === 'text' && text.trim().length < 50) { setMessage('Please enter at least 50 characters of text.'); return; }

    setMode('loading');
    setMessage('');

    const form = new FormData();
    form.append('deckId', deckId);
    form.append('count', String(count));
    if (tab === 'pdf' && file) form.append('file', file);
    if (tab === 'text')        form.append('text', text);

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

  const isExhausted = !quota?.isPro && quota?.remaining === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-violet-50">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-sm shadow-indigo-200">
              <Sparkles className="h-4.5 w-4.5 text-white" style={{ height: 18, width: 18 }} />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Generate with AI</h2>
              <p className="text-xs text-gray-500">Powered by Llama 3.3 · Gemini Flash</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Loading state */}
          {mode === 'loading' && <CardStackAnimation count={count} />}

          {/* Success state */}
          {mode === 'done' && (
            <div className="flex flex-col items-center py-8 gap-4 text-center">
              <div className="h-16 w-16 rounded-2xl bg-emerald-50 flex items-center justify-center ring-4 ring-emerald-100">
                <CheckCircle2 className="h-9 w-9 text-emerald-500" />
              </div>
              <div>
                <p className="text-xl font-black text-gray-900">{generated} cards generated!</p>
                <p className="text-sm text-gray-400 mt-1">Added to your deck and ready to study.</p>
              </div>
              <button
                onClick={onClose}
                className="mt-2 rounded-xl bg-indigo-600 px-8 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 active:scale-95 transition"
              >
                View cards
              </button>
            </div>
          )}

          {/* Idle / error state */}
          {(mode === 'idle' || mode === 'error') && (
            <>
              {/* Quota bar */}
              {quota && <QuotaBar quota={quota} />}

              {/* Exhausted state */}
              {isExhausted ? (
                <div className="flex flex-col items-center py-8 gap-4 text-center">
                  <div className="h-16 w-16 rounded-2xl bg-red-50 flex items-center justify-center">
                    <Zap className="h-8 w-8 text-red-400" />
                  </div>
                  <div>
                    <p className="text-base font-bold text-gray-900">Monthly limit reached</p>
                    <p className="text-sm text-gray-500 mt-1">
                      You've used all 200 free AI cards for this month.<br />Your quota resets at the start of next month.
                    </p>
                  </div>
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
                          <span className="text-sm font-medium truncate max-w-xs">{file.name}</span>
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
                      rows={7}
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none resize-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    />
                  )}

                  {/* Card count slider */}
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-sm font-medium text-gray-700">Number of cards</label>
                      <span className="text-sm font-black text-indigo-600">{Math.min(count, effectiveMax)}</span>
                    </div>
                    <input
                      type="range"
                      min={5}
                      max={effectiveMax}
                      step={5}
                      value={Math.min(count, effectiveMax)}
                      onChange={(e) => setCount(Number(e.target.value))}
                      className="w-full accent-indigo-600"
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>5</span>
                      <span>{effectiveMax} remaining this month</span>
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
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 py-3.5 text-sm font-bold text-white shadow-md shadow-indigo-200 hover:shadow-lg hover:from-indigo-700 hover:to-violet-700 active:scale-95 transition-all"
                  >
                    <Sparkles className="h-4 w-4" />
                    Generate {Math.min(count, effectiveMax)} cards
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
