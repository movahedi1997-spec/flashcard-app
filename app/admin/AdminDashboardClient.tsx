'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users, Shield, Flag, BarChart2, TrendingUp, CreditCard,
  BookOpen, Brain, AlertTriangle, Ban, CheckCircle, Search,
  RefreshCw, ChevronDown, ChevronUp, FileText, X, Check,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface TimelinePoint { date: string; total: number }
interface RecentUser { name: string; email: string; is_pro: boolean; created_at: string }

interface Stats {
  total: number; proUsers: number; bannedUsers: number;
  totalDecks: number; totalCards: number;
  activeDay: number; activeWeek: number; activeMonth: number;
  aiCardsMonth: number; aiRegenMonth: number;
  pendingReports: number;
  timeline: TimelinePoint[];
  recentUsers: RecentUser[];
}

interface Report {
  id: string; deck_id: string; deck_title: string;
  deck_owner_name: string; deck_owner_email: string;
  reporter_name: string | null; reporter_email: string | null;
  reason: string; details: string | null; status: string;
  admin_note: string | null; created_at: string; reviewed_at: string | null;
}

interface AdminUser {
  id: string; name: string; email: string; is_pro: boolean; is_banned: boolean;
  subscription_status: string | null; registration_ip: string | null;
  last_known_ip: string | null; phone_number: string | null;
  warning_count: string; created_at: string;
}

// ── Chart ─────────────────────────────────────────────────────────────────────

function LineChart({ data }: { data: TimelinePoint[] }) {
  if (data.length < 2) return (
    <div className="flex items-center justify-center h-48 text-gray-400 text-sm">Not enough data yet</div>
  );
  const W = 800; const H = 180;
  const PAD = { top: 12, right: 16, bottom: 32, left: 44 };
  const cW = W - PAD.left - PAD.right; const cH = H - PAD.top - PAD.bottom;
  const minV = Math.min(...data.map((d) => d.total));
  const maxV = Math.max(...data.map((d) => d.total));
  const range = maxV - minV || 1;
  const px = (i: number) => PAD.left + (i / (data.length - 1)) * cW;
  const py = (v: number) => PAD.top + cH - ((v - minV) / range) * cH;
  const line = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${px(i).toFixed(1)} ${py(d.total).toFixed(1)}`).join(' ');
  const area = `M ${px(0).toFixed(1)} ${(PAD.top + cH).toFixed(1)} ` +
    data.map((d, i) => `L ${px(i).toFixed(1)} ${py(d.total).toFixed(1)}`).join(' ') +
    ` L ${px(data.length - 1).toFixed(1)} ${(PAD.top + cH).toFixed(1)} Z`;
  const yTicks = [0, 1, 2, 3, 4].map((i) => Math.round(minV + (range / 4) * i));
  const xIdx = [0, 1, 2, 3, 4, 5].map((i) => Math.round((i / 5) * (data.length - 1)));
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 190 }}>
      <defs>
        <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
        </linearGradient>
      </defs>
      {yTicks.map((v) => (
        <g key={v}>
          <line x1={PAD.left} y1={py(v)} x2={PAD.left + cW} y2={py(v)} stroke="#e5e7eb" strokeWidth={1} />
          <text x={PAD.left - 6} y={py(v) + 4} textAnchor="end" fill="#9ca3af" fontSize={10}>{v}</text>
        </g>
      ))}
      <path d={area} fill="url(#ag)" />
      <path d={line} fill="none" stroke="#6366f1" strokeWidth={2} strokeLinejoin="round" />
      {xIdx.map((idx) => (
        <text key={idx} x={px(idx)} y={H - 6} textAnchor="middle" fill="#9ca3af" fontSize={10}>
          {data[idx].date.slice(5)}
        </text>
      ))}
      <circle cx={px(data.length - 1)} cy={py(data[data.length - 1].total)} r={4} fill="#6366f1" />
    </svg>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function Stat({ label, value, sub, color, icon: Icon }: {
  label: string; value: number | string; sub: string;
  color: string; icon: React.ElementType;
}) {
  const colors: Record<string, { icon: string; bg: string }> = {
    indigo:  { icon: 'text-indigo-600',  bg: 'bg-indigo-50'  },
    emerald: { icon: 'text-emerald-600', bg: 'bg-emerald-50' },
    amber:   { icon: 'text-amber-600',   bg: 'bg-amber-50'   },
    sky:     { icon: 'text-sky-600',     bg: 'bg-sky-50'     },
    violet:  { icon: 'text-violet-600',  bg: 'bg-violet-50'  },
    rose:    { icon: 'text-rose-600',    bg: 'bg-rose-50'    },
  };
  const cls = colors[color] ?? colors.indigo;
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${cls.bg}`}>
          <Icon className={`h-5 w-5 ${cls.icon}`} />
        </div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
      </div>
      <p className="text-3xl font-bold tabular-nums text-gray-900">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
      <p className="text-gray-400 text-xs mt-1">{sub}</p>
    </div>
  );
}

