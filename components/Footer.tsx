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
                Flashcard<span className="text-violet-600">AI</span>
              </span>
            </Link>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-gray-400">
              Intelligentes Lernen mit Spaced Repetition — kostenlos, datenschutzkonform und offline-fähig.
            </p>

            {/* Trust badges */}
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-500">
                🇩🇪 Made in Germany
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-500">
                🔒 DSGVO konform
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-500">
                🆓 Kostenlos
              </span>
            </div>

            <p className="mt-5 text-xs text-gray-300">
              © {new Date().getFullYear()} FlashcardAI. Alle Rechte vorbehalten.
            </p>
          </div>

          {/* Product links */}
          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-gray-400">Produkt</p>
            <nav className="flex flex-col gap-2.5 text-sm text-gray-500">
              <a href="#how-it-works" className="transition hover:text-indigo-600">Wie es funktioniert</a>
              <a href="#features"     className="transition hover:text-indigo-600">Features</a>
              <a href="#subjects"     className="transition hover:text-indigo-600">Fachbereiche</a>
              <Link href="/explore"   className="transition hover:text-indigo-600">Decks entdecken</Link>
              <Link href="/blog"      className="transition hover:text-indigo-600">Blog</Link>
              <Link href="/signup"    className="transition hover:text-indigo-600">Kostenlos starten</Link>
            </nav>
          </div>

          {/* Account */}
          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-gray-400">Account</p>
            <nav className="flex flex-col gap-2.5 text-sm text-gray-500">
              <Link href="/login"     className="transition hover:text-indigo-600">Anmelden</Link>
              <Link href="/signup"    className="transition hover:text-indigo-600">Registrieren</Link>
              <Link href="/dashboard" className="transition hover:text-indigo-600">Dashboard</Link>
              <Link href="/settings"  className="transition hover:text-indigo-600">Einstellungen</Link>
            </nav>
          </div>
        </div>

        {/* Legal bar */}
        <div className="mt-10 border-t border-gray-100 pt-6 flex flex-wrap items-center justify-between gap-4">
          <p className="text-xs text-gray-300">© {new Date().getFullYear()} FlashcardAI — Mohammad M. Movahedi Najafabadi</p>
          <nav className="flex flex-wrap gap-4 text-xs text-gray-400">
            <Link href="/privacy"   className="transition hover:text-indigo-600">Privacy Policy</Link>
            <Link href="/terms"     className="transition hover:text-indigo-600">Terms of Service</Link>
            <Link href="/cookies"   className="transition hover:text-indigo-600">Cookie Policy</Link>
            <Link href="/impressum" className="transition hover:text-indigo-600">Impressum</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
