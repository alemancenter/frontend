'use client';

import Link from 'next/link';
import Image from '@/components/common/AppImage';
import { BookOpen, CalendarDays, Newspaper } from 'lucide-react';
import { getStorageUrl } from '@/lib/utils';
import type { Article, Post } from '@/types';
import type { HomeAdSettings, HomeCountry } from './HomeTypes';
import HomeAds from './HomeAds';

type HomeEditorialSectionProps = {
  country: HomeCountry;
  articles?: Article[];
  posts?: Post[];
  featuredPosts?: Post[];
  mounted: boolean;
  adSettings?: HomeAdSettings;
};

function stripHtml(value?: string) {
  return (value || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function formatDate(value?: string) {
  if (!value) return '';
  return new Date(value).toLocaleDateString('ar-JO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function PostCard({ post, countryCode, featured = false }: { post: Post; countryCode: string; featured?: boolean }) {
  const image = getStorageUrl(post.image_url || post.image);
  const excerpt = stripHtml(post.meta_description || post.content);

  return (
    <Link
      href={`/${countryCode}/posts/${post.id}`}
      className="group block h-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-blue-200 hover:shadow-lg"
    >
      {image && (
        <div className={featured ? 'relative aspect-[16/9] bg-slate-100' : 'relative aspect-[5/3] bg-slate-100'}>
          <Image
            src={image}
            alt={post.title}
            fill
            sizes={featured ? '(max-width: 1024px) 100vw, 33vw' : '(max-width: 1024px) 100vw, 25vw'}
            className="object-cover transition duration-500 group-hover:scale-105"
          />
        </div>
      )}
      <div className="p-5">
        <div className="mb-3 flex items-center gap-2 text-xs font-medium text-slate-500">
          <Newspaper className="h-4 w-4 text-blue-500" />
          {formatDate(post.created_at)}
        </div>
        <h3 className="line-clamp-2 text-lg font-bold leading-snug text-slate-900 transition group-hover:text-blue-600">
          {post.title}
        </h3>
        {excerpt && <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">{excerpt}</p>}
      </div>
    </Link>
  );
}

function ArticleCard({ article, countryCode }: { article: Article; countryCode: string }) {
  const image = getStorageUrl(article.image_url || article.image);
  const excerpt = stripHtml(article.meta_description || article.content);

  return (
    <Link
      href={`/${countryCode}/lesson/articles/${article.id}`}
      className="group flex h-full gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-emerald-200 hover:shadow-lg"
    >
      <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-xl bg-slate-100">
        {image ? (
          <Image
            src={image}
            alt={article.title}
            fill
            sizes="96px"
            className="object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-emerald-50 text-emerald-600">
            <BookOpen className="h-6 w-6" />
          </div>
        )}
      </div>
      <div className="min-w-0">
        <div className="mb-2 flex items-center gap-2 text-xs font-medium text-slate-500">
          <CalendarDays className="h-3.5 w-3.5 text-emerald-500" />
          {formatDate(article.created_at)}
        </div>
        <h3 className="line-clamp-2 font-bold leading-snug text-slate-900 transition group-hover:text-emerald-600">
          {article.title}
        </h3>
        {excerpt && <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{excerpt}</p>}
      </div>
    </Link>
  );
}

export default function HomeEditorialSection({
  country,
  articles,
  posts,
  featuredPosts,
  mounted,
  adSettings,
}: HomeEditorialSectionProps) {
  const featured = (featuredPosts || []).filter((post) => post.is_active !== false).slice(0, 3);
  const latestPosts = (posts || []).filter((post) => post.is_active !== false).slice(0, 4);
  const latestArticles = (articles || []).filter((article) => article.status !== false).slice(0, 4);
  const hasFeatured = featured.length > 0;
  const hasLatest = latestPosts.length > 0 || latestArticles.length > 0;

  if (!hasFeatured && !hasLatest) return null;

  return (
    <section className="bg-[#f8f9fa] py-8">
      <div className="container mx-auto px-4">
        {hasFeatured && (
          <div className="mb-10">
            <div className="mb-6 flex items-center justify-between gap-4">
              <h2 className="text-2xl font-bold text-slate-900">المنشورات المميزة</h2>
              <Link href={`/${country.code}/posts`} className="text-sm font-semibold text-blue-600 hover:text-blue-700">
                عرض الكل
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {featured.map((post) => (
                <PostCard key={post.id} post={post} countryCode={country.code} featured />
              ))}
            </div>
          </div>
        )}

        {hasFeatured && hasLatest && (
          <HomeAds mounted={mounted} adSettings={adSettings} slot="secondary" className="my-10" />
        )}

        {hasLatest && (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {latestArticles.length > 0 && (
              <div>
                <h2 className="mb-6 text-2xl font-bold text-slate-900">أحدث المقالات التعليمية</h2>
                <div className="grid grid-cols-1 gap-4">
                  {latestArticles.map((article) => (
                    <ArticleCard key={article.id} article={article} countryCode={country.code} />
                  ))}
                </div>
              </div>
            )}

            {latestPosts.length > 0 && (
              <div>
                <h2 className="mb-6 text-2xl font-bold text-slate-900">أحدث المنشورات</h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {latestPosts.map((post) => (
                    <PostCard key={post.id} post={post} countryCode={country.code} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
