import { Smartphone, Download, Star } from 'lucide-react';

export default function AppDownload() {
  return (
    <section className="relative overflow-hidden bg-slate-950 py-24">
      {/* Subtle grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M40 0v40M0 0h40' stroke='%23fff' stroke-width='0.5'/%3E%3C/svg%3E")`,
          backgroundSize: '40px 40px',
        }}
      />
      {/* Glow */}
      <div aria-hidden className="pointer-events-none absolute -bottom-32 right-1/4 h-[500px] w-[500px] rounded-full bg-indigo-600/20 blur-3xl" />

      <div className="relative mx-auto max-w-6xl px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">

          {/* ── Left: copy ───────────────────────────────────────────────── */}
          <div>
            {/* Badge */}
            <div className="mb-6">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-300">
                <Smartphone className="h-3.5 w-3.5" />
                Android App — Free
              </span>
            </div>

            <h2 className="text-4xl font-black leading-[1.1] tracking-tight text-white sm:text-5xl">
              Study anywhere.
              <br />
              <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                Even offline.
              </span>
            </h2>

            <p className="mt-5 text-lg leading-relaxed text-slate-400 max-w-md">
              The full FlashcardAI experience — all your decks, spaced repetition, and quizzes — now in your pocket. No browser required.
            </p>

            {/* Feature chips */}
            <div className="mt-6 flex flex-wrap gap-2">
              {[
                'Offline study',
                'SRS flashcards',
                'Quiz mode',
                'Dashboard stats',
                'Sync with web',
              ].map((f) => (
                <span
                  key={f}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-300"
                >
                  {f}
                </span>
              ))}
            </div>

            {/* Download buttons */}
            <div className="mt-10 flex flex-wrap items-center gap-4">
              {/* APK direct download */}
              <a
                href="/downloads/flashcardai.apk"
                download
                className="group inline-flex items-center gap-3 rounded-2xl bg-indigo-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-900/50 transition hover:bg-indigo-500 active:scale-[0.98]"
              >
                <Download className="h-5 w-5 transition group-hover:-translate-y-0.5" />
                <div className="text-left">
                  <p className="text-[10px] font-normal leading-none opacity-80">Download APK</p>
                  <p className="text-sm font-bold">Android App</p>
                </div>
              </a>

              {/* Google Play — coming soon */}
              <div className="inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-6 py-3.5 opacity-50 cursor-not-allowed select-none">
                <svg viewBox="0 0 24 24" className="h-5 w-5 fill-white" aria-hidden>
                  <path d="M3.18 23.76a2 2 0 0 0 2.08-.22l12.19-7.04-2.76-2.77zM.5 1.1A2 2 0 0 0 0 2.44v19.12a2 2 0 0 0 .5 1.34L.6 22.9l10.72-10.72V12L.6 1.28z"/>
                  <path d="m22.22 10.38-3.05-1.76-3.06 3.06 3.06 3.06 3.07-1.78a2 2 0 0 0 0-2.58z"/>
                  <path d="M3.18.24 14.49 7.28l-2.76 2.77L3.18.24z"/>
                </svg>
                <div className="text-left">
                  <p className="text-[10px] font-normal leading-none text-white/80">Coming soon</p>
                  <p className="text-sm font-bold text-white">Google Play</p>
                </div>
              </div>
            </div>

            {/* Trust line */}
            <p className="mt-5 flex items-center gap-1.5 text-xs text-slate-500">
              <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
              Free · No ads · Same account as web
            </p>
          </div>

          {/* ── Right: phone mockup ───────────────────────────────────────── */}
          <div className="flex justify-center lg:justify-end">
            <div className="relative w-64 select-none">
              {/* Phone frame */}
              <div className="relative mx-auto w-64 rounded-[2.5rem] border border-white/10 bg-slate-800 p-3 shadow-2xl shadow-black/60">
                {/* Notch */}
                <div className="absolute top-5 left-1/2 -translate-x-1/2 h-5 w-24 rounded-full bg-slate-950 z-10" />

                {/* Screen */}
                <div className="overflow-hidden rounded-[2rem] bg-white">
                  {/* App header */}
                  <div className="bg-indigo-600 px-4 pt-8 pb-4">
                    <p className="text-[10px] font-semibold text-indigo-200 uppercase tracking-wider">Today</p>
                    <p className="mt-1 text-xl font-black text-white">12 cards due</p>
                  </div>

                  {/* Deck cards */}
                  <div className="p-3 space-y-2 bg-gray-50">
                    {[
                      { emoji: '🧬', title: 'Biochemistry', due: 5, color: 'bg-emerald-500' },
                      { emoji: '⚖️', title: 'Contract Law',  due: 4, color: 'bg-amber-500'  },
                      { emoji: '📐', title: 'Calculus II',   due: 3, color: 'bg-indigo-500' },
                    ].map((d) => (
                      <div key={d.title} className="flex items-center gap-2.5 rounded-xl bg-white p-3 shadow-sm">
                        <div className={`${d.color} h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0`}>
                          <span className="text-sm">{d.emoji}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-bold text-gray-800 truncate">{d.title}</p>
                          <p className="text-[10px] text-gray-400">{d.due} due</p>
                        </div>
                        <div className="rounded-full bg-indigo-50 px-2 py-0.5">
                          <p className="text-[10px] font-bold text-indigo-600">{d.due}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Grade buttons preview */}
                  <div className="grid grid-cols-4 gap-1 px-3 pb-3 bg-gray-50">
                    {[
                      { l: 'Again', c: 'bg-red-100 text-red-500'     },
                      { l: 'Hard',  c: 'bg-orange-100 text-orange-500' },
                      { l: 'Good',  c: 'bg-green-100 text-green-500'  },
                      { l: 'Easy',  c: 'bg-blue-100 text-blue-500'    },
                    ].map(({ l, c }) => (
                      <div key={l} className={`${c} rounded-lg py-1.5 text-center`}>
                        <p className="text-[9px] font-bold">{l}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Floating badge */}
              <div className="absolute -right-4 top-1/3 rounded-2xl border border-white/10 bg-slate-700 px-3 py-2 shadow-xl text-center">
                <p className="text-xs font-black text-white">100%</p>
                <p className="text-[10px] text-slate-400">Free</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
