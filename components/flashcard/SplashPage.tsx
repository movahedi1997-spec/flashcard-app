'use client';

import { useEffect } from 'react';
import { Sparkles, Import, Brain, Globe } from 'lucide-react';

interface Props {
  onStart: () => void;
  isFirstVisit?: boolean; // true when user has 0 decks
}

const FEATURES = [
  { icon: <Sparkles size={13} />, label: 'AI card generation' },
  { icon: <Import   size={13} />, label: 'Anki import' },
  { icon: <Brain    size={13} />, label: 'Spaced repetition' },
  { icon: <Globe    size={13} />, label: '5 languages' },
];

export default function SplashPage({ onStart, isFirstVisit = false }: Props) {
  const delay = isFirstVisit ? 2500 : 1800;

  useEffect(() => {
    const t = setTimeout(onStart, delay);
    return () => clearTimeout(t);
  }, [onStart, delay]);

  return (
    // Any tap/click skips the wait immediately
    <div
      className="min-h-screen bg-gradient-to-br from-indigo-950 via-indigo-900 to-purple-950 flex items-center justify-center relative overflow-hidden cursor-pointer select-none"
      onClick={onStart}
    >
      {/* Ambient blobs */}
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl" />
      </div>

      {/* Floating ghost cards */}
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none hidden sm:block">
        <div className="card-drift-1 absolute top-8 left-10 w-36 h-22 bg-white/8 backdrop-blur-sm rounded-2xl border border-white/15 p-3">
          <div className="h-2 bg-indigo-400/40 rounded mb-2 w-3/4" />
          <div className="h-2 bg-white/20 rounded mb-1.5 w-full" />
          <div className="h-2 bg-white/20 rounded w-2/3" />
        </div>
        <div className="card-drift-2 absolute top-20 right-14 w-44 h-28 bg-white/8 backdrop-blur-sm rounded-2xl border border-white/15 p-3">
          <div className="h-2 bg-purple-400/40 rounded mb-2 w-1/2" />
          <div className="h-16 bg-white/10 rounded-xl flex items-center justify-center">
            <Sparkles size={20} className="text-white/30" />
          </div>
        </div>
        <div className="card-drift-3 absolute bottom-24 left-14 w-40 h-24 bg-white/8 backdrop-blur-sm rounded-2xl border border-white/15 p-3 hidden md:block">
          <div className="h-2 bg-indigo-300/40 rounded mb-2 w-2/3" />
          <div className="h-2 bg-white/20 rounded mb-1.5 w-full" />
          <div className="h-2 bg-white/20 rounded w-3/4" />
        </div>
        <div className="card-drift-2 absolute bottom-12 right-20 w-36 h-24 bg-white/8 backdrop-blur-sm rounded-2xl border border-white/15 p-3 hidden md:block">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-5 h-5 rounded bg-emerald-400/40" />
            <div className="h-2 bg-white/20 rounded flex-1" />
          </div>
          <div className="h-2 bg-white/20 rounded mb-1.5 w-full" />
          <div className="h-2 bg-white/20 rounded w-1/2" />
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-lg mx-auto gap-7">
        {/* Logo */}
        <div className="splash-s0 logo-float">
          <div className="p-5 rounded-3xl bg-white/10 border border-white/20 backdrop-blur-sm shadow-2xl">
            <Brain size={52} className="text-white" />
          </div>
        </div>

        {/* Headline */}
        <div className="splash-s1 flex flex-col items-center gap-2">
          <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight shimmer-text">
            FlashcardAI
          </h1>
          <p className="text-indigo-200 text-lg sm:text-xl font-light tracking-wide">
            {isFirstVisit ? 'Your AI-powered study companion' : 'Study smarter. Remember longer.'}
          </p>
        </div>

        {/* Feature pills */}
        <div className="splash-s2 flex flex-wrap justify-center gap-2.5">
          {FEATURES.map((f) => (
            <div
              key={f.label}
              className="flex items-center gap-1.5 bg-white/10 border border-white/20 text-indigo-100 text-sm px-3 py-1.5 rounded-full backdrop-blur-sm"
            >
              {f.icon}
              <span>{f.label}</span>
            </div>
          ))}
        </div>

        {/* Progress bar + hint */}
        <div className="splash-s3 flex flex-col items-center gap-3 w-full max-w-xs">
          <div className="w-full h-0.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-400/70 rounded-full"
              style={{ animation: `progressBar ${delay}ms linear forwards` }}
            />
          </div>
          <p className="text-indigo-400/70 text-xs">Tap anywhere to skip</p>
        </div>
      </div>
    </div>
  );
}
