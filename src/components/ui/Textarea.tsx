import { type TextareaHTMLAttributes } from 'react';

interface Props extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export default function Textarea({ label, error, className = '', ...props }: Props) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-medium text-slate-700">{label}</label>}
      <textarea
        {...props}
        className={[
          'w-full rounded-lg border px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 resize-none',
          'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent',
          'transition-shadow',
          error ? 'border-red-400 bg-red-50' : 'border-slate-300 bg-white',
          className,
        ].join(' ')}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
