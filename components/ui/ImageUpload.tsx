'use client';

import { useRef, useState } from 'react';
import { ImageIcon, X, Upload } from 'lucide-react';

interface Props {
  label?: string;
  value?: string;
  onChange: (value: string | undefined) => void;
}

const MAX_SIZE_MB = 2;

export default function ImageUpload({ label, value, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');

  function processFile(file: File) {
    if (!file.type.startsWith('image/')) { setError('Please upload an image file.'); return; }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) { setError(`Image must be under ${MAX_SIZE_MB} MB.`); return; }
    setError('');
    const reader = new FileReader();
    reader.onload = e => onChange(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  }

  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-medium text-slate-700">{label}</label>}

      {value ? (
        <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-50 group">
          <img src={value} alt="Uploaded" className="w-full max-h-48 object-contain" />
          <button
            type="button"
            onClick={() => onChange(undefined)}
            className="absolute top-2 end-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-red-600 transition-colors cursor-pointer"
            title="Remove image"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={[
            'flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-5 cursor-pointer transition-colors',
            dragging
              ? 'border-indigo-400 bg-indigo-50'
              : 'border-slate-300 bg-slate-50 hover:border-indigo-400 hover:bg-indigo-50/50',
          ].join(' ')}
        >
          <div className="p-2 rounded-lg bg-white border border-slate-200 text-slate-400">
            {dragging ? <Upload size={18} /> : <ImageIcon size={18} />}
          </div>
          <p className="text-xs text-slate-500">
            <span className="font-medium text-indigo-600">Click to upload</span> or drag &amp; drop
          </p>
          <p className="text-xs text-slate-400">PNG, JPG, GIF, WebP · max {MAX_SIZE_MB} MB</p>
        </div>
      )}

      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleChange} />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
