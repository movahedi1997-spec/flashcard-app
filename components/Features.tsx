import {
  Brain, Zap, CalendarClock, WifiOff, BarChart3, Users,
  Shield, Globe, Smartphone,
} from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function Features() {
  const t = useTranslations('home.features');

  const FEATURES = [
    {
      icon: Brain,
      color: 'text-indigo-400',
      ring: 'ring-indigo-500/20',
      bg: 'bg-indigo-500/10',
      title: t('dailyReviewTitle'),
      description: t('dailyReviewDesc'),
      badge: t('dailyReviewBadge'),
    },
    {
      icon: Zap,
      color: 'text-amber-400',
      ring: 'ring-amber-500/20',
      bg: 'bg-amber-500/10',
      title: t('turboTitle'),
      description: t('turboDesc'),
      badge: t('turboBadge'),
    },
    {
      icon: CalendarClock,
      color: 'text-violet-400',
      ring: 'ring-violet-500/20',
      bg: 'bg-violet-500/10',
      title: t('schedulingTitle'),
      description: t('schedulingDesc'),
      badge: t('schedulingBadge'),
    },
    {
      icon: WifiOff,
      color: 'text-rose-400',
      ring: 'ring-rose-500/20',
      bg: 'bg-rose-500/10',
      title: t('offlineTitle'),
      description: t('offlineDesc'),
      badge: t('offlineBadge'),
    },
    {
      icon: BarChart3,
      color: 'text-cyan-400',
      ring: 'ring-cyan-500/20',
      bg: 'bg-cyan-500/10',
      title: t('dashboardTitle'),
      description: t('dashboardDesc'),
      badge: t('dashboardBadge'),
    },
    {
      icon: Users,
      color: 'text-emerald-400',
      ring: 'ring-emerald-500/20',
      bg: 'bg-emerald-500/10',
      title: t('communityTitle'),
      description: t('communityDesc'),
      badge: t('communityBadge'),
    },
    {
      icon: Globe,
      color: 'text-sky-400',
      ring: 'ring-sky-500/20',
      bg: 'bg-sky-500/10',
      title: t('profilesTitle'),
      description: t('profilesDesc'),
      badge: t('profilesBadge'),
    },
    {
      icon: Shield,
      color: 'text-green-400',
      ring: 'ring-green-500/20',
      bg: 'bg-green-500/10',
      title: t('privacyTitle'),
      description: t('privacyDesc'),
      badge: t('privacyBadge'),
    },
    {
      icon: Smartphone,
      color: 'text-pink-400',
      ring: 'ring-pink-500/20',
      bg: 'bg-pink-500/10',
      title: t('installTitle'),
      description: t('installDesc'),
      badge: t('installBadge'),
    },
  ];

  return (
    <section id="features" className="relative bg-slate-950 py-24 overflow-hidden">
      {/* Graph paper overlay */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M40 0v40M0 0h40' stroke='%23fff' stroke-width='0.5'/%3E%3C/svg%3E")`,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Accent orb */}
      <div aria-hidden className="pointer-events-none absolute top-0 right-0 h-[600px] w-[600px] -translate-y-1/2 translate-x-1/2 rounded-full bg-indigo-600/10 blur-3xl" />

      <div className="relative mx-auto max-w-6xl px-6">
        {/* Heading */}
        <div className="mb-16 max-w-2xl">
          <span className="mb-3 inline-block rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-400">
            {t('badge')}
          </span>
          <h2 className="text-4xl font-black tracking-tight text-white sm:text-5xl">
            {t('heading')}<br />
            <span className="shimmer-text">{t('headingAccent')}</span>
          </h2>
          <p className="mt-4 text-slate-400 leading-relaxed">
            {t('subtext')}
          </p>
        </div>

        {/* Grid */}
        <div className="grid gap-px overflow-hidden rounded-2xl border border-white/5 bg-white/5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, color, ring, bg, title, description, badge }) => (
            <div
              key={title}
              className="group relative bg-slate-900/80 p-7 transition duration-300 hover:bg-slate-800/80"
            >
              {/* Icon */}
              <div className={`mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl ${bg} ring-1 ${ring}`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>

              {/* Badge */}
              <span className="mb-3 inline-block rounded-full bg-white/5 px-2.5 py-0.5 text-xs font-medium text-slate-400">
                {badge}
              </span>

              <h3 className="mb-2 text-base font-bold text-white">{title}</h3>
              <p className="text-sm leading-relaxed text-slate-400">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
