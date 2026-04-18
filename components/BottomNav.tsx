'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Compass, BookOpen, Settings, User } from 'lucide-react';

interface Props {
  username?: string | null;
}

export default function BottomNav({ username }: Props) {
  const pathname = usePathname();
  const profileHref = username ? `/creators/${username}` : '/settings';

  const items = [
    { href: '/dashboard',  icon: LayoutDashboard, label: 'Dashboard', match: '/dashboard' },
    { href: '/explore',    icon: Compass,         label: 'Explore',   match: '/explore'   },
    { href: '/flashcards', icon: BookOpen,         label: 'My Decks',  match: '/flashcards'},
    { href: '/settings',   icon: Settings,         label: 'Settings',  match: '/settings'  },
    { href: profileHref,   icon: User,             label: 'Profile',   match: '/creators'  },
  ];

  return (
    <nav
      className="sm:hidden fixed bottom-0 inset-x-0 z-50 bg-white border-t border-gray-100"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-center h-14">
        {items.map(({ href, icon: Icon, label, match }) => {
          const active = pathname.startsWith(match);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 flex-1 py-2 text-xs font-medium transition-colors ${
                active ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Icon className={`h-5 w-5 ${active ? 'stroke-[2.5]' : ''}`} />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
