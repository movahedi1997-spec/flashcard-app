'use client';

import { useRouter } from 'next/navigation';

interface TimelinePoint { date: string; total: number }
interface RecentUser { name: string; email: string; created_at: string }

interface Stats {
  total: number;
  activeDay: number;
  activeWeek: number;
  activeMonth: number;
  timeline: TimelinePoint[];
  recentUsers: RecentUser[];
}

// ── Inline SVG line chart ─────────────────────────────────────────────────────

function LineChart({ data }: { data: TimelinePoint[] }) {
  if (data.length < 2) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-500 text-sm">
        Not enough data yet
      </div>
    );
  }

  const W = 800;
  const H = 200;
  const PAD = { top: 16, right: 16, bottom: 36, left: 48 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const minV = Math.min(...data.map((d) => d.total));
  const maxV = Math.max(...data.map((d) => d.total));
  const range = maxV - minV || 1;

  const px = (i: number) => PAD.left + (i / (data.length - 1)) * chartW;
  const py = (v: number) => PAD.top + chartH - ((v - minV) / range) * chartH;

  const linePath = data
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${px(i).toFixed(1)} ${py(d.total).toFixed(1)}`)
    .join(' ');

  const areaPath =
    `M ${px(0).toFixed(1)} ${(PAD.top + chartH).toFixed(1)} ` +
    data.map((d, i) => `L ${px(i).toFixed(1)} ${py(d.total).toFixed(1)}`).join(' ') +
    ` L ${px(data.length - 1).toFixed(1)} ${(PAD.top + chartH).toFixed(1)} Z`;

  // Y-axis ticks
  const yTicks = 4;
  const yTickValues = Array.from({ length: yTicks + 1 }, (_, i) =>
    Math.round(minV + (range / yTicks) * i),
  );

  // X-axis: show ~6 labels evenly spaced
  const xLabelCount = Math.min(6, data.length);
  const xLabelIndices = Array.from({ length: xLabelCount }, (_, i) =>
    Math.round((i / (xLabelCount - 1)) * (data.length - 1)),
  );

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      style={{ height: 220 }}
      aria-label="Total accounts over time"
    >
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Y grid lines */}
      {yTickValues.map((v) => (
        <g key={v}>
          <line
            x1={PAD.left}
            y1={py(v)}
            x2={PAD.left + chartW}
            y2={py(v)}
            stroke="#374151"
            strokeWidth={1}
          />
          <text
            x={PAD.left - 8}
            y={py(v) + 4}
            textAnchor="end"
            fill="#9ca3af"
            fontSize={11}
          >
            {v}
          </text>
        </g>
      ))}

      {/* Area fill */}
      <path d={areaPath} fill="url(#areaGrad)" />

      {/* Line */}
      <path d={linePath} fill="none" stroke="#6366f1" strokeWidth={2.5} strokeLinejoin="round" />

      {/* X axis labels */}
      {xLabelIndices.map((idx) => (
        <text
          key={idx}
          x={px(idx)}
          y={H - 8}
          textAnchor="middle"
          fill="#9ca3af"
          fontSize={11}
        >
          {data[idx].date.slice(5)} {/* MM-DD */}
        </text>
      ))}

      {/* Last point dot */}
      <circle
        cx={px(data.length - 1)}
        cy={py(data[data.length - 1].total)}
        r={4}
        fill="#6366f1"
      />
    </svg>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  color = 'indigo',
}: {
  label: string;
  value: number;
  sub: string;
  color?: 'indigo' | 'emerald' | 'amber' | 'sky';
}) {
  const ring: Record<string, string> = {
    indigo: 'ring-indigo-500/30 bg-indigo-500/10',
    emerald: 'ring-emerald-500/30 bg-emerald-500/10',
    amber: 'ring-amber-500/30 bg-amber-500/10',
    sky: 'ring-sky-500/30 bg-sky-500/10',
  };
  const text: Record<string, string> = {
    indigo: 'text-indigo-400',
    emerald: 'text-emerald-400',
    amber: 'text-amber-400',
    sky: 'text-sky-400',
  };
  return (
    <div className={`rounded-2xl p-5 ring-1 ${ring[color]}`}>
      <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-4xl font-bold ${text[color]}`}>{value.toLocaleString()}</p>
      <p className="text-gray-500 text-xs mt-1">{sub}</p>
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export default function AdminDashboardClient({ stats }: { stats: Stats }) {
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST', credentials: 'include' });
    router.replace('/admin/login');
  }

  return (
    <div className="min-h-screen p-6 md:p-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-gray-400 text-sm mt-0.5">FlashCard AI — Internal Analytics</p>
        </div>
        <button
          onClick={handleLogout}
          className="text-sm text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 rounded-lg px-4 py-2 transition-colors"
        >
          Sign out
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Accounts" value={stats.total} sub="all time" color="indigo" />
        <StatCard label="Active Today" value={stats.activeDay} sub="reviewed a card" color="emerald" />
        <StatCard label="Active This Week" value={stats.activeWeek} sub="last 7 days" color="sky" />
        <StatCard label="Active This Month" value={stats.activeMonth} sub="last 30 days" color="amber" />
      </div>

      {/* Growth chart */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 mb-8">
        <h2 className="text-base font-semibold text-white mb-4">Account Growth — Last 60 Days</h2>
        <LineChart data={stats.timeline} />
      </div>

      {/* Recent registrations */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
        <h2 className="text-base font-semibold text-white mb-4">Recent Registrations</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 text-xs uppercase tracking-wider border-b border-gray-800">
                <th className="pb-3 font-medium">Name</th>
                <th className="pb-3 font-medium">Email</th>
                <th className="pb-3 font-medium text-right">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {stats.recentUsers.map((u, i) => (
                <tr key={i} className="hover:bg-gray-800/50 transition-colors">
                  <td className="py-3 text-gray-200 font-medium">{u.name}</td>
                  <td className="py-3 text-gray-400">{u.email}</td>
                  <td className="py-3 text-gray-500 text-right tabular-nums">{u.created_at}</td>
                </tr>
              ))}
              {stats.recentUsers.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-6 text-center text-gray-600">No registrations yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
