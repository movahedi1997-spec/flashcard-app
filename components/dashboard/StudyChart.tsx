'use client';

/**
 * components/dashboard/StudyChart.tsx
 *
 * Bar chart showing cards reviewed per day / week / month.
 * Each bar is stacked by grade:
 *   Again → red  |  Hard → orange  |  Good → green  |  Easy → blue
 *
 * Clicking a legend item toggles its visibility.
 * Data is fetched from GET /api/stats/reviews?period=day|week|month.
 */

import { useState, useEffect, useCallback } from 'react';
import { BarChart2 } from 'lucide-react';
import { fetchWithRefresh } from '@/lib/fetchWithRefresh';

// ── Types ─────────────────────────────────────────────────────────────────────

type Period = 'day' | 'week' | 'month';

interface DataPoint {
  period: string;
  label: string;
  again: number;
  hard: number;
  good: number;
  easy: number;
  total: number;
}

type GradeKey = 'again' | 'hard' | 'good' | 'easy';

// ── Grade colour palette ──────────────────────────────────────────────────────

const GRADES: { key: GradeKey; label: string; bar: string; legend: string }[] = [
  { key: 'again', label: 'Again', bar: 'bg-red-400',    legend: 'bg-red-400'    },
  { key: 'hard',  label: 'Hard',  bar: 'bg-orange-400', legend: 'bg-orange-400' },
  { key: 'good',  label: 'Good',  bar: 'bg-emerald-400',legend: 'bg-emerald-400'},
  { key: 'easy',  label: 'Easy',  bar: 'bg-blue-400',   legend: 'bg-blue-400'   },
];

// ── Tooltip ───────────────────────────────────────────────────────────────────

