import Link from 'next/link';
import { LayoutDashboard, BookOpen, Compass, User, Settings } from 'lucide-react';
import NavLogo from './NavLogo';
import BottomNav from './BottomNav';

export type ActivePage = 'decks' | 'explore' | 'profile' | 'settings';

interface Props {
  username?: string | null;
  activePage?: ActivePage;
}

const NAV_ITEMS = [
  { key: 'dashboard', href: '/dashboard',  icon: LayoutDashboard, label: 'Dashboard' },
  { key: 'decks',     href: '/flashcards', icon: BookOpen,         label: 'My Decks'  },
  { key: 'explore',   href: '/explore',    icon: Compass,          label: 'Explore'   },
  { key: 'settings',  href: '/settings',   icon: Settings,         label: 'Settings'  },
] as const;

export default function AppNav({ username, activePage }: Props) {
  const profileHref = username ? `/creators/${username}` : '/settings';

  return (
    <>
      <header
        className="border-b border-gray-100 bg-white sticky top-0 z-40"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <NavLogo />

          {/* Desktop nav only — BottomNav handles mobile */}
          <nav className="hidden sm:flex items-center gap-0.5">
            {NAV_ITEMS.map(({ key, href, icon: Icon, label }) => {
              const active = activePage === key;
              return (
                <Link
                  key={key}
                  href={href}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
                    active
                      ? 'bg-indigo-50 text-indigo-600'
                      : 'text-gray-600 hover:bg-indigo-50 hover:text-indigo-600'
                  }`}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  <span>{label}</span>
                </Link>
              );
            })}

            <Link
              href={profileHref}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
                activePage === 'profile'
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'text-gray-600 hover:bg-indigo-50 hover:text-indigo-600'
              }`}
            >
              <User className="h-4 w-4 flex-shrink-0" />
              <span>Profile</span>
            </Link>
          </nav>
        </div>
      </header>

      <BottomNav username={username} />
    </>
  );
}
