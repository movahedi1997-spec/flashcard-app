import Link from 'next/link';
import { ArrowRight, Clock } from 'lucide-react';
import { BLOG_POSTS } from '@/lib/blog';

const CATEGORY_COLORS: Record<string, string> = {
  Produkt:     'bg-indigo-50 text-indigo-700',
  Wissenschaft:'bg-violet-50 text-violet-700',
  Datenschutz: 'bg-emerald-50 text-emerald-700',
  Lerntipps:   'bg-amber-50 text-amber-700',
  Anleitung:   'bg-sky-50 text-sky-700',
};

export default function BlogPreview() {
  const posts = BLOG_POSTS.slice(0, 3);

  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-12 flex items-end justify-between">
          <div>
            <span className="mb-3 inline-block rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
              Blog
            </span>
            <h2 className="text-4xl font-black tracking-tight text-gray-900">
              Wissen, das{' '}
              <span className="gradient-text">hilft</span>
            </h2>
          </div>
          <Link
            href="/blog"
            className="hidden items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:underline sm:flex"
          >
            Alle Artikel
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group flex flex-col rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition hover:shadow-lg hover:-translate-y-1"
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
              <h3 className="flex-1 text-sm font-bold text-gray-900 group-hover:text-indigo-600 transition line-clamp-3">
                {post.title}
              </h3>
              <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-indigo-600">
                Lesen <ArrowRight className="h-3 w-3 transition group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>

        <div className="mt-8 text-center sm:hidden">
          <Link href="/blog" className="text-sm font-semibold text-indigo-600 hover:underline">
            Alle Artikel ansehen →
          </Link>
        </div>
      </div>
    </section>
  );
}
