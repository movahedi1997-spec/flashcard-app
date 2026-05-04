'use client';

import { useEffect, useState } from 'react';
import { Flame, BookOpen, TrendingUp, Brain, Loader2, AlertCircle, Target } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface SRSStats {
  streak: number;
  totalReviews: number;
  retentionRate: number;
  cardsByMaturity: { new: number; learning: number; young: number; mature: number };
  forecast: Array<{ date: string; label: string; count: number }>;
  heatmap: Array<{ date: string; count: number }>;
  easeAvg: number;
}

interface DeckMaturity {
  id: string;
  title: string;
  color: string;
  emoji: string;
  new: number;
  learning: number;
  young: number;
  mature: number;
  dueToday: number;
  totalCards: number;
}

interface DeckStats {
  decks: DeckMaturity[];
  weeklyAccuracy: Array<{ week: string; rate: number }>;
  examReadiness: number;
}

// ── Heatmap ───────────────────────────────────────────────────────────────────

function Heatmap({ data, less, more }: { data: Array<{ date: string; count: number }>; less: string; more: string }) {
  const max = Math.max(1, ...data.map((d) => d.count));

  function cellColor(count: number) {
    if (count === 0) return 'bg-gray-100';
    const pct = count / max;
    if (pct < 0.25) return 'bg-indigo-200';
    if (pct < 0.5)  return 'bg-indigo-400';
    if (pct < 0.75) return 'bg-indigo-500';
    return 'bg-indigo-700';
  }

  const weeks: Array<typeof data> = [];
  for (let i = 0; i < data.length; i += 7) {
    weeks.push(data.slice(i, i + 7));
  }

  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-1 min-w-0">
        {/* Day labels */}
        <div className="flex flex-col gap-1 me-1 pt-5">
          {dayLabels.map((d) => (
            <div key={d} className="h-3 text-[10px] text-gray-400 leading-3">{d}</div>
          ))}
        </div>
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            <div className="h-4 text-[10px] text-gray-400">
              {week[0]?.date.endsWith('-01') ? week[0].date.slice(5, 7) === '01'
                ? 'Jan' : ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][parseInt(week[0].date.slice(5, 7), 10)]
                : ''}
            </div>
            {week.map((day) => (
              <div
                key={day.date}
                title={`${day.date}: ${day.count} reviews`}
                className={`h-3 w-3 rounded-sm ${cellColor(day.count)} cursor-default`}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-1.5 mt-3 text-xs text-gray-400">
        <span>{less}</span>
        {['bg-gray-100','bg-indigo-200','bg-indigo-400','bg-indigo-500','bg-indigo-700'].map((c) => (
          <div key={c} className={`h-3 w-3 rounded-sm ${c}`} />
        ))}
        <span>{more}</span>
      </div>
    </div>
  );
}

// ── Forecast bar chart ────────────────────────────────────────────────────────

function ForecastChart({ data, todayLabel, tmrwLabel }: { data: Array<{ label: string; count: number }>; todayLabel: string; tmrwLabel: string }) {
  const max = Math.max(1, ...data.map((d) => d.count));

  return (
    <div className="flex items-end gap-1 h-28">
      {data.map((d, i) => {
        const isToday = i === 0;
        const heightPct = Math.max(4, (d.count / max) * 100);
        return (
          <div key={d.label} className="flex flex-col items-center gap-1 flex-1 min-w-0">
            <span className="text-[9px] text-gray-400 font-medium">{d.count > 0 ? d.count : ''}</span>
            <div
              title={`${d.label}: ${d.count} cards due`}
              className={`w-full rounded-t-sm transition-all ${isToday ? 'bg-indigo-500' : 'bg-indigo-200'}`}
              style={{ height: `${heightPct}%` }}
            />
            <span className={`text-[9px] truncate w-full text-center ${isToday ? 'text-indigo-600 font-bold' : 'text-gray-400'}`}>
              {i === 0 ? todayLabel : i === 1 ? tmrwLabel : d.label.split(' ')[1] ? d.label.split(' ')[1] : d.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Maturity bar ──────────────────────────────────────────────────────────────

function MaturityBar({ cardsByMaturity, labels, noCardsYet }: {
  cardsByMaturity: SRSStats['cardsByMaturity'];
  labels: { new: string; learning: string; young: string; mature: string };
  noCardsYet: string;
}) {
  const total = Object.values(cardsByMaturity).reduce((a, b) => a + b, 0);
  if (total === 0) return <p className="text-sm text-gray-400">{noCardsYet}</p>;

  const segments = [
    { label: labels.new,      count: cardsByMaturity.new,      color: 'bg-blue-400'    },
    { label: labels.learning, count: cardsByMaturity.learning,  color: 'bg-amber-400'   },
    { label: labels.young,    count: cardsByMaturity.young,     color: 'bg-indigo-400'  },
    { label: labels.mature,   count: cardsByMaturity.mature,    color: 'bg-emerald-500' },
  ];

  return (
    <div className="space-y-3">
      <div className="flex rounded-full overflow-hidden h-4 gap-0.5">
        {segments.map((s) =>
          s.count > 0 ? (
            <div
              key={s.label}
              className={`${s.color} transition-all`}
              style={{ width: `${(s.count / total) * 100}%` }}
              title={`${s.label}: ${s.count}`}
            />
          ) : null
        )}
      </div>
      <div className="flex flex-wrap gap-3">
        {segments.map((s) => (
          <div key={s.label} className="flex items-center gap-1.5 text-xs text-gray-600">
            <div className={`h-2.5 w-2.5 rounded-full ${s.color}`} />
            <span>{s.label}</span>
            <span className="font-semibold text-gray-800">{s.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Retention gauge ───────────────────────────────────────────────────────────

function RetentionGauge({ rate, excellent, good, needsWork, last30Days }: {
  rate: number;
  excellent: string;
  good: string;
  needsWork: string;
  last30Days: string;
}) {
  const color = rate >= 80 ? 'text-emerald-600' : rate >= 60 ? 'text-amber-500' : 'text-red-500';
  const label = rate >= 80 ? excellent : rate >= 60 ? good : needsWork;
  const circumference = 2 * Math.PI * 36;
  const progress = (rate / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative">
        <svg width="96" height="96" viewBox="0 0 96 96">
          <circle cx="48" cy="48" r="36" fill="none" stroke="#e2e8f0" strokeWidth="8" />
          <circle
            cx="48" cy="48" r="36" fill="none"
            stroke={rate >= 80 ? '#10b981' : rate >= 60 ? '#f59e0b' : '#ef4444'}
            strokeWidth="8"
            strokeDasharray={`${progress} ${circumference}`}
            strokeLinecap="round"
            transform="rotate(-90 48 48)"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-xl font-black ${color}`}>{rate}%</span>
        </div>
      </div>
      <span className={`text-xs font-semibold ${color}`}>{label}</span>
      <span className="text-xs text-gray-400">{last30Days}</span>
    </div>
  );
}

// ── Exam Readiness gauge ──────────────────────────────────────────────────────

function ExamReadiness({ score }: { score: number }) {
  const color = score >= 75 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';
  const label = score >= 75 ? 'Exam Ready' : score >= 50 ? 'Getting There' : 'Keep Studying';
  const circumference = 2 * Math.PI * 40;
  const progress = (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <svg width="100" height="100" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" fill="none" stroke="#e2e8f0" strokeWidth="10" />
          <circle
            cx="50" cy="50" r="40" fill="none"
            stroke={color}
            strokeWidth="10"
            strokeDasharray={`${progress} ${circumference}`}
            strokeLinecap="round"
            transform="rotate(-90 50 50)"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-black" style={{ color }}>{score}</span>
          <span className="text-[9px] text-gray-400">/100</span>
        </div>
      </div>
      <span className="text-xs font-semibold" style={{ color }}>{label}</span>
      <span className="text-[11px] text-gray-400 text-center max-w-[120px]">
        Based on retention, maturity & streak
      </span>
    </div>
  );
}

// ── Weekly accuracy trend ─────────────────────────────────────────────────────

function AccuracyTrend({ data }: { data: Array<{ week: string; rate: number }> }) {
  if (data.length === 0) {
    return <p className="text-sm text-gray-400">No review data yet.</p>;
  }
  const max = 100;

  return (
    <div className="flex items-end gap-1.5 h-24">
      {data.map((d, i) => {
        const heightPct = Math.max(4, (d.rate / max) * 100);
        const color = d.rate >= 80 ? 'bg-emerald-400' : d.rate >= 60 ? 'bg-amber-400' : 'bg-red-400';
        const isLast = i === data.length - 1;
        return (
          <div key={d.week} className="flex flex-col items-center gap-1 flex-1 min-w-0">
            <span className="text-[9px] text-gray-400">{d.rate > 0 ? `${d.rate}%` : ''}</span>
            <div
              title={`${d.week}: ${d.rate}% accuracy`}
              className={`w-full rounded-t-sm transition-all ${color} ${isLast ? 'opacity-100' : 'opacity-70'}`}
              style={{ height: `${heightPct}%` }}
            />
            <span className="text-[8px] text-gray-400 truncate w-full text-center">{d.week.split(' ')[1] ?? ''}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Per-deck progress bars ────────────────────────────────────────────────────

function DeckProgressList({ decks }: { decks: DeckMaturity[] }) {
  if (decks.length === 0) {
    return <p className="text-sm text-gray-400">No decks yet.</p>;
  }

  const PALETTE: Record<string, string> = {
    indigo: 'bg-indigo-500', emerald: 'bg-emerald-500', amber: 'bg-amber-500',
    rose: 'bg-rose-500', sky: 'bg-sky-500', violet: 'bg-violet-500',
    fuchsia: 'bg-fuchsia-500', teal: 'bg-teal-500',
  };

  return (
    <div className="flex flex-col gap-4">
      {decks.filter((d) => d.totalCards > 0).map((deck) => {
        const total = deck.new + deck.learning + deck.young + deck.mature;
        const maturePct = total > 0 ? Math.round((deck.mature / total) * 100) : 0;
        const accentBg = PALETTE[deck.color] ?? 'bg-indigo-500';

        return (
          <div key={deck.id}>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-base">{deck.emoji}</span>
                <span className="text-sm font-medium text-gray-700 truncate">{deck.title}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {deck.dueToday > 0 && (
                  <span className="text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded-full">
                    {deck.dueToday} due
                  </span>
                )}
                <span className="text-xs text-gray-400">{maturePct}% mature</span>
              </div>
            </div>
            <div className="flex rounded-full overflow-hidden h-2.5 bg-gray-100 gap-0.5">
              {deck.new > 0 && (
                <div className="bg-blue-400 transition-all" style={{ width: `${(deck.new / total) * 100}%` }} title={`New: ${deck.new}`} />
              )}
              {deck.learning > 0 && (
                <div className="bg-amber-400 transition-all" style={{ width: `${(deck.learning / total) * 100}%` }} title={`Learning: ${deck.learning}`} />
              )}
              {deck.young > 0 && (
                <div className={`${accentBg} opacity-60 transition-all`} style={{ width: `${(deck.young / total) * 100}%` }} title={`Young: ${deck.young}`} />
              )}
              {deck.mature > 0 && (
                <div className={`${accentBg} transition-all`} style={{ width: `${(deck.mature / total) * 100}%` }} title={`Mature: ${deck.mature}`} />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function SRSStatsClient() {
  const t = useTranslations('stats');
  const [stats, setStats] = useState<SRSStats | null>(null);
  const [deckStats, setDeckStats] = useState<DeckStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      fetch('/api/stats/srs').then((r) => r.json()) as Promise<SRSStats>,
      fetch('/api/stats/decks').then((r) => r.json()) as Promise<DeckStats>,
    ])
      .then(([srs, decks]) => { setStats(srs); setDeckStats(decks); })
      .catch(() => setError(t('errorLoad')))
      .finally(() => setLoading(false));
  }, [t]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 gap-3 text-gray-400">
        <Loader2 size={22} className="animate-spin" />
        <span className="text-sm">{t('loading')}</span>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-red-600 text-sm">
        <AlertCircle size={16} /> {error || t('errorGeneric')}
      </div>
    );
  }

  const streakSub = stats.streak === 0
    ? t('noStreak')
    : stats.streak === 1
      ? t('oneDay')
      : t('nDays', { count: stats.streak });

  return (
    <div className="space-y-5">
      {/* ── Overview stats ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            icon: <Flame size={18} className="text-orange-500" />,
            label: t('studyStreak'),
            value: `${stats.streak}d`,
            sub: streakSub,
          },
          {
            icon: <BookOpen size={18} className="text-indigo-500" />,
            label: t('totalReviews'),
            value: stats.totalReviews.toLocaleString(),
            sub: t('allTime'),
          },
          {
            icon: <Brain size={18} className="text-violet-500" />,
            label: t('avgEase'),
            value: stats.easeAvg.toFixed(2),
            sub: t('ideal'),
          },
          {
            icon: <TrendingUp size={18} className="text-emerald-500" />,
            label: t('cardsTracked'),
            value: (Object.values(stats.cardsByMaturity).reduce((a, b) => a + b, 0)).toLocaleString(),
            sub: t('withSRSData'),
          },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl bg-white border border-gray-200 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              {s.icon}
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">{s.label}</span>
            </div>
            <p className="text-2xl font-black text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Retention + Maturity ─────────────────────────────────────────── */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="rounded-2xl bg-white border border-gray-200 p-5 shadow-sm">
          <h2 className="text-sm font-bold text-gray-700 mb-4">{t('retentionRate')}</h2>
          <div className="flex justify-center">
            <RetentionGauge
              rate={stats.retentionRate}
              excellent={t('excellent')}
              good={t('good')}
              needsWork={t('needsWork')}
              last30Days={t('last30Days')}
            />
          </div>
          <p className="text-xs text-gray-400 text-center mt-3">
            {t('ankiStandard')}
          </p>
        </div>

        <div className="rounded-2xl bg-white border border-gray-200 p-5 shadow-sm">
          <h2 className="text-sm font-bold text-gray-700 mb-4">{t('cardMaturity')}</h2>
          <MaturityBar
            cardsByMaturity={stats.cardsByMaturity}
            labels={{ new: t('new'), learning: t('learning'), young: t('young'), mature: t('mature') }}
            noCardsYet={t('noCardsYet')}
          />
          <p className="text-xs text-gray-400 mt-4">
            {t('maturityDesc')}
          </p>
        </div>
      </div>

      {/* ── Activity heatmap ─────────────────────────────────────────────── */}
      <div className="rounded-2xl bg-white border border-gray-200 p-5 shadow-sm">
        <h2 className="text-sm font-bold text-gray-700 mb-4">{t('reviewActivity')}</h2>
        <Heatmap data={stats.heatmap} less={t('less')} more={t('more')} />
      </div>

      {/* ── Due forecast ─────────────────────────────────────────────────── */}
      <div className="rounded-2xl bg-white border border-gray-200 p-5 shadow-sm">
        <h2 className="text-sm font-bold text-gray-700 mb-1">{t('dueForecast')}</h2>
        <p className="text-xs text-gray-400 mb-4">{t('cardsScheduled')}</p>
        <ForecastChart data={stats.forecast} todayLabel={t('today')} tmrwLabel={t('tomorrow')} />
      </div>

      {/* ── Advanced analytics ───────────────────────────────────────────── */}
      {deckStats && (
        <>
          {/* Exam readiness + weekly accuracy */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="rounded-2xl bg-white border border-gray-200 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Target size={16} className="text-indigo-500" />
                <h2 className="text-sm font-bold text-gray-700">Exam Readiness</h2>
              </div>
              <div className="flex justify-center">
                <ExamReadiness score={deckStats.examReadiness} />
              </div>
            </div>

            <div className="rounded-2xl bg-white border border-gray-200 p-5 shadow-sm">
              <h2 className="text-sm font-bold text-gray-700 mb-1">Weekly Accuracy</h2>
              <p className="text-xs text-gray-400 mb-4">Last 12 weeks (good + easy)</p>
              <AccuracyTrend data={deckStats.weeklyAccuracy} />
            </div>
          </div>

          {/* Per-deck breakdown */}
          <div className="rounded-2xl bg-white border border-gray-200 p-5 shadow-sm">
            <h2 className="text-sm font-bold text-gray-700 mb-4">Progress by Deck</h2>
            <DeckProgressList decks={deckStats.decks} />
          </div>
        </>
      )}
    </div>
  );
}
