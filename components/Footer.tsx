import Link from 'next/link';
import FlashLogoMark from './FlashLogoMark';

export default function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-white py-14">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2.5 font-bold text-gray-900">
              <FlashLogoMark size={26} />
              <span className="text-lg tracking-tight">
                Flash<span className="text-indigo-600">Card</span>
              </span>
            </Link>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-gray-400">
              Study smarter with intelligent spaced repetition. Built for medical, pharmacy, and chemistry students who take their exams seriously.
            </p>
            <p className="mt-4 text-xs text-gray-300">
              © {new Date().getFullYear()} FlashCard. All rights reserved.
            </p>
          </div>

          {/* Product links */}
          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-gray-400">Product</p>
            <nav className="flex flex-col gap-2.5 text-sm text-gray-500">
              <a href="#how-it-works" className="transition hover:text-indigo-600">How it works</a>
              <a href="#features"     className="transition hover:text-indigo-600">Features</a>
              <a href="#subjects"     className="transition hover:text-indigo-600">Subject hubs</a>
              <Link href="/signup"    className="transition hover:text-indigo-600">Get started free</Link>
            </nav>
          </div>

          {/* Account links */}
          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-gray-400">Account</p>
            <nav className="flex flex-col gap-2.5 text-sm text-gray-500">
              <Link href="/login"     className="transition hover:text-indigo-600">Log in</Link>
              <Link href="/signup"    className="transition hover:text-indigo-600">Sign up</Link>
              <Link href="/dashboard" className="transition hover:text-indigo-600">Dashboard</Link>
              <Link href="/settings"  className="transition hover:text-indigo-600">Settings</Link>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
}
