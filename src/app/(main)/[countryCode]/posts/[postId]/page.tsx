import { notFound } from 'next/navigation';
import { API_ENDPOINTS, COUNTRIES } from '@/lib/api/config';
import { apiClient } from '@/lib/api/client';
import { Metadata } from 'next';
import { headers } from 'next/headers';
import { cache } from 'react';
import PostView from '@/components/posts/PostView';
import { safeJsonLd } from '@/lib/utils';
import { getFrontSettings } from '@/lib/front-settings';

// Use ISR with revalidation for better performance
export const revalidate = 120;

const getPost = cache(async (countryCode: string, postId: string) => {
  const normalizedCountry = (countryCode || '').toString().trim().toLowerCase();
  const normalizedPostId = (postId || '').toString().trim();

  // Guard invalid route params to avoid noisy backend 404 logs.
  if (!COUNTRIES.some((country) => country.code === normalizedCountry)) {
    return null;
  }

  if (!/^\d+$/.test(normalizedPostId)) {
    return null;
  }

  try {
    const response = await apiClient.get<any>(
      API_ENDPOINTS.POSTS.SHOW_PUBLIC(normalizedPostId),
      { country: normalizedCountry, database: normalizedCountry },
      { next: { revalidate: 120 } } as any
    );
    return response.data.data;
  } catch (err: any) {
    // 404 is expected for unknown posts; page will render notFound().
    if (err?.status === 404) {
      return null;
    }
    console.error('Error fetching post:', err);
    return null;
  }
});

async function getPublicSettings(): Promise<Record<string, string | null>> {
  return getFrontSettings();
}

