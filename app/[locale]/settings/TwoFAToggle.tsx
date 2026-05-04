'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function TwoFAToggle({ initialEnabled }: { initialEnabled: boolean }) {
  const t = useTranslations('settings');
  const [enabled, setEnabled] = useState(initialEnabled);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [awaitingCode, setAwaitingCode] = useState(false);
  const [code, setCode] = useState('');

  async function toggle() {
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const res = await fetch('/api/account/2fa', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !enabled }),
        credentials: 'include',
      });
      const data = await res.json() as Record<string, unknown>;
      if (!res.ok) {
        setError((data.error as string) ?? t('errorSomethingWentWrong'));
        return;
      }
      if (data.requires_code) {
        setAwaitingCode(true);
        return;
      }
      setEnabled(data.two_fa_enabled as boolean);
      setSuccess(data.two_fa_enabled ? t('twoFAEnabled') : t('twoFADisabled'));
    } catch {
      setError(t('errorNetworkError'));
    } finally {
      setLoading(false);
    }
  }

  async function submitCode() {
    if (!/^\d{6}$/.test(code.trim())) {
      setError(t('error2FACode'));
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/account/2fa', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: false, code: code.trim() }),
        credentials: 'include',
      });
      const data = await res.json() as Record<string, unknown>;
      if (!res.ok) {
        setError((data.error as string) ?? t('errorInvalidCode'));
        return;
      }
      setEnabled(false);
      setAwaitingCode(false);
      setCode('');
      setSuccess(t('twoFADisabled'));
    } catch {
      setError(t('errorNetworkError'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-800">
            {t('twoFactor')}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {enabled ? t('twoFAEnabledDesc') : t('twoFADisabledDesc')}
          </p>
        </div>
        <button
          onClick={toggle}
          disabled={loading || awaitingCode}
          aria-pressed={enabled}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${
            enabled ? 'bg-indigo-600' : 'bg-gray-200'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
              enabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {awaitingCode && (
        <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4 space-y-3">
          <p className="text-sm text-indigo-700">
            {t('twoFACodePrompt')}
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="123456"
              className="w-32 rounded-xl border border-indigo-200 px-3 py-2 text-sm text-center font-mono tracking-widest outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
            <button
              onClick={submitCode}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {t('confirm')}
            </button>
            <button
              onClick={() => { setAwaitingCode(false); setCode(''); setError(''); }}
              className="rounded-xl px-4 py-2 text-sm text-gray-500 hover:bg-gray-100"
            >
              {t('cancel')}
            </button>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-emerald-600">{success}</p>}
    </div>
  );
}
