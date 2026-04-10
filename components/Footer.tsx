import Link from 'next/link';
import { Layers } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-white py-12">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
          {/* Logo + tagline */}
          <div>
            <Link
              href="/"
              className="flex items-center gap-2 font-bold text-indigo-600"
            >
              <Layers className="h-5 w-5" />
              <span>FlashCard</span>
            </Link>
            <p className="mt-1 text-sm text-gray-400">
              Study smarter, not harder.
            </p>
          </div>

          {/* Links */}
          <nav className="flex gap-6 text-sm text-gray-500">
            <a href="#features" className="transition hover:text-indigo-600">
              Features
            </a>
            <Link href="/login" className="transition hover:text-indigo-600">
              Login
            </Link>
            <Link href="/signup" className="transition hover:text-indigo-600">
              Sign Up
            </Link>
          </nav>
        </div>

        <p className="mt-8 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} FlashCard. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
