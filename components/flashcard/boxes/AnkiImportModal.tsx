'use client';

import { useState, useRef } from 'react';
import { Upload, Loader2, CheckCircle, AlertCircle, X } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';

interface Props {
  open: boolean;
  onClose: () => void;
  onImported: (deckId: string, cardCount: number) => void;
}

type Status = 'idle' | 'uploading' | 'done' | 'error';

export default function AnkiImportModal({ open, onClose, onImported }: Props) {
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');
  const [result, setResult] = useState<{ deckId: string; cardCount: number } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function reset() {
    setStatus('idle');
    setMessage('');
    setResult(null);
    if (fileRef.current) fileRef.current.value = '';
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function uploadFile(file: File) {
    if (!file.name.toLowerCase().endsWith('.apkg')) {
      setStatus('error');
      setMessage('Please select a .apkg file exported from Anki.');
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setStatus('error');
      setMessage('File exceeds 50 MB limit.');
      return;
    }

    setStatus('uploading');
    setMessage('');

    const form = new FormData();
    form.append('file', file);

    try {
      const res = await fetch('/api/decks/import/anki', { method: 'POST', body: form });
      const data = await res.json() as { deckId?: string; cardCount?: number; error?: string };

      if (!res.ok) {
        setStatus('error');
        setMessage(data.error ?? 'Import failed. Please try again.');
        return;
      }

      setResult({ deckId: data.deckId!, cardCount: data.cardCount! });
      setStatus('done');
    } catch {
      setStatus('error');
      setMessage('Network error. Please check your connection.');
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) void uploadFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) void uploadFile(file);
  }

  return (
    <Modal open={open} onClose={handleClose} title="Import from Anki" maxWidth="max-w-md">
      <div className="flex flex-col gap-5">
        {/* Info */}
        <p className="text-sm text-slate-500">
          Export a deck from Anki as <code className="bg-slate-100 px-1 rounded text-xs">.apkg</code>,
          then upload it here. Basic 2-field cards (Front / Back) are imported.
          Media files are not imported.
        </p>

        {/* Drop zone */}
        {status === 'idle' && (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            className={`flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed py-12 cursor-pointer transition-colors ${
              dragOver ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
            }`}
          >
            <div className="p-3 rounded-full bg-indigo-50">
              <Upload size={24} className="text-indigo-500" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-700">Drop .apkg file here</p>
              <p className="text-xs text-slate-400 mt-0.5">or click to browse · max 50 MB</p>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".apkg"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        )}

        {/* Uploading */}
        {status === 'uploading' && (
          <div className="flex flex-col items-center gap-4 py-10">
            <Loader2 size={32} className="animate-spin text-indigo-500" />
            <p className="text-sm text-slate-500">Parsing Anki file…</p>
          </div>
        )}

        {/* Success */}
        {status === 'done' && result && (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="p-3 rounded-full bg-emerald-50">
              <CheckCircle size={28} className="text-emerald-500" />
            </div>
            <div className="text-center">
              <p className="text-base font-bold text-slate-800">Import complete!</p>
              <p className="text-sm text-slate-500 mt-1">
                {result.cardCount.toLocaleString()} cards added to your library.
              </p>
            </div>
            <div className="flex gap-3 mt-2">
              <Button variant="secondary" onClick={reset}>Import another</Button>
              <Button onClick={() => onImported(result.deckId, result.cardCount)}>
                View deck
              </Button>
            </div>
          </div>
        )}

        {/* Error */}
        {status === 'error' && (
          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-100 px-4 py-3">
              <AlertCircle size={16} className="shrink-0 text-red-500 mt-0.5" />
              <p className="text-sm text-red-700">{message}</p>
            </div>
            <Button variant="secondary" onClick={reset} className="self-start">
              <X size={14} /> Try again
            </Button>
          </div>
        )}

        {/* Cancel */}
        {(status === 'idle' || status === 'error') && (
          <div className="flex justify-end">
            <Button variant="secondary" onClick={handleClose}>Cancel</Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