// ── Reason badge ──────────────────────────────────────────────────────────────

const REASON_COLORS: Record<string, string> = {
  illegal_content: 'bg-red-50 text-red-700 border-red-200',
  copyright:       'bg-orange-50 text-orange-700 border-orange-200',
  hate_speech:     'bg-red-50 text-red-700 border-red-200',
  misinformation:  'bg-yellow-50 text-yellow-700 border-yellow-200',
  spam:            'bg-gray-100 text-gray-600 border-gray-200',
  violence:        'bg-red-50 text-red-700 border-red-200',
  other:           'bg-gray-100 text-gray-500 border-gray-200',
};

function ReasonBadge({ reason }: { reason: string }) {
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium border ${REASON_COLORS[reason] ?? REASON_COLORS.other}`}>
      {reason.replace('_', ' ')}
    </span>
  );
}

// ── Tab bar ───────────────────────────────────────────────────────────────────

type Tab = 'overview' | 'reports' | 'users' | 'police';

function TabBar({ active, onChange, pendingReports }: { active: Tab; onChange: (t: Tab) => void; pendingReports: number }) {
  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: 'overview', label: 'Overview',      icon: BarChart2 },
    { key: 'reports',  label: 'Reports',        icon: Flag      },
    { key: 'users',    label: 'Users',           icon: Users     },
    { key: 'police',   label: 'Police Reports',  icon: FileText  },
  ];
  return (
    <div className="flex gap-1 border-b border-gray-200 mb-6">
      {tabs.map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors relative ${
            active === key
              ? 'text-indigo-600 border-b-2 border-indigo-600 -mb-px'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Icon size={14} />
          {label}
          {key === 'reports' && pendingReports > 0 && (
            <span className="ml-1 rounded-full bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 leading-none">
              {pendingReports}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

// ── Overview tab ──────────────────────────────────────────────────────────────

function OverviewTab({ stats }: { stats: Stats }) {
  const [showAll, setShowAll] = useState(false);
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Total Users"     value={stats.total}           sub="all time"        color="indigo"  icon={Users}      />
        <Stat label="Pro Users"       value={stats.proUsers}        sub="active subs"     color="violet"  icon={CreditCard} />
        <Stat label="Active Today"    value={stats.activeDay}       sub="card review"     color="emerald" icon={TrendingUp} />
        <Stat label="Active Week"     value={stats.activeWeek}      sub="last 7 days"     color="sky"     icon={BarChart2}  />
        <Stat label="Active Month"    value={stats.activeMonth}     sub="last 30 days"    color="sky"     icon={BarChart2}  />
        <Stat label="Total Decks"     value={stats.totalDecks}      sub="all users"       color="amber"   icon={BookOpen}   />
        <Stat label="AI Cards/Month"  value={stats.aiCardsMonth}    sub="this month"      color="violet"  icon={Brain}      />
        <Stat label="Pending Reports" value={stats.pendingReports}  sub="awaiting review" color="rose"    icon={Flag}       />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Account Growth — Last 60 Days</h2>
        <LineChart data={stats.timeline} />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-900">Recent Registrations</h2>
          <button onClick={() => setShowAll((p) => !p)} className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
            {showAll ? <><ChevronUp size={12} /> Show less</> : <><ChevronDown size={12} /> Show all</>}
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400 text-xs uppercase tracking-wider border-b border-gray-100">
                <th className="pb-2 font-semibold">Name</th>
                <th className="pb-2 font-semibold">Email</th>
                <th className="pb-2 font-semibold">Plan</th>
                <th className="pb-2 font-semibold text-right">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(showAll ? stats.recentUsers : stats.recentUsers.slice(0, 5)).map((u, i) => (
                <tr key={i} className="hover:bg-gray-50 transition-colors">
                  <td className="py-2.5 text-gray-800 font-medium">{u.name}</td>
                  <td className="py-2.5 text-gray-500 text-xs">{u.email}</td>
                  <td className="py-2.5">
                    {u.is_pro
                      ? <span className="text-[10px] font-bold text-violet-700 bg-violet-50 border border-violet-200 px-1.5 py-0.5 rounded-full">Pro</span>
                      : <span className="text-[10px] text-gray-500 bg-gray-100 border border-gray-200 px-1.5 py-0.5 rounded-full">Free</span>
                    }
                  </td>
                  <td className="py-2.5 text-gray-400 text-right text-xs tabular-nums">{u.created_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Reports tab ───────────────────────────────────────────────────────────────

function ReportsTab() {
  const [status, setStatus] = useState('pending');
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [actionNote, setActionNote] = useState('');
  const [acting, setActing] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reports?status=${status}`, { credentials: 'include' });
      const data = await res.json() as { reports: Report[] };
      setReports(data.reports ?? []);
    } finally { setLoading(false); }
  }, [status]);

  useEffect(() => { void load(); }, [load]);

  async function act(reportId: string, action: string) {
    setActing(reportId + action);
    try {
      await fetch('/api/admin/reports', {
        method: 'PATCH', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId, action, adminNote: actionNote }),
      });
      setActionNote('');
      setExpanded(null);
      await load();
    } finally { setActing(null); }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {['pending','reviewed','dismissed','removed'].map((s) => (
          <button key={s} onClick={() => setStatus(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition ${
              status === s ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-gray-500 border border-gray-200 hover:text-gray-700'
            }`}
          >{s}</button>
        ))}
        <button onClick={load} className="ml-auto text-gray-400 hover:text-gray-600">
          <RefreshCw size={14} />
        </button>
      </div>

      {loading ? (
        <div className="text-gray-400 text-sm py-8 text-center">Loading…</div>
      ) : reports.length === 0 ? (
        <div className="text-gray-400 text-sm py-8 text-center">No {status} reports.</div>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => (
            <div key={r.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div
                className="flex items-start gap-4 p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setExpanded(expanded === r.id ? null : r.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <ReasonBadge reason={r.reason} />
                    <span className="text-gray-800 font-medium text-sm truncate">{r.deck_title}</span>
                  </div>
                  <p className="text-xs text-gray-400">
                    Owner: <span className="text-gray-600">{r.deck_owner_name}</span> · {r.deck_owner_email}
                    {r.reporter_name && <> · Reported by: <span className="text-gray-600">{r.reporter_name}</span></>}
                  </p>
                  {r.details && <p className="text-xs text-gray-500 mt-1 line-clamp-1">"{r.details}"</p>}
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-xs text-gray-400">{r.created_at}</p>
                </div>
              </div>

              {expanded === r.id && r.status === 'pending' && (
                <div className="border-t border-gray-100 p-4 space-y-3 bg-gray-50">
                  {r.details && (
                    <p className="text-sm text-gray-700 bg-white border border-gray-100 rounded-lg p-3">"{r.details}"</p>
                  )}
                  <textarea
                    value={actionNote}
                    onChange={(e) => setActionNote(e.target.value)}
                    placeholder="Admin note (optional)…"
                    rows={2}
                    className="w-full text-sm bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 resize-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => act(r.id, 'dismiss')}
                      disabled={acting !== null}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-gray-200 hover:bg-gray-100 text-sm text-gray-600 transition disabled:opacity-50"
                    >
                      <X size={13} /> Dismiss
                    </button>
                    <button
                      onClick={() => act(r.id, 'warn_user')}
                      disabled={acting !== null}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-sm text-amber-700 border border-amber-200 transition disabled:opacity-50"
                    >
                      <AlertTriangle size={13} /> Warn Owner
                    </button>
                    <button
                      onClick={() => act(r.id, 'remove_deck')}
                      disabled={acting !== null}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-sm text-red-700 border border-red-200 transition disabled:opacity-50"
                    >
                      <Ban size={13} /> Remove Deck
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Users tab ─────────────────────────────────────────────────────────────────

function UsersTab() {
  const [q, setQ] = useState('');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [warnReason, setWarnReason] = useState('');
  const [warnSeverity, setWarnSeverity] = useState<'low'|'medium'|'high'>('low');
  const [acting, setActing] = useState<string | null>(null);

  const load = useCallback(async (search = q) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users?q=${encodeURIComponent(search)}&limit=50`, { credentials: 'include' });
      const data = await res.json() as { users: AdminUser[] };
      setUsers(data.users ?? []);
    } finally { setLoading(false); }
  }, [q]);

  useEffect(() => { void load(''); }, []);

  async function doAction(userId: string, action: string, reason?: string, severity?: string) {
    setActing(userId + action);
    try {
      await fetch(`/api/admin/users/${userId}`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason, severity }),
      });
      setExpanded(null);
      setWarnReason('');
      await load();
    } finally { setActing(null); }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && void load()}
            placeholder="Search by name or email…"
            className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-gray-200 rounded-xl text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400"
          />
        </div>
        <button onClick={() => void load()} className="px-4 py-2 bg-indigo-600 rounded-xl text-sm text-white hover:bg-indigo-700 shadow-sm">Search</button>
      </div>

      {loading ? (
        <div className="text-gray-400 text-sm py-8 text-center">Loading…</div>
      ) : (
        <div className="space-y-2">
          {users.map((u) => (
            <div key={u.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div
                className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setExpanded(expanded === u.id ? null : u.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-gray-800 font-medium text-sm">{u.name}</span>
                    {u.is_pro && <span className="text-[10px] font-bold text-violet-700 bg-violet-50 border border-violet-200 px-1.5 py-0.5 rounded-full">Pro</span>}
                    {u.is_banned && <span className="text-[10px] font-bold text-red-700 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-full">Banned</span>}
                    {parseInt(u.warning_count) > 0 && (
                      <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full">
                        {u.warning_count} warning{parseInt(u.warning_count) > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{u.email}</p>
                </div>
                <p className="text-xs text-gray-400 shrink-0">{u.created_at}</p>
              </div>

              {expanded === u.id && (
                <div className="border-t border-gray-100 p-4 space-y-4 bg-gray-50">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div><span className="text-gray-400">Reg. IP:</span> <span className="text-gray-700 font-mono">{u.registration_ip ?? '—'}</span></div>
                    <div><span className="text-gray-400">Last IP:</span> <span className="text-gray-700 font-mono">{u.last_known_ip ?? '—'}</span></div>
                    <div><span className="text-gray-400">Phone:</span> <span className="text-gray-700">{u.phone_number ?? '—'}</span></div>
                    <div><span className="text-gray-400">Subscription:</span> <span className="text-gray-700">{u.subscription_status ?? 'free'}</span></div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Issue Warning</p>
                    <input
                      value={warnReason}
                      onChange={(e) => setWarnReason(e.target.value)}
                      placeholder="Warning reason…"
                      className="w-full text-sm bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-100 focus:border-amber-400"
                    />
                    <div className="flex items-center gap-2">
                      {(['low','medium','high'] as const).map((s) => (
                        <button key={s} onClick={() => setWarnSeverity(s)}
                          className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition ${
                            warnSeverity === s
                              ? s === 'high' ? 'bg-red-100 text-red-700 border border-red-200'
                              : s === 'medium' ? 'bg-amber-100 text-amber-700 border border-amber-200'
                              : 'bg-gray-200 text-gray-700 border border-gray-300'
                              : 'bg-white text-gray-400 border border-gray-200 hover:text-gray-600'
                          }`}
                        >{s}</button>
                      ))}
                      <button
                        onClick={() => warnReason && doAction(u.id, 'warn', warnReason, warnSeverity)}
                        disabled={!warnReason || acting !== null}
                        className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-sm text-amber-700 border border-amber-200 disabled:opacity-50 transition"
                      >
                        <AlertTriangle size={13} /> Warn
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {u.is_banned ? (
                      <button
                        onClick={() => doAction(u.id, 'unban')}
                        disabled={acting !== null}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-sm text-emerald-700 border border-emerald-200 disabled:opacity-50 transition"
                      >
                        <Check size={13} /> Unban User
                      </button>
                    ) : (
                      <button
                        onClick={() => doAction(u.id, 'ban', 'Manual ban by admin')}
                        disabled={acting !== null}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-sm text-red-700 border border-red-200 disabled:opacity-50 transition"
                      >
                        <Ban size={13} /> Ban User
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Police Report tab ─────────────────────────────────────────────────────────

function PoliceReportTab() {
  const [email, setEmail] = useState('');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [selected, setSelected] = useState<AdminUser | null>(null);
  const [report, setReport] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);

  async function search() {
    const res = await fetch(`/api/admin/users?q=${encodeURIComponent(email)}&limit=10`, { credentials: 'include' });
    const data = await res.json() as { users: AdminUser[] };
    setUsers(data.users ?? []);
  }

  async function generate(user: AdminUser) {
    setSelected(user);
    setLoading(true);
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'police_report' }),
    });
    const data = await res.json() as Record<string, unknown>;
    setReport(data);
    setLoading(false);
  }

  type ReportSubject = { id: string; name: string; email: string; registrationIp: string | null; lastKnownIp: string | null; phoneNumber: string | null; accountCreated: string; isBanned: boolean };
  type WarningEntry = { reason: string; severity: string; created_at: string; issued_by: string };
  type BanEntry = { action: string; reason: string | null; created_at: string };
  type DeckEntry = { title: string; created_at: string; is_public: boolean };

  const subject = report?.subject as ReportSubject | undefined;
  const warnings = report?.warnings as WarningEntry[] | undefined;
  const banHistory = report?.banHistory as BanEntry[] | undefined;
  const decks = report?.decks as DeckEntry[] | undefined;

  return (
    <div className="space-y-4">
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-700">
        <strong>Legal notice:</strong> Police reports contain personal data (IP addresses, contact info). Only generate when legally required. All access is logged via audit trail.
      </div>

      <div className="flex gap-2">
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && void search()}
          placeholder="Search user by email or name…"
          className="flex-1 text-sm bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400"
        />
        <button onClick={search} className="px-4 py-2 bg-indigo-600 rounded-xl text-sm text-white hover:bg-indigo-700 shadow-sm">Search</button>
      </div>

      {users.length > 0 && !report && (
        <div className="space-y-2">
          {users.map((u) => (
            <button key={u.id} onClick={() => void generate(u)}
              className="w-full text-left bg-white border border-gray-100 shadow-sm rounded-xl px-4 py-3 hover:bg-gray-50 transition"
            >
              <p className="text-gray-800 text-sm font-medium">{u.name}</p>
              <p className="text-gray-400 text-xs">{u.email}</p>
            </button>
          ))}
        </div>
      )}

      {loading && <div className="text-gray-400 text-sm py-8 text-center">Generating report…</div>}

      {report && subject && (
        <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6 space-y-5 font-mono text-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-900 font-bold text-base font-sans">POLICE REPORT — CONFIDENTIAL</p>
              <p className="text-gray-400">Generated: {report.generatedAt as string}</p>
            </div>
            <button onClick={() => window.print()}
              className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-xs text-gray-600 transition">
              Print / Save PDF
            </button>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <p className="text-gray-400 mb-2 font-sans font-semibold text-xs uppercase tracking-wider">Subject</p>
            <div className="grid grid-cols-2 gap-1.5 text-gray-700">
              <span className="text-gray-400">Full Name:</span><span>{subject.name}</span>
              <span className="text-gray-400">Email:</span><span>{subject.email}</span>
              <span className="text-gray-400">User ID:</span><span className="break-all">{subject.id}</span>
              <span className="text-gray-400">Reg. IP:</span><span>{subject.registrationIp ?? 'N/A'}</span>
              <span className="text-gray-400">Last IP:</span><span>{subject.lastKnownIp ?? 'N/A'}</span>
              <span className="text-gray-400">Phone:</span><span>{subject.phoneNumber ?? 'Not provided'}</span>
              <span className="text-gray-400">Account Created:</span><span>{subject.accountCreated}</span>
              <span className="text-gray-400">Status:</span><span>{subject.isBanned ? 'BANNED' : 'Active'}</span>
            </div>
          </div>

          {warnings && warnings.length > 0 && (
            <div className="border-t border-gray-100 pt-4">
              <p className="text-gray-400 mb-2 font-sans font-semibold text-xs uppercase tracking-wider">Warning History ({warnings.length})</p>
              {warnings.map((w, i) => (
                <div key={i} className="border border-gray-100 rounded-lg p-2 mb-1.5 text-gray-700">
                  <span className="text-gray-400">Date:</span> {w.created_at} · <span className="text-gray-400">Severity:</span> {w.severity.toUpperCase()} · <span className="text-gray-400">By:</span> {w.issued_by}<br />
                  <span className="text-gray-400">Reason:</span> {w.reason}
                </div>
              ))}
            </div>
          )}

          {banHistory && banHistory.length > 0 && (
            <div className="border-t border-gray-100 pt-4">
              <p className="text-gray-400 mb-2 font-sans font-semibold text-xs uppercase tracking-wider">Ban History</p>
              {banHistory.map((b, i) => (
                <div key={i} className="text-gray-700 mb-1">
                  {b.created_at} — {b.action.toUpperCase()}: {b.reason ?? '—'}
                </div>
              ))}
            </div>
          )}

          {decks && decks.length > 0 && (
            <div className="border-t border-gray-100 pt-4">
              <p className="text-gray-400 mb-2 font-sans font-semibold text-xs uppercase tracking-wider">Published Content ({decks.length} decks)</p>
              {decks.map((d, i) => (
                <div key={i} className="text-gray-700">{d.created_at} — {d.title} {d.is_public ? '(public)' : '(private)'}</div>
              ))}
            </div>
          )}

          <button onClick={() => { setReport(null); setSelected(null); setUsers([]); setEmail(''); }}
            className="text-xs text-gray-400 hover:text-gray-600">
            ← New search
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main dashboard ────────────────────────────────────────────────────────────

export default function AdminDashboardClient({ stats }: { stats: Stats }) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('overview');

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST', credentials: 'include' });
    router.replace('/admin/login');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-5 md:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">FlashcardAI Admin</h1>
            <p className="text-gray-400 text-xs mt-0.5">
              {stats.total.toLocaleString()} users · {stats.proUsers} Pro · {stats.pendingReports} pending reports
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="text-xs text-gray-500 hover:text-gray-700 border border-gray-200 hover:border-gray-300 bg-white rounded-lg px-3 py-1.5 transition-colors"
          >
            Sign out
          </button>
        </div>

        <TabBar active={tab} onChange={setTab} pendingReports={stats.pendingReports} />

        {tab === 'overview' && <OverviewTab stats={stats} />}
        {tab === 'reports'  && <ReportsTab />}
        {tab === 'users'    && <UsersTab />}
        {tab === 'police'   && <PoliceReportTab />}
      </div>
    </div>
  );
}