interface PageProps {
  params: Promise<{ countryCode: string; postId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { countryCode, postId } = await params;

  // Fetch post and public settings in parallel for SEO metadata
  const [post, settings] = await Promise.all([
    getPost(countryCode, postId),
    getPublicSettings(),
  ]);

  if (!post) {
    return {
      title: 'المقال غير موجود',
      robots: { index: false },
    };
  }

  // Locale mapping based on country
  const localeMap: Record<string, string> = { sa: 'ar_SA', eg: 'ar_EG', ps: 'ar_PS', jo: 'ar_JO' };
  const ogLocale = localeMap[countryCode] || 'ar_JO';

  // Site name from settings
  const rawSiteName = (settings.site_name || (settings as any).siteName || '').toString().trim();
  const resolvedSiteName = rawSiteName || 'منصة التعليم';

  // Build base URL from canonical/site_url settings
  const rawBaseUrl = (settings.canonical_url || (settings as any).site_url || '').toString().trim();
  let baseUrl: string | undefined;
  if (rawBaseUrl) {
    const withProtocol = /^https?:\/\//i.test(rawBaseUrl) ? rawBaseUrl : `https://${rawBaseUrl}`;
    try {
      const url = new URL(withProtocol);
      baseUrl = url.origin;
    } catch {
      baseUrl = undefined;
    }
  }

  const pagePath = `/${countryCode}/posts/${postId}`;
  const canonicalUrl = baseUrl ? `${baseUrl}${pagePath}` : pagePath;

  // Description from meta_description or plain text excerpt
  const plainContent = (post.content || '').replace(/<[^>]*>/g, '');
  const fallbackDescription = plainContent.substring(0, 160).trim() || post.title;
  const description = post.meta_description || fallbackDescription;

  // Open Graph image
  const fallbackOgImage = '/assets/img/front-pages/icons/articles_default_image.webp';
  const rawImageUrl = post.image_url || post.image || fallbackOgImage;
  const ogImage = rawImageUrl.startsWith('http')
    ? rawImageUrl
    : baseUrl
      ? `${baseUrl}${rawImageUrl.startsWith('/') ? '' : '/'}${rawImageUrl}`
      : rawImageUrl;
  const ogImageSecure = ogImage.replace(/^http:\/\//i, 'https://');

  // Keywords normalization (string or array)
  let keywordsList: string[] | undefined;
  if (Array.isArray(post.keywords)) {
    keywordsList = post.keywords
      .map((k: any) => (typeof k === 'string' ? k : k.keyword || ''))
      .filter(Boolean);
  } else if (typeof post.keywords === 'string') {
    keywordsList = post.keywords
      .split(',')
      .map((k: string) => k.trim())
      .filter(Boolean);
  }

  // Twitter handle logic (optional)
  const siteTwitterHandle = '@site_handle'; // TODO: اجلب من إعدادات الموقع عند توفره
  const authorTwitterHandle = post.author?.twitter_handle
    ? (post.author.twitter_handle.startsWith('@') ? post.author.twitter_handle : `@${post.author.twitter_handle}`)
    : undefined;

  const sectionName = post.category?.name || undefined;

  const pageTitle = (post.title || '').trim();
  const metaTitle = pageTitle && resolvedSiteName
    ? `${pageTitle} | ${resolvedSiteName}`
    : pageTitle || resolvedSiteName;

  return {
    title: metaTitle,
    description,
    keywords: keywordsList,
    robots: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
    },
    openGraph: {
      title: pageTitle || metaTitle,
      description,
      type: 'article',
      url: canonicalUrl,
      siteName: resolvedSiteName,
      locale: ogLocale,
      publishedTime: post.created_at,
      modifiedTime: post.updated_at,
      authors: post.author ? [post.author.name] : undefined,
      section: sectionName,
      tags: keywordsList,
      images: ogImage
        ? [
            {
              url: ogImage,
              secureUrl: ogImageSecure,
              width: 1200,
              height: 630,
              alt: pageTitle || metaTitle,
            },
          ]
        : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: pageTitle || metaTitle,
      description,
      images: ogImage ? [ogImageSecure] : [],
      site: siteTwitterHandle,
      creator: authorTwitterHandle,
    },
    alternates: {
      canonical: canonicalUrl,
    },
  };
}


export default async function PostPage({
  params
}: PageProps) {
  const { countryCode, postId } = await params;

  // Fetch post and settings in parallel
  const [post, settings] = await Promise.all([
    getPost(countryCode, postId),
    getPublicSettings(),
  ]);

  if (!post) {
    notFound();
  }

  // Extract ad settings for posts/news pages
  const adSettings = {
    googleAdsDesktop: settings.google_ads_desktop_news || '',
    googleAdsMobile: settings.google_ads_mobile_news || '',
    googleAdsDesktop2: settings.google_ads_desktop_news_2 || '',
    googleAdsMobile2: settings.google_ads_mobile_news_2 || '',
  };

  const headersList = await headers();
  const host = headersList.get('host') || 'localhost:3000';
  const protocol = headersList.get('x-forwarded-proto') || 'http';
  const currentUrl = `${protocol}://${host}/${countryCode}/posts/${postId}`;

  // Build base URL and site name at runtime for JSON-LD
  const siteNameRuntime = (settings.site_name || (settings as any).siteName || '').toString().trim();
  const resolvedSiteName = siteNameRuntime || 'منصة التعليم';

  const rawBaseUrlRuntime = (settings.canonical_url || (settings as any).site_url || '').toString().trim();
  let baseUrl: string | undefined;
  if (rawBaseUrlRuntime) {
    const withProtocol = /^https?:\/\//i.test(rawBaseUrlRuntime) ? rawBaseUrlRuntime : `https://${rawBaseUrlRuntime}`;
    try {
      const url = new URL(withProtocol);
      baseUrl = url.origin;
    } catch {
      baseUrl = undefined;
    }
  }

  const fallbackOgImage = '/assets/img/front-pages/icons/articles_default_image.webp';
  const rawImageUrl = post.image_url || post.image || fallbackOgImage;
  const ogImage = rawImageUrl.startsWith('http')
    ? rawImageUrl
    : baseUrl
      ? `${baseUrl}${rawImageUrl.startsWith('/') ? '' : '/'}${rawImageUrl}`
      : rawImageUrl;

  let keywordsString: string | undefined;
  if (typeof post.keywords === 'string') {
    keywordsString = post.keywords;
  } else if (Array.isArray(post.keywords)) {
    keywordsString = post.keywords
      .map((k: any) => (typeof k === 'string' ? k : k.keyword || ''))
      .filter(Boolean)
      .join(', ');
  }

  const mainEntityId = baseUrl ? `${baseUrl}/${countryCode}/posts/${postId}` : currentUrl;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    image: ogImage ? [ogImage] : [],
    datePublished: post.created_at,
    dateModified: post.updated_at || post.created_at,
    author: {
      '@type': 'Person',
      name: post.author?.name || 'Admin',
      url: (baseUrl ? `${baseUrl}/members` : '/members') + (post.author?.id ? `?user_id=${post.author.id}` : ''),
    },
    publisher: {
      '@type': 'Organization',
      name: resolvedSiteName,
      logo: {
        '@type': 'ImageObject',
        url: baseUrl ? `${baseUrl}/logo.png` : '/logo.png',
      },
    },
    description: post.meta_description || post.title,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': mainEntityId,
    },
    keywords: keywordsString,
    articleSection: post.category?.name || undefined,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
      />
      <PostView post={post} countryCode={countryCode} currentUrl={currentUrl} adSettings={adSettings} />
    </>
  );
}
