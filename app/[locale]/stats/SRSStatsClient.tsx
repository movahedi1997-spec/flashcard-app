'use client';

import { useEffect, useState } from 'react';
import { Flame, BookOpen, TrendingUp, Brain, Loader2, AlertCircle } from 'lucide-react';

interface SRSStats {
  streak: number;
  totalReviews: number;
  retentionRate: number;
  cardsByMaturity: { new: number; learning: number; young: number; mature: number };
  forecast: Array<{ date: string; label: string; count: number }>;
  heatmap: Array<{ date: string; count: number }>;
  easeAvg: number;
}

// ── Heatmap ───────────────────────────────────────────────────────────────────

function Heatmap({ data }: { data: Array<{ date: string; count: number }> }) {
  const max = Math.max(1, ...data.map((d) => d.count));

  function cellColor(count: number) {
    if (count === 0) return 'bg-gray-100';
    const pct = count / max;
    if (pct < 0.25) return 'bg-indigo-200';
    if (pct < 0.5)  return 'bg-indigo-400';
    if (pct < 0.75) return 'bg-indigo-500';
    return 'bg-indigo-700';
  }

  // Group into weeks (12 weeks × 7 days)
  const weeks: Array<typeof data> = [];
  for (let i = 0; i < data.length; i += 7) {
    weeks.push(data.slice(i, i + 7));
  }

  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-1 min-w-0">
        {/* Day labels */}
        <div className="flex flex-col gap-1 mr-1 pt-5">
          {dayLabels.map((d) => (
            <div key={d} className="h-3 text-[10px] text-gray-400 leading-3">{d}</div>
          ))}
        </div>
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {/* Month label on first day of month */}
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
        <span>Less</span>
        {['bg-gray-100','bg-indigo-200','bg-indigo-400','bg-indigo-500','bg-indigo-700'].map((c) => (
          <div key={c} className={`h-3 w-3 rounded-sm ${c}`} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}

// ── Forecast bar chart ────────────────────────────────────────────────────────

function ForecastChart({ data }: { data: Array<{ label: string; count: number }> }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  const today = new Date().toISOString().split('T')[0];

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
              {i === 0 ? 'Today' : i === 1 ? 'Tmrw' : d.label.split(' ')[1] ? d.label.split(' ')[1] : d.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Maturity bar ──────────────────────────────────────────────────────────────

function MaturityBar({ cardsByMaturity }: { cardsByMaturity: SRSStats['cardsByMaturity'] }) {
  const total = Object.values(cardsByMaturity).reduce((a, b) => a + b, 0);
  if (total === 0) return <p className="text-sm text-gray-400">No cards yet.</p>;

  const segments = [
    { label: 'New',      count: cardsByMaturity.new,      color: 'bg-blue-400'    },
    { label: 'Learning', count: cardsByMaturity.learning,  color: 'bg-amber-400'   },
    { label: 'Young',    count: cardsByMaturity.young,     color: 'bg-indigo-400'  },
    { label: 'Mature',   count: cardsByMaturity.mature,    color: 'bg-emerald-500' },
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

function RetentionGauge({ rate }: { rate: number }) {
  const color = rate >= 80 ? 'text-emerald-600' : rate >= 60 ? 'text-amber-500' : 'text-red-500';
  const label = rate >= 80 ? 'Excellent' : rate >= 60 ? 'Good' : 'Needs work';
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
      <span className="text-xs text-gray-400">last 30 days</span>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function SRSStatsClient() {
  const [stats, setStats] = useState<SRSStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/stats/srs')
      .then((r) => r.json())
      .then((d: SRSStats) => setStats(d))
      .catch(() => setError('Failed to load analytics.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 gap-3 text-gray-400">
        <Loader2 size={22} className="animate-spin" />
        <span className="text-sm">Loading analytics…</span>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-red-600 text-sm">
        <AlertCircle size={16} /> {error || 'Something went wrong.'}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ── Overview stats ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            icon: <Flame size={18} className="text-orange-500" />,
            label: 'Study Streak',
            value: `${stats.streak}d`,
            sub: stats.streak === 1 ? '1 day' : stats.streak === 0 ? 'No streak yet' : `${stats.streak} days`,
          },
          {
            icon: <BookOpen size={18} className="text-indigo-500" />,
            label: 'Total Reviews',
            value: stats.totalReviews.toLocaleString(),
            sub: 'all time',
          },
          {
            icon: <Brain size={18} className="text-violet-500" />,
            label: 'Avg Ease',
            value: stats.easeAvg.toFixed(2),
            sub: '2.5 = ideal',
          },
          {
            icon: <TrendingUp size={18} className="text-emerald-500" />,
            label: 'Cards Tracked',
            value: (Object.values(stats.cardsByMaturity).reduce((a, b) => a + b, 0)).toLocaleString(),
            sub: 'with SRS data',
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
          <h2 className="text-sm font-bold text-gray-700 mb-4">Retention Rate</h2>
          <div className="flex justify-center">
            <RetentionGauge rate={stats.retentionRate} />
          </div>
          <p className="text-xs text-gray-400 text-center mt-3">
            Based on "Good" + "Easy" ratings — Anki standard
          </p>
        </div>

        <div className="rounded-2xl bg-white border border-gray-200 p-5 shadow-sm">
          <h2 className="text-sm font-bold text-gray-700 mb-4">Card Maturity</h2>
          <MaturityBar cardsByMaturity={stats.cardsByMaturity} />
          <p className="text-xs text-gray-400 mt-4">
            Mature = interval &gt; 20 days · Young = 1–20 days
          </p>
        </div>
      </div>

      {/* ── Activity heatmap ─────────────────────────────────────────────── */}
      <div className="rounded-2xl bg-white border border-gray-200 p-5 shadow-sm">
        <h2 className="text-sm font-bold text-gray-700 mb-4">Review Activity — Last 12 Weeks</h2>
        <Heatmap data={stats.heatmap} />
      </div>

      {/* ── Due forecast ─────────────────────────────────────────────────── */}
      <div className="rounded-2xl bg-white border border-gray-200 p-5 shadow-sm">
        <h2 className="text-sm font-bold text-gray-700 mb-1">Due Forecast — Next 14 Days</h2>
        <p className="text-xs text-gray-400 mb-4">Cards scheduled for review each day</p>
        <ForecastChart data={stats.forecast} />
      </div>
    </div>
  );
}
