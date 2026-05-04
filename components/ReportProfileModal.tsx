'use client';

import { useState } from 'react';
import { X, Flag } from 'lucide-react';

interface Props {
  reportedUserId: string;
  reportedName: string;
  onClose: () => void;
}

const REASONS = [
  { value: 'spam',          label: 'Spam' },
  { value: 'harassment',    label: 'Harassment or bullying' },
  { value: 'inappropriate', label: 'Inappropriate content' },
  { value: 'impersonation', label: 'Impersonation' },
  { value: 'other',         label: 'Other' },
] as const;

export default function ReportProfileModal({ reportedUserId, reportedName, onClose }: Props) {
  const [reason, setReason]           = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading]         = useState(false);
  const [done, setDone]               = useState(false);
  const [error, setError]             = useState('');

  async function submit() {
    if (!reason) { setError('Please select a reason.'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/reports/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportedUserId, reason, description: description.trim() || undefined }),
      });
      if (!res.ok) {
        const d = await res.json() as { error?: string };
        setError(d.error ?? 'Something went wrong.');
      } else {
        setDone(true);
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        {done ? (
          <div className="text-center py-4">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-50">
              <Flag className="h-5 w-5 text-green-600" />
            </div>
            <h2 className="text-base font-bold text-gray-900 mb-1">Report submitted</h2>
            <p className="text-sm text-gray-500">Our team will review this profile.</p>
            <button
              onClick={onClose}
              className="mt-5 w-full rounded-xl bg-gray-100 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2.5 mb-5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-50 text-red-500">
                <Flag size={15} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-gray-900">Report profile</h2>
                <p className="text-xs text-gray-400">@{reportedName}</p>
              </div>
            </div>

            <fieldset className="space-y-2 mb-4">
              <legend className="text-xs font-semibold text-gray-700 mb-2">Reason</legend>
              {REASONS.map(({ value, label }) => (
                <label
                  key={value}
                  className={`flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition-colors ${
                    reason === value
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="report-reason"
                    value={value}
                    checked={reason === value}
                    onChange={() => setReason(value)}
                    className="accent-indigo-600"
                  />
                  <span className="text-sm text-gray-700">{label}</span>
                </label>
              ))}
            </fieldset>

            <div className="mb-4">
              <label className="text-xs font-semibold text-gray-700 block mb-1.5">
                Additional details <span className="font-normal text-gray-400">(optional)</span>
              </label>
              <textarea
                rows={3}
                maxLength={500}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell us more..."
                className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition"
              />
            </div>

            {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

            <button
              onClick={submit}
              disabled={loading}
              className="w-full rounded-xl bg-red-500 py-2.5 text-sm font-bold text-white hover:bg-red-600 active:scale-95 transition disabled:opacity-60"
            >
              {loading ? 'Submitting…' : 'Submit report'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
