'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MailCheck, Loader2, RefreshCw } from 'lucide-react';
import FlashLogoMark from '@/components/FlashLogoMark';
import { useTranslations } from 'next-intl';

export default function VerifyEmailPage() {
  const t = useTranslations('auth.verifyEmail');
  const router = useRouter();
  const [code, setCode]       = useState(['', '', '', '', '', '']);
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent]   = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => { inputs.current[0]?.focus(); }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  function handleDigit(idx: number, val: string) {
    const digit = val.replace(/\D/g, '').slice(-1);
    const next = [...code];
    next[idx] = digit;
    setCode(next);
    setError('');
    if (digit && idx < 5) inputs.current[idx + 1]?.focus();
    if (next.every((d) => d !== '')) void submit(next.join(''));
  }

  function handleKeyDown(idx: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !code[idx] && idx > 0) inputs.current[idx - 1]?.focus();
  }

  function handlePaste(e: React.ClipboardEvent) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setCode(pasted.split(''));
      inputs.current[5]?.focus();
      void submit(pasted);
    }
    e.preventDefault();
  }

  async function submit(fullCode: string) {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: fullCode }),
        credentials: 'include',
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) {
        setError(data.error ?? t('errorInvalidCode'));
        setCode(['', '', '', '', '', '']);
        inputs.current[0]?.focus();
      } else {
        router.replace('/onboarding');
      }
    } catch {
      setError(t('errorNetwork'));
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setResending(true);
    setResent(false);
    try {
      const res = await fetch('/api/auth/resend-otp', { method: 'POST', credentials: 'include' });
      if (res.ok) {
        setResent(true);
        setCooldown(60);
      } else {
        const data = await res.json() as { error?: string };
        setError(data.error ?? t('errorResend'));
      }
    } catch {
      setError(t('errorNetwork'));
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4"
      style={{
        backgroundImage: `linear-gradient(rgba(156,163,175,.15) 1px,transparent 1px),linear-gradient(90deg,rgba(156,163,175,.15) 1px,transparent 1px)`,
        backgroundSize: '28px 28px',
      }}
    >
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2.5 font-bold text-gray-900 text-xl">
            <FlashLogoMark size={32} />
            Flashcard<span className="text-violet-600">AI</span>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
          <div className="flex justify-center mb-5">
            <div className="h-14 w-14 rounded-2xl bg-indigo-50 flex items-center justify-center">
              <MailCheck className="h-7 w-7 text-indigo-600" />
            </div>
          </div>

          <h1 className="text-xl font-bold text-gray-900 text-center mb-1">{t('title')}</h1>
          <p className="text-sm text-gray-500 text-center mb-8">{t('subtitle')}</p>

          <div className="flex gap-2 justify-center mb-6" onPaste={handlePaste}>
            {code.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { inputs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigit(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className="w-11 h-13 text-center text-xl font-bold rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition"
                style={{ height: '3.25rem' }}
                disabled={loading}
              />
            ))}
          </div>

          {error && (
            <p className="text-sm text-red-600 text-center mb-4 rounded-xl bg-red-50 border border-red-100 px-3 py-2">{error}</p>
          )}

          <button
            onClick={() => void submit(code.join(''))}
            disabled={loading || code.some((d) => !d)}
            className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 active:scale-95 disabled:opacity-50"
          >
            {loading
              ? <span className="flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> {t('submitting')}</span>
              : t('submit')}
          </button>

          <div className="mt-5 text-center">
            {resent && <p className="text-xs text-emerald-600 mb-2">{t('resentSuccess')}</p>}
            <button
              onClick={() => void handleResend()}
              disabled={resending || cooldown > 0}
              className="text-sm text-indigo-600 hover:underline disabled:opacity-40 inline-flex items-center gap-1.5"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              {cooldown > 0 ? t('resendIn', { cooldown }) : resending ? t('sending') : t('resend')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
