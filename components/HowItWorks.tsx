import { useTranslations } from 'next-intl';

export default function HowItWorks() {
  const t = useTranslations('home.howItWorks');

  const STEPS = [
    {
      num: '01',
      emoji: '✏️',
      title: t('step1Title'),
      description: t('step1Desc'),
    },
    {
      num: '02',
      emoji: '🧠',
      title: t('step2Title'),
      description: t('step2Desc'),
    },
    {
      num: '03',
      emoji: '📈',
      title: t('step3Title'),
      description: t('step3Desc'),
    },
  ];

  return (
    <section id="how-it-works" className="relative overflow-hidden bg-white py-24">

      {/* Graph paper background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(99, 102, 241, 0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99, 102, 241, 0.06) 1px, transparent 1px)
          `,
          backgroundSize: '32px 32px',
        }}
      />
      {/* Fade edges */}
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white via-transparent to-white" />

      <div className="relative mx-auto max-w-6xl px-6">
        {/* Heading */}
        <div className="mb-20 text-center">
          <span className="mb-3 inline-block rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
            {t('badge')}
          </span>
          <h2 className="text-4xl font-black tracking-tight text-gray-900 sm:text-5xl">
            {t('heading')}<br />
            <span className="gradient-text">{t('headingAccent')}</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-gray-500">
            {t('subtext')}
          </p>
        </div>

        {/* Steps */}
        <div className="grid gap-8 lg:grid-cols-3 lg:gap-12">
          {STEPS.map(({ num, emoji, title, description }, i) => (
            <div key={num} className="relative flex flex-col">
              {/* Connector — desktop */}
              {i < STEPS.length - 1 && (
                <div
                  aria-hidden
                  className="absolute top-8 left-[calc(100%+1.5rem)] hidden h-px w-[calc(100%-3rem)] border-t-2 border-dashed border-indigo-100 lg:block"
                  style={{ width: 'calc(100% - 3rem)' }}
                />
              )}

              {/* Number + emoji */}
              <div className="mb-6 flex items-center gap-4">
                <div className="relative flex-shrink-0">
                  <span className="absolute -top-2 -start-2 text-5xl font-black text-gray-100 select-none leading-none">
                    {num}
                  </span>
                  <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-2xl shadow-lg shadow-gray-200/80 ring-1 ring-gray-100">
                    {emoji}
                  </div>
                </div>
                <h3 className="text-lg font-bold text-gray-900">{title}</h3>
              </div>

              <p className="text-sm leading-relaxed text-gray-500">{description}</p>

              {/* Mini card mockup */}
              <div
                className="mt-6 rounded-2xl border border-gray-100 bg-white p-4 shadow-lg shadow-gray-100/80"
                style={{ transform: 'perspective(700px) rotateX(3deg) rotateY(-3deg)' }}
              >
                {num === '01' && (
                  <>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-600">New deck</span>
                      <span className="text-[10px] text-gray-300">0 cards</span>
                    </div>
                    <div className="space-y-1.5">
                      {['Add your first card…', '', ''].map((text, j) => (
                        <div key={j} className={`h-6 rounded-lg ${j === 0 ? 'bg-gray-100' : 'bg-gray-50'} flex items-center px-3`}>
                          <span className="text-[10px] text-gray-400">{text}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
                {num === '02' && (
                  <>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1">Daily Review · 5 due</p>
                    <p className="text-xs font-bold text-gray-900 mb-2">What is the half-life of Digoxin?</p>
                    <div className="grid grid-cols-4 gap-1">
                      {['Again','Hard','Good','Easy'].map(l => (
                        <div key={l} className="rounded-lg bg-gray-50 py-1.5 text-center text-[10px] font-semibold text-gray-500">{l}</div>
                      ))}
                    </div>
                  </>
                )}
                {num === '03' && (
                  <>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2">This week</p>
                    <div className="flex items-end gap-1 h-10">
                      {[3,5,4,7,6,8,5].map((h, j) => (
                        <div key={j} className="flex-1 rounded-sm bg-indigo-500/20" style={{ height: `${h * 10}%` }} />
                      ))}
                    </div>
                    <p className="mt-2 text-[10px] text-gray-400">🔥 7-day streak · 89% retention</p>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
