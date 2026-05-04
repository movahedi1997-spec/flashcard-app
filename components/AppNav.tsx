import { Link } from '@/i18n/navigation';
import { LayoutDashboard, BookOpen, Compass, User, Settings, BarChart2, type LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import NavLogo from './NavLogo';
import BottomNav from './BottomNav';
import LocaleSwitcher from './LocaleSwitcher';

export type ActivePage = 'dashboard' | 'decks' | 'explore' | 'profile' | 'settings' | 'stats';

interface Props {
  username?: string | null;
  activePage?: ActivePage;
}

type NavItem = {
  key: ActivePage;
  href: string;
  icon: LucideIcon;
  labelKey: 'dashboard' | 'myDecks' | 'explore' | 'analytics' | 'settings' | 'profile';
};

const linkClass = (active: boolean) =>
  `inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
    active
      ? 'bg-indigo-50 text-indigo-600'
      : 'text-gray-600 hover:bg-indigo-50 hover:text-indigo-600'
  }`;

export default function AppNav({ username, activePage }: Props) {
  const t = useTranslations('common.appNav');
  const profileHref = username ? `/creators/${username}` : '/settings';

  const navItems: NavItem[] = [
    { key: 'dashboard', href: '/dashboard',  icon: LayoutDashboard, labelKey: 'dashboard' },
    { key: 'decks',     href: '/flashcards', icon: BookOpen,        labelKey: 'myDecks'   },
    { key: 'explore',   href: '/explore',    icon: Compass,         labelKey: 'explore'   },
    { key: 'stats',     href: '/stats',      icon: BarChart2,       labelKey: 'analytics' },
    { key: 'settings',  href: '/settings',   icon: Settings,        labelKey: 'settings'  },
    { key: 'profile',   href: profileHref,   icon: User,            labelKey: 'profile'   },
  ];

  return (
    <>
      <header
        className="border-b border-gray-100 bg-white sticky top-0 z-40"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <NavLogo />

          {/* Mobile right side: locale switcher + settings shortcut on dashboard */}
          <div className="flex items-center gap-1 sm:hidden">
            <LocaleSwitcher />
            {activePage === 'dashboard' && (
              <Link
                href="/settings"
                aria-label="Settings"
                className="flex items-center justify-center h-9 w-9 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition"
              >
                <Settings className="h-4 w-4" />
              </Link>
            )}
          </div>

          {/* Desktop nav only — BottomNav handles mobile */}
          <nav className="hidden sm:flex items-center gap-0.5">
            {navItems.map(({ key, href, icon: Icon, labelKey }) => {
              const label = t(labelKey);
              return (
                <Link
                  key={key}
                  href={href}
                  aria-current={activePage === key ? 'page' : undefined}
                  className={linkClass(activePage === key)}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                  <span>{label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <BottomNav username={username} />
    </>
  );
}
