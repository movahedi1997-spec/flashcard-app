import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Clock } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { BLOG_POSTS } from '@/lib/blog';
import { hreflangAlternates } from '@/lib/hreflang';

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  return {
    title: 'Blog — FlashcardAI',
    description:
      'Study tips, the science behind spaced repetition, privacy news, and more — the FlashcardAI blog.',
    alternates: hreflangAlternates(params.locale, '/blog'),
  };
}

const CATEGORY_COLORS: Record<string, string> = {
  Produkt:    'bg-indigo-50 text-indigo-700',
  Wissenschaft: 'bg-violet-50 text-violet-700',
  Datenschutz: 'bg-emerald-50 text-emerald-700',
  Lerntipps:  'bg-amber-50 text-amber-700',
  Anleitung:  'bg-sky-50 text-sky-700',
};

export default function BlogPage() {
  const [featured, ...rest] = BLOG_POSTS;

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-white pt-20">

        {/* Hero */}
        <section className="relative overflow-hidden bg-slate-950 py-20">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M40 0v40M0 0h40' stroke='%23fff' stroke-width='0.5'/%3E%3C/svg%3E")`,
              backgroundSize: '40px 40px',
            }}
          />
          <div aria-hidden className="pointer-events-none absolute -top-24 left-1/3 h-72 w-72 rounded-full bg-indigo-600/20 blur-3xl" />
          <div className="relative mx-auto max-w-4xl px-6 text-center">
            <span className="mb-4 inline-block rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-400">
              FlashcardAI Blog
            </span>
            <h1 className="text-4xl font-black text-white sm:text-5xl">
              Lernen mit <span className="shimmer-text">Wissenschaft</span>
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-slate-400">
              Tipps, Hintergründe und Anleitungen rund um intelligentes Lernen, Spaced Repetition und FlashcardAI.
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-4xl px-6 py-14">

          {/* Featured post */}
          <Link
            href={`/blog/${featured.slug}`}
            className="group mb-12 flex flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm transition hover:shadow-md sm:flex-row"
          >
            <div className="flex w-full items-center justify-center bg-gradient-to-br from-indigo-50 to-violet-50 p-12 text-7xl sm:w-56 sm:flex-shrink-0 sm:rounded-s-3xl">
              {featured.coverEmoji}
            </div>
            <div className="flex flex-col justify-center p-8">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${CATEGORY_COLORS[featured.category] ?? 'bg-gray-100 text-gray-600'}`}>
                  {featured.category}
                </span>
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <Clock className="h-3 w-3" />
                  {featured.readTime} Min.
                </span>
              </div>
              <h2 className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition">
                {featured.title}
              </h2>
              <p className="mt-2 text-sm text-gray-500 line-clamp-3">{featured.excerpt}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-indigo-600">
                Weiterlesen <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
              </span>
            </div>
          </Link>

          {/* Post grid */}
          <div className="grid gap-6 sm:grid-cols-2">
            {rest.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group flex flex-col rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition hover:shadow-md hover:-translate-y-1"
              >
                <div className="mb-4 text-4xl">{post.coverEmoji}</div>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${CATEGORY_COLORS[post.category] ?? 'bg-gray-100 text-gray-600'}`}>
                    {post.category}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-gray-400">
                    <Clock className="h-3 w-3" />
                    {post.readTime} Min.
                  </span>
                </div>
                <h3 className="text-base font-bold text-gray-900 group-hover:text-indigo-600 transition line-clamp-2">
                  {post.title}
                </h3>
                <p className="mt-2 flex-1 text-sm text-gray-500 line-clamp-3">{post.excerpt}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-indigo-600">
                  Lesen <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
