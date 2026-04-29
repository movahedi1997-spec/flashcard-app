import { BookOpen, Zap, BarChart2, ImageIcon } from 'lucide-react';

interface Props {
  onStart: () => void;
}

export default function SplashPage({ onStart }: Props) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-indigo-900 to-purple-950 flex items-center justify-center relative overflow-hidden">
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none select-none overflow-hidden">
        <div className="card-drift-1 absolute -top-4 left-8 w-36 h-24 bg-white/8 backdrop-blur-sm rounded-2xl border border-white/15 p-3 hidden sm:block">
          <div className="h-2 bg-indigo-400/40 rounded mb-2 w-3/4" />
          <div className="h-2 bg-white/20 rounded mb-1.5 w-full" />
          <div className="h-2 bg-white/20 rounded w-2/3" />
        </div>
        <div className="card-drift-2 absolute top-16 right-12 w-44 h-28 bg-white/8 backdrop-blur-sm rounded-2xl border border-white/15 p-3 hidden sm:block">
          <div className="h-2 bg-purple-400/40 rounded mb-2 w-1/2" />
          <div className="h-16 bg-white/10 rounded-xl" />
        </div>
        <div className="card-drift-3 absolute bottom-20 left-16 w-40 h-26 bg-white/8 backdrop-blur-sm rounded-2xl border border-white/15 p-3 hidden md:block">
          <div className="h-2 bg-indigo-300/40 rounded mb-2 w-2/3" />
          <div className="h-2 bg-white/20 rounded mb-1.5 w-full" />
          <div className="h-2 bg-white/20 rounded w-3/4" />
        </div>
        <div className="card-drift-2 absolute bottom-10 right-20 w-36 h-24 bg-white/8 backdrop-blur-sm rounded-2xl border border-white/15 p-3 hidden md:block">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-5 h-5 rounded bg-emerald-400/40" />
            <div className="h-2 bg-white/20 rounded flex-1" />
          </div>
          <div className="h-2 bg-white/20 rounded mb-1.5 w-full" />
          <div className="h-2 bg-white/20 rounded w-1/2" />
        </div>
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-xl mx-auto gap-8">
        <div className="splash-s0 logo-float">
          <div className="p-5 rounded-3xl bg-white/10 border border-white/20 backdrop-blur-sm shadow-2xl">
            <BookOpen size={52} className="text-white" />
          </div>
        </div>

        <div className="splash-s1 flex flex-col items-center gap-2">
          <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight shimmer-text">
            FlashCards
          </h1>
          <p className="text-indigo-200 text-lg sm:text-xl font-light tracking-wide">
            Study smarter. Remember longer.
          </p>
        </div>

        <div className="splash-s2 flex flex-wrap justify-center gap-3">
          {[
            { icon: <BookOpen size={14} />, label: 'Organize into boxes' },
            { icon: <Zap size={14} />, label: 'Turbo & adaptive modes' },
            { icon: <BarChart2 size={14} />, label: 'Score-based repetition' },
            { icon: <ImageIcon size={14} />, label: 'Image cards' },
          ].map(f => (
            <div key={f.label} className="flex items-center gap-1.5 bg-white/10 border border-white/20 text-indigo-100 text-sm px-3 py-1.5 rounded-full backdrop-blur-sm">
              {f.icon}
              <span>{f.label}</span>
            </div>
          ))}
        </div>

        <div className="splash-s3 flex flex-col items-center gap-3">
          <button
            onClick={onStart}
            className="group relative px-10 py-4 rounded-2xl text-base font-bold text-indigo-950 bg-white hover:bg-indigo-50 transition-all shadow-xl hover:shadow-indigo-500/30 hover:scale-105 active:scale-100 cursor-pointer"
          >
            <span className="relative z-10 flex items-center gap-2">
              Get Started
              <span className="text-xl group-hover:translate-x-1 transition-transform inline-block">→</span>
            </span>
          </button>
          <p className="text-indigo-400 text-xs">All data saved locally in your browser</p>
        </div>
      </div>
    </div>
  );
}
