'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';

interface Props {
  packageId: string;
  label: string;
  price: string;
  credits: number;
  highlighted?: boolean;
}

export default function BuyCreditsButton({ packageId, label, price, credits, highlighted }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleBuy() {
    setLoading(true);
    try {
      const res = await fetch('/api/stripe/credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId }),
      });
      const { url } = await res.json() as { url?: string };
      if (url) window.location.href = url;
    } catch {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={() => void handleBuy()}
      disabled={loading}
      className={`flex items-center justify-between w-full rounded-xl px-4 py-3.5 border transition active:scale-95 disabled:opacity-60 ${
        highlighted
          ? 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-200'
          : 'bg-white text-gray-800 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50'
      }`}
    >
      <div className="text-left">
        <p className={`text-sm font-bold ${highlighted ? 'text-white' : 'text-gray-900'}`}>{label}</p>
        <p className={`text-xs mt-0.5 ${highlighted ? 'text-indigo-100' : 'text-gray-400'}`}>
          {(credits / (parseInt(price.replace('€', ''), 10))).toFixed(0)} credits per €1
        </p>
      </div>
      <div className="flex items-center gap-2">
        <span className={`text-base font-black ${highlighted ? 'text-white' : 'text-indigo-600'}`}>{price}</span>
        {loading && <Loader2 className="h-4 w-4 animate-spin opacity-70" />}
      </div>
    </button>
  );
}
