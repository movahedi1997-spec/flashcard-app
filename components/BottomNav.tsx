'use client';

import { useMemo } from 'react';
import { Link } from '@/i18n/navigation';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { LayoutDashboard, Compass, BookOpen, User, type LucideIcon } from 'lucide-react';

interface Props {
  username?: string | null;
}

type BottomNavItem = {
  key: string;
  href: string;
  icon: LucideIcon;
  labelKey: 'dashboard' | 'explore' | 'myDecks' | 'profile';
  match: string;
};

// Strip optional /<locale> prefix so active-state detection works on any locale.
const LOCALE_PREFIX = /^\/(?:en|de|fr|es|fa)(?=\/|$)/;

function stripLocale(pathname: string): string {
  return pathname.replace(LOCALE_PREFIX, '') || '/';
}

export default function BottomNav({ username }: Props) {
  const pathname = usePathname();
  const t = useTranslations('common.appNav');
  const profileHref = username ? `/creators/${username}` : '/settings';

  const items: BottomNavItem[] = useMemo(
    () => [
      { key: 'dashboard', href: '/dashboard',  icon: LayoutDashboard, labelKey: 'dashboard', match: '/dashboard'  },
      { key: 'decks',     href: '/flashcards', icon: BookOpen,        labelKey: 'myDecks',   match: '/flashcards' },
      { key: 'explore',   href: '/explore',    icon: Compass,         labelKey: 'explore',   match: '/explore'    },
      { key: 'profile',   href: profileHref,   icon: User,            labelKey: 'profile',   match: '/creators'   },
    ],
    [profileHref],
  );

  const stripped = stripLocale(pathname ?? '/');

  return (
    <nav
      className="sm:hidden fixed bottom-0 inset-x-0 z-50 bg-white border-t border-gray-100"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-center h-14">
        {items.map(({ key, href, icon: Icon, labelKey, match }) => {
          const active = stripped.startsWith(match);
          return (
            <Link
              key={key}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={`flex flex-col items-center gap-0.5 flex-1 py-2 text-xs font-medium transition-colors ${
                active ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Icon className={`h-5 w-5 ${active ? 'stroke-[2.5]' : ''}`} aria-hidden="true" />
              <span>{t(labelKey)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
