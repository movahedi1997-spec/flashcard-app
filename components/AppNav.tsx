import Link from 'next/link';
import { BookOpen, Compass, User, Settings } from 'lucide-react';
import FlashLogoMark from './FlashLogoMark';
import LogoutButton from './LogoutButton';
import BottomNav from './BottomNav';

export type ActivePage = 'decks' | 'explore' | 'profile' | 'settings';

interface Props {
  username?: string | null;
  activePage?: ActivePage;
}

const NAV_ITEMS = [
  { key: 'decks',    href: '/flashcards', icon: BookOpen, label: 'My Decks' },
  { key: 'explore',  href: '/explore',    icon: Compass,  label: 'Explore'  },
  { key: 'settings', href: '/settings',   icon: Settings, label: 'Settings' },
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
          {/* Logo — always visible */}
          <Link href="/" className="flex items-center gap-2 font-bold text-gray-900">
            <FlashLogoMark size={28} />
            <span className="text-sm">
              Flashcard<span className="text-violet-600">AI</span>
            </span>
          </Link>

          {/* Desktop nav — hidden on mobile (BottomNav takes over) */}
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

            <LogoutButton />
          </nav>
        </div>
      </header>

      {/* Mobile bottom nav */}
      <BottomNav username={username} />
    </>
  );
}