interface TooltipState {
  x: number;
  y: number;
  point: DataPoint;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function StudyChart() {
  const [period, setPeriod] = useState<Period>('day');
  const [data, setData] = useState<DataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState<Record<GradeKey, boolean>>({
    again: true, hard: true, good: true, easy: true,
  });
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  // ── Fetch ─────────────────────────────────────────────────────────────────

  const fetchData = useCallback(async (p: Period) => {
    setLoading(true);
    try {
      const res = await fetchWithRefresh(`/api/stats/reviews?period=${p}`, { credentials: 'include' });
      const json = await res.json() as { data?: DataPoint[] };
      setData(json.data ?? []);
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchData(period); }, [period, fetchData]);

  // ── Derived values ────────────────────────────────────────────────────────

  const maxTotal = Math.max(
    ...data.map((d) =>
      GRADES.reduce((s, g) => s + (visible[g.key] ? d[g.key] : 0), 0),
    ),
    1,
  );

  const totalReviews = data.reduce((s, d) => s + d.total, 0);

  // ── Label density: show label only every N bars ───────────────────────────

  const labelEvery = period === 'day' ? 5 : period === 'week' ? 2 : 1;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <BarChart2 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 leading-tight">Study Activity</h2>
            {!loading && (
              <p className="text-xs text-gray-400">{totalReviews} reviews in this period</p>
            )}
          </div>
        </div>

        {/* Period toggle */}
        <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
          {(['day', 'week', 'month'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`rounded-md px-3 py-1 text-xs font-semibold capitalize transition ${
                period === p
                  ? 'bg-white shadow text-gray-900'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {p === 'day' ? 'Daily' : p === 'week' ? 'Weekly' : 'Monthly'}
            </button>
          ))}
        </div>
      </div>

      {/* Chart area */}
      {loading ? (
        <div className="h-40 flex items-center justify-center">
          <div className="h-5 w-5 rounded-full border-2 border-indigo-300 border-t-indigo-600 animate-spin" />
        </div>
      ) : totalReviews === 0 ? (
        <div className="h-40 flex flex-col items-center justify-center gap-2 text-gray-400">
          <BarChart2 className="h-8 w-8 opacity-30" />
          <p className="text-sm">No reviews yet — start studying to see your activity!</p>
        </div>
      ) : (
        /* Chart: Y-axis labels + gridlines + bars */
        <div className="flex gap-2">
          {/* Y-axis labels */}
          <div className="flex flex-col justify-between items-end pe-1 h-40 shrink-0">
            {[1, 0.75, 0.5, 0.25, 0].map((frac) => (
              <span key={frac} className="text-[10px] text-gray-400 leading-none">
                {Math.round(maxTotal * frac)}
              </span>
            ))}
          </div>

          {/* Bar area */}
          <div className="relative flex-1">
            {/* Horizontal gridlines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="w-full border-t border-gray-100" />
              ))}
            </div>

            {/* Bars + X labels */}
            <div className="relative h-40 flex items-end gap-0.5"
              onMouseLeave={() => setTooltip(null)}>
              {data.map((point, idx) => {
                const visibleTotal = GRADES.reduce(
                  (s, g) => s + (visible[g.key] ? point[g.key] : 0),
                  0,
                );
                const heightPct = visibleTotal / maxTotal;

                return (
                  <div
                    key={point.period}
                    className="relative flex flex-1 flex-col justify-end h-full"
                    onMouseEnter={(e) => {
                      const rect = (e.currentTarget as HTMLElement)
                        .closest('.relative')!
                        .getBoundingClientRect();
                      setTooltip({
                        x: e.clientX - rect.left,
                        y: e.clientY - rect.top,
                        point,
                      });
                    }}
                  >
                    {/* Stacked bar */}
                    <div
                      className="flex flex-col rounded-t overflow-hidden transition-all duration-300 min-h-[2px]"
                      style={{ height: `${heightPct * 100}%` }}
                    >
                      {GRADES.map((g) =>
                        visible[g.key] && point[g.key] > 0 ? (
                          <div
                            key={g.key}
                            className={`${g.bar}`}
                            style={{ flex: point[g.key] }}
                          />
                        ) : null,
                      )}
                    </div>

                    {/* X-axis label */}
                    {idx % labelEvery === 0 && (
                      <p className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] text-gray-400 whitespace-nowrap select-none">
                        {point.label}
                      </p>
                    )}
                  </div>
                );
              })}

              {/* Tooltip */}
              {tooltip && (
                <div
                  className="pointer-events-none absolute z-10 rounded-xl border border-gray-100 bg-white shadow-lg px-3 py-2 text-xs"
                  style={{
                    left: Math.min(tooltip.x + 12, 220),
                    top: Math.max(tooltip.y - 90, 0),
                  }}
                >
                  <p className="font-semibold text-gray-700 mb-1">{tooltip.point.label}</p>
                  {GRADES.map((g) => (
                    <div key={g.key} className="flex items-center gap-1.5">
                      <span className={`h-2 w-2 rounded-sm ${g.legend}`} />
                      <span className="text-gray-500">{g.label}:</span>
                      <span className="font-medium text-gray-800">{tooltip.point[g.key]}</span>
                    </div>
                  ))}
                  <div className="mt-1 border-t border-gray-100 pt-1 flex justify-between gap-3">
                    <span className="text-gray-500">Total</span>
                    <span className="font-semibold text-gray-900">{tooltip.point.total}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* X-axis label spacing */}
      <div className="h-6" />

      {/* Legend — click to toggle */}
      <div className="flex flex-wrap gap-3 mt-1">
        {GRADES.map((g) => (
          <button
            key={g.key}
            onClick={() =>
              setVisible((v) => ({ ...v, [g.key]: !v[g.key] }))
            }
            className={`flex items-center gap-1.5 text-xs font-medium transition-opacity select-none ${
              visible[g.key] ? 'opacity-100' : 'opacity-30'
            }`}
          >
            <span className={`h-3 w-3 rounded-sm ${g.legend}`} />
            {g.label}
          </button>
        ))}
      </div>
    </div>
  );
}
