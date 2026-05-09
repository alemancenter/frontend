import { API_CONFIG } from '@/lib/api/config';
import { ssrFetch, getSSRHeaders } from '@/lib/api/ssr-fetch';

const FEED_REVALIDATE_SECONDS = 3600;

interface FeedPost {
  id: number;
  title: string;
  slug?: string;
  content?: string;
  meta_description?: string;
  image?: string;
  category?: { name?: string };
  author?: { name?: string };
  created_at?: string;
  updated_at?: string;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).replace(/\s+\S*$/, '') + '...';
}

function resolveSiteUrl(): string {
  const raw = (process.env.NEXT_PUBLIC_APP_URL || '').trim();
  if (!raw) return 'http://localhost:3000';

  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    return new URL(withProtocol).origin;
  } catch {
    return 'http://localhost:3000';
  }
}

function toRfc822(dateStr: string): string {
  try {
    return new Date(dateStr).toUTCString();
  } catch {
    return new Date().toUTCString();
  }
}

async function fetchRecentPosts(): Promise<FeedPost[]> {
  const baseUrl = API_CONFIG.INTERNAL_URL.replace(/\/+$/, '');

  try {
    const res = await ssrFetch(`${baseUrl}/posts?per_page=30&sort_by=created_at&sort_dir=desc&country=1`, {
      next: { revalidate: FEED_REVALIDATE_SECONDS },
      headers: getSSRHeaders('1'),
    });

    if (!res.ok) return [];

    const json = await res.json().catch(() => null);
    if (!json) return [];

    const data = json?.data?.data ?? json?.data ?? json ?? [];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

async function fetchSettings(): Promise<Record<string, string | null>> {
  const baseUrl = API_CONFIG.INTERNAL_URL.replace(/\/+$/, '');

  try {
    const res = await ssrFetch(`${baseUrl}/front/settings`, {
      next: { revalidate: FEED_REVALIDATE_SECONDS },
      headers: getSSRHeaders(),
    });

    if (!res.ok) return {};

    const json = await res.json().catch(() => null);
    if (!json) return {};

    const body = json?.data ?? json;
    const settings = body?.settings ?? body?.data ?? body;
    return settings && typeof settings === 'object' ? settings : {};
  } catch {
    return {};
  }
}

export const revalidate = 3600;

export async function GET(): Promise<Response> {
  const [posts, settings] = await Promise.all([
    fetchRecentPosts(),
    fetchSettings(),
  ]);

  const siteUrl = resolveSiteUrl();
  const siteName = (settings.site_name || (settings as any).siteName || '').toString().trim()
    || 'منصة التعليم';
  const siteDescription = (settings.meta_description || settings.site_description || '').toString().trim()
    || 'المنصة التعليمية الرائدة للأخبار التربوية والمناهج الدراسية ونتائج الامتحانات';
  const now = new Date().toUTCString();

  const itemsXml = posts
    .filter((p) => p.title && p.id)
    .map((post) => {
      const postUrl = `${siteUrl}/jo/posts/${post.id}`;
      const description = post.meta_description
        || (post.content ? truncate(stripHtml(post.content), 300) : '');
      const pubDate = post.created_at ? toRfc822(post.created_at) : now;
      const category = post.category?.name || '';

      return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${escapeXml(postUrl)}</link>
      <guid isPermaLink="true">${escapeXml(postUrl)}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${escapeXml(description)}</description>${
        category ? `\n      <category>${escapeXml(category)}</category>` : ''
      }${
        post.author?.name ? `\n      <author>${escapeXml(post.author.name)}</author>` : ''
      }
    </item>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(siteName)}</title>
    <link>${escapeXml(siteUrl)}</link>
    <description>${escapeXml(siteDescription)}</description>
    <language>ar</language>
    <lastBuildDate>${now}</lastBuildDate>
    <generator>Next.js</generator>
    <atom:link href="${escapeXml(`${siteUrl}/rss.xml`)}" rel="self" type="application/rss+xml" />
${itemsXml}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': `public, s-maxage=${FEED_REVALIDATE_SECONDS}, stale-while-revalidate=86400`,
    },
  });
}
