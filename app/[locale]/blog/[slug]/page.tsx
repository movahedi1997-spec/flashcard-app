import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { ArrowLeft, Clock } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { BLOG_POSTS, getBlogPost } from '@/lib/blog';

type Props = { params: { slug: string; locale: string } };

// fa uses -u-nu-latn so dates render with Western digits (8 instead of ۸),
// matching the Western numerals used throughout the Persian translation strings.
const DATE_LOCALE_MAP: Record<string, string> = {
  en: 'en-US',
  de: 'de-DE',
  fr: 'fr-FR',
  es: 'es-ES',
  fa: 'fa-IR-u-nu-latn',
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = getBlogPost(params.slug);
  if (!post) return { title: 'Nicht gefunden' };
  return {
    title: `${post.title} — FlashcardAI Blog`,
    description: post.excerpt,
  };
}

export function generateStaticParams() {
  return BLOG_POSTS.map((p) => ({ slug: p.slug }));
}

const CATEGORY_COLORS: Record<string, string> = {
  Produkt:     'bg-indigo-50 text-indigo-700',
  Wissenschaft:'bg-violet-50 text-violet-700',
  Datenschutz: 'bg-emerald-50 text-emerald-700',
  Lerntipps:   'bg-amber-50 text-amber-700',
  Anleitung:   'bg-sky-50 text-sky-700',
};

export default async function BlogPostPage({ params }: Props) {
  const post = getBlogPost(params.slug);
  if (!post) notFound();

  const otherPosts = BLOG_POSTS.filter((p) => p.slug !== post.slug).slice(0, 3);
  const t = await getTranslations('blog');

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-white pt-20">

        {/* Post header */}
        <header className="relative overflow-hidden bg-slate-950 py-16">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M40 0v40M0 0h40' stroke='%23fff' stroke-width='0.5'/%3E%3C/svg%3E")`,
              backgroundSize: '40px 40px',
            }}
          />
          <div aria-hidden className="pointer-events-none absolute -top-24 left-1/4 h-64 w-64 rounded-full bg-indigo-600/20 blur-3xl" />

          <div className="relative mx-auto max-w-3xl px-6">
            <Link
              href="/blog"
              className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 transition hover:text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              {t('backToAll')}
            </Link>

            <div className="mb-4 flex flex-wrap items-center gap-3">
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${CATEGORY_COLORS[post.category] ?? 'bg-gray-100 text-gray-600'}`}>
                {post.category}
              </span>
              <span className="flex items-center gap-1 text-xs text-slate-400">
                <Clock className="h-3 w-3" />
                {post.readTime} {t('readingTimeSuffix')}
              </span>
              <span className="text-xs text-slate-500">
                {new Date(post.date).toLocaleDateString(DATE_LOCALE_MAP[params.locale] ?? 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>

            <div className="mb-4 text-5xl">{post.coverEmoji}</div>
            <h1 className="text-3xl font-black text-white sm:text-4xl leading-snug">
              {post.title}
            </h1>
            <p className="mt-4 text-slate-400 leading-relaxed">{post.excerpt}</p>
          </div>
        </header>

        {/* Article body */}
        <article className="mx-auto max-w-3xl px-6 py-14">
          <div
            className="prose prose-gray max-w-none
              prose-headings:font-bold prose-headings:text-gray-900
              prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
              prose-p:text-gray-600 prose-p:leading-relaxed
              prose-ul:text-gray-600 prose-li:my-1
              prose-ol:text-gray-600
              prose-strong:text-gray-900
              prose-a:text-indigo-600 prose-a:no-underline hover:prose-a:underline"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* CTA */}
          <div className="mt-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 p-8 text-center text-white">
            <p className="text-lg font-bold">{t('ctaHeading')}</p>
            <p className="mt-1 text-sm text-indigo-200">{t('ctaSubheading')}</p>
            <Link
              href="/signup"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-2.5 text-sm font-bold text-indigo-700 transition hover:bg-indigo-50"
            >
              {t('ctaButton')}
            </Link>
          </div>
        </article>

        {/* More posts */}
        {otherPosts.length > 0 && (
          <section className="border-t border-gray-100 bg-gray-50 py-14">
            <div className="mx-auto max-w-3xl px-6">
              <h2 className="mb-6 text-lg font-bold text-gray-900">{t('moreArticles')}</h2>
              <div className="grid gap-4 sm:grid-cols-3">
                {otherPosts.map((p) => (
                  <Link
                    key={p.slug}
                    href={`/blog/${p.slug}`}
                    className="group rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition hover:shadow-md hover:-translate-y-1"
                  >
                    <div className="mb-2 text-3xl">{p.coverEmoji}</div>
                    <p className="text-sm font-bold text-gray-900 group-hover:text-indigo-600 transition line-clamp-2">
                      {p.title}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">{p.readTime} {t('minAbbr')}</p>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
