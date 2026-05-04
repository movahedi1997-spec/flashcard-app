'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';
import { Link } from '@/i18n/navigation';

interface Props {
  onClose: () => void;
}

export default function AuthGateModal({ onClose }: Props) {
  useEffect(() => {
    function handleKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Card */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-gate-title"
        className="relative z-10 w-full max-w-sm rounded-3xl bg-white p-8 shadow-2xl text-center animate-in fade-in zoom-in-95 duration-200"
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition"
        >
          <X size={18} />
        </button>

        {/* Icon */}
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-200">
          <span className="text-3xl leading-none">🔐</span>
        </div>

        <h2 id="auth-gate-title" className="text-xl font-bold text-gray-900 mb-2">
          Sign in to continue
        </h2>
        <p className="text-sm text-gray-500 leading-relaxed mb-6">
          Copy decks to your library, like posts, and connect with creators — all completely free.
        </p>

        <div className="space-y-3">
          <Link
            href="/signup"
            className="block w-full rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-700 active:scale-95"
          >
            Create free account
          </Link>
          <Link
            href="/login"
            className="block w-full rounded-xl border border-gray-200 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 active:scale-95"
          >
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
}
