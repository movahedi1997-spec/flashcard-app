'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, X, Layers } from 'lucide-react';

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-md">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-indigo-600">
          <Layers className="h-6 w-6" />
          <span className="text-lg tracking-tight">FlashCard</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/login"
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
          >
            Login
          </Link>
          <Link
            href="/signup"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 active:scale-95"
          >
            Get Started
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-gray-100 bg-white px-6 pb-4 md:hidden">
          <div className="flex flex-col gap-2 pt-3">
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="rounded-lg px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Login
            </Link>
            <Link
              href="/signup"
              onClick={() => setOpen(false)}
              className="rounded-lg bg-indigo-600 px-4 py-2.5 text-center text-sm font-medium text-white hover:bg-indigo-700"
            >
              Get Started
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
