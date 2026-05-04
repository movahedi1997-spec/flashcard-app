'use client';

import { useState } from 'react';
import { Download, Check } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';

interface SessionStats {
  again: number;
  hard: number;
  good: number;
  easy: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
  stats: SessionStats;
  retention: number;
  total: number;
  deckName: string;
  streak?: number;
}

const TEMPLATES = [
  { id: 1, label: 'Gradient', preview: 'linear-gradient(135deg, #4f46e5, #7c3aed)' },
  { id: 2, label: 'Dark',     preview: '#0f172a' },
  { id: 3, label: 'Minimal',  preview: '#f8fafc' },
] as const;

export default function WrappedModal({
  open, onClose, stats, retention, total, deckName, streak = 0,
}: Props) {
  const [selected, setSelected] = useState<1 | 2 | 3>(1);
  const [copied, setCopied] = useState(false);

  function buildUrl(template: number): string {
    const p = new URLSearchParams({
      template: String(template),
      again: String(stats.again),
      hard: String(stats.hard),
      good: String(stats.good),
      easy: String(stats.easy),
      retention: String(retention),
      total: String(total),
      deck: deckName,
      streak: String(streak),
    });
    return `/api/og/wrapped?${p.toString()}`;
  }

  function handleDownload() {
    const a = document.createElement('a');
    a.href = buildUrl(selected);
    a.download = `study-results-${Date.now()}.png`;
    a.target = '_blank';
    a.click();
  }

  async function handleCopyLink() {
    const url = `${window.location.origin}${buildUrl(selected)}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const retColor = retention >= 80 ? 'text-emerald-600' : retention >= 60 ? 'text-amber-500' : 'text-red-500';

  return (
    <Modal open={open} onClose={onClose} title="Share Your Results" maxWidth="max-w-lg">
      <div className="flex flex-col gap-5">
        {/* Session summary */}
        <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-700">{deckName}</p>
            <p className="text-xs text-slate-500">{total} cards reviewed</p>
          </div>
          <div className={`text-2xl font-black ${retColor}`}>{retention}%</div>
        </div>

        {/* Template picker */}
        <div>
          <p className="text-sm font-semibold text-slate-700 mb-3">Choose a template</p>
          <div className="grid grid-cols-3 gap-3">
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelected(t.id as 1 | 2 | 3)}
                className={`relative rounded-xl overflow-hidden border-2 transition-all ${
                  selected === t.id
                    ? 'border-indigo-500 ring-2 ring-indigo-200'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Preview thumbnail — static representation */}
                <div
                  style={{ background: t.preview }}
                  className="h-20 w-full flex flex-col items-center justify-center gap-1 p-2"
                >
                  <span
                    className="text-xl font-black"
                    style={{ color: t.id === 3 ? '#6366f1' : '#fff' }}
                  >
                    {retention}%
                  </span>
                  <span
                    className="text-[10px] font-semibold"
                    style={{ color: t.id === 3 ? '#94a3b8' : 'rgba(255,255,255,0.65)' }}
                  >
                    {total} cards
                  </span>
                </div>
                <div
                  className="py-1.5 text-xs font-medium text-center"
                  style={{
                    background: t.id === 3 ? '#fff' : t.id === 2 ? '#1e293b' : 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                    color: t.id === 3 ? '#64748b' : 'rgba(255,255,255,0.8)',
                  }}
                >
                  {t.label}
                </div>
                {selected === t.id && (
                  <div className="absolute top-1.5 right-1.5 bg-indigo-500 rounded-full p-0.5">
                    <Check size={10} className="text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Live preview link */}
        <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 flex items-center gap-2">
          <span className="flex-1 text-xs text-slate-500 truncate font-mono">
            {buildUrl(selected)}
          </span>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="secondary" onClick={handleCopyLink} className="flex-1">
            {copied ? <Check size={14} className="text-emerald-500" /> : null}
            {copied ? 'Copied!' : 'Copy link'}
          </Button>
          <Button onClick={handleDownload} className="flex-1">
            <Download size={14} /> Download image
          </Button>
        </div>
      </div>
    </Modal>
  );
}
