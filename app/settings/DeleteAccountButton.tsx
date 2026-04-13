'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, X, AlertTriangle } from 'lucide-react';

export default function DeleteAccountButton() {
  const router = useRouter();
  const [open, setOpen]               = useState(false);
  const [password, setPassword]       = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [reason, setReason]           = useState('');
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const inputRef                      = useRef<HTMLInputElement>(null);

  const reasonTrimmed  = reason.trim();
  const canSubmit      = password && confirmPassword && reasonTrimmed.length >= 6;

  function openModal() {
    setPassword('');
    setConfirmPassword('');
    setReason('');
    setError('');
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function closeModal() {
    if (loading) return;
    setOpen(false);
    setPassword('');
    setConfirmPassword('');
    setReason('');
    setError('');
  }

  async function handleDelete() {
    if (!password || !confirmPassword) {
      setError('Please enter and confirm your password.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (reasonTrimmed.length < 6) {
      setError('Please provide a reason (at least 6 characters).');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ password }),
      });
      const data = await res.json() as { error?: string };

      if (!res.ok) {
        setError(data.error ?? 'Something went wrong. Please try again.');
        return;
      }

      // Account deleted — redirect to home
      router.push('/?deleted=1');
      router.refresh();
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={openModal}
        className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-100 hover:border-red-300"
      >
        <Trash2 className="h-4 w-4" />
        Delete my account
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={closeModal}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-600 shrink-0">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">Delete account</h2>
                  <p className="text-xs text-gray-500">This action cannot be undone</p>
                </div>
              </div>
              <button
                onClick={closeModal}
                disabled={loading}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition disabled:opacity-40"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Warning */}
            <div className="mb-5 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700 leading-relaxed">
              This will permanently delete your account and <strong>all associated data</strong> —
              decks, cards, study history, and SRS progress. There is no way to recover this.
            </div>

            {/* Password */}
            <label htmlFor="delete-password" className="mb-1.5 block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="delete-password"
              ref={inputRef}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={loading}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-100 disabled:opacity-50 mb-4"
            />

            {/* Confirm password */}
            <label htmlFor="delete-password-confirm" className="mb-1.5 block text-sm font-medium text-gray-700">
              Confirm password
            </label>
            <input
              id="delete-password-confirm"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              disabled={loading}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-100 disabled:opacity-50 mb-4"
            />

            {/* Reason */}
            <label htmlFor="delete-reason" className="mb-1.5 block text-sm font-medium text-gray-700">
              Why are you deleting your account?{' '}
              <span className="text-gray-400 font-normal">(min. 6 characters)</span>
            </label>
            <textarea
              id="delete-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. I no longer need this service…"
              disabled={loading}
              rows={3}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-100 disabled:opacity-50 resize-none mb-1"
            />
            <p className={`text-xs mb-3 ${reasonTrimmed.length >= 6 ? 'text-gray-400' : 'text-red-400'}`}>
              {reasonTrimmed.length}/6 minimum
            </p>

            {error && (
              <p className="mb-3 text-sm text-red-600">{error}</p>
            )}

            {/* Actions */}
            <div className="flex gap-3 mt-2">
              <button
                onClick={closeModal}
                disabled={loading}
                className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => void handleDelete()}
                disabled={loading || !canSubmit}
                className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Deleting…' : 'Yes, delete everything'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
