import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import { safeJsonLd } from '@/lib/utils';
import ArticleContent from '@/components/article/ArticleContent';
import ArticleContentWrapper from '@/components/article/ArticleContentWrapper';
import SidebarAdWrapper from '@/components/article/SidebarAdWrapper';
import RelatedArticles from '@/components/article/RelatedArticles';
import SeoContentBlock from '@/components/article/SeoContentBlock';
import ArticleComments from '@/components/article/ArticleComments';
import ArticleAds from '@/components/ads/ArticleAds';
import ClassHeader from '@/components/class/ClassHeader';
import { STANDARD_CATEGORIES } from '@/components/subject/SemesterList';
import { Calendar, Eye, User, ChevronLeft, Home } from 'lucide-react';
import { getFrontSettings } from '@/lib/front-settings';
import { getAdLimit, shouldShowAds } from '@/lib/ads-policy';

interface Props {
  params: Promise<{
    countryCode: string;
    id: string;
  }>;
}

// Use ISR with revalidation for better performance
export const revalidate = 120;

// Cached fetch functions - prevents duplicate API calls between generateMetadata and page render
const getArticle = async (id: string, countryCode: string) => {
  try {
    const response = await apiClient.get<any>(
      API_ENDPOINTS.ARTICLES.SHOW_PUBLIC(id),
      { database: countryCode },
      { next: { revalidate: 120 } } as any
    );
    const { data: article, content_with_keywords, author_details, comments, related_articles } = response.data;
    return {
      ...article,
      content: content_with_keywords || article.content,
      author: author_details || article.author,
      comments: comments || [],
      relatedArticles: related_articles || []
    };
  } catch (err) {
    console.error('Error fetching article:', err);
    return null;
  }
};

const getPublicSettings = async (): Promise<Record<string, string | null>> => {
  return getFrontSettings();
};

// Generate Metadata for SEO
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { countryCode, id } = await params;
  const [article, settings] = await Promise.all([
    getArticle(id, countryCode),
    getPublicSettings(),
  ]);

  if (!article) {
    return {
      title: 'مقال غير موجود',
    };
  }

  // Locale mapping
  const localeMap: Record<string, string> = { sa: 'ar_SA', eg: 'ar_EG', ps: 'ar_PS', jo: 'ar_JO' };
  const ogLocale = localeMap[countryCode] || 'ar_JO';

  // Title processing
  const pageTitle = article.title?.trim();
  const siteName = (settings.site_name || (settings as any).siteName || '').toString().trim();
  const resolvedSiteName = siteName || 'منصة التعليم';
  const metaTitle = article.meta_title ? `${pageTitle} - ${article.meta_title}` : `${pageTitle} | ${resolvedSiteName}`;

  // Description
  const description = article.meta_description || article.title;

  // Image processing
  const fallbackOgImage = '/assets/img/front-pages/icons/articles_default_image.webp';
  const rawImageUrl = article.image_url || article.image || fallbackOgImage;

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

  const ogImage = rawImageUrl.startsWith('http')
    ? rawImageUrl
    : baseUrl
      ? `${baseUrl}${rawImageUrl.startsWith('/') ? '' : '/'}${rawImageUrl}`
      : rawImageUrl;
  const ogImageSecure = ogImage.replace(/^http:\/\//i, 'https://');

  // Keywords
  const keywordsList = article.keywords?.map((k: any) => k.keyword) || [];

  // Twitter Handle Logic
  // Assuming we might fetch global settings or use hardcoded default for now if config not available
  const siteTwitterHandle = '@site_handle'; // TODO: اجلب من إعدادات الموقع عند توفره
  const authorTwitterHandle = article.author?.twitter_handle 
    ? (article.author.twitter_handle.startsWith('@') ? article.author.twitter_handle : `@${article.author.twitter_handle}`) 
    : undefined;

  // Construct full section name (Class - Subject - Semester)
  const sectionParts = [
    article.schoolClass?.grade_name,
    article.subject?.subject_name || article.subject?.name,
    article.semester?.semester_name
  ].filter(Boolean);
  const sectionName = sectionParts.length > 0 ? sectionParts.join(' - ') : (article.subject?.name || '');

  return {
    title: metaTitle,
    description: description,
    keywords: keywordsList,
    robots: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
    },
    openGraph: {
      title: article.title,
      description: description,
      url: baseUrl ? `${baseUrl}/${countryCode}/lesson/articles/${id}` : `/${countryCode}/lesson/articles/${id}`,
      siteName: resolvedSiteName,
      locale: ogLocale,
      type: 'article',
      publishedTime: article.created_at,
      modifiedTime: article.updated_at,
      authors: [article.author?.name || 'Admin'],
      section: sectionName,
      tags: keywordsList,
      images: [
        {
          url: ogImage,
          secureUrl: ogImageSecure,
          width: 800,
          height: 600,
          alt: article.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: description,
      images: [ogImageSecure],
      site: siteTwitterHandle,
      creator: authorTwitterHandle,
    },
    alternates: {
      canonical: `/${countryCode}/lesson/articles/${id}`,
    },
    other: {
      'article:published_time': article.created_at,
      'article:modified_time': article.updated_at,
      'article:author': article.author?.name || 'Admin', // Could be a URL to profile
      'article:section': sectionName,
    }
  };
}

export default async function ArticlePage({ params }: Props) {
  const { countryCode, id } = await params;

  // Fetch article and settings in parallel
  const [article, settings] = await Promise.all([
    getArticle(id, countryCode),
    getPublicSettings(),
  ]);

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

  if (!article) {
    notFound();
  }

  const categoryName = STANDARD_CATEGORIES.find(c => c.id === article.file_category)?.name || article.file_category || 'مقال';

  // Extract ad settings for article page
  const adSettings = {
    googleAdsDesktop: settings.google_ads_desktop_article || '',
    googleAdsMobile: settings.google_ads_mobile_article || '',
    googleAdsDesktop2: settings.google_ads_desktop_article_2 || '',
    googleAdsMobile2: settings.google_ads_mobile_article_2 || '',
  };
  const articlePlainText = (article.content || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const articleAdLimit = getAdLimit(articlePlainText.length);
  const showArticleAds = shouldShowAds({
    hasApprovedContent: article.status !== false,
    contentLength: articlePlainText.length,
  });

  // Image processing for JSON-LD
  const fallbackOgImage = '/assets/img/front-pages/icons/articles_default_image.webp';
  const rawImageUrl = article.image_url || article.image || fallbackOgImage;
  const ogImage = rawImageUrl.startsWith('http')
    ? rawImageUrl
    : baseUrl
      ? `${baseUrl}${rawImageUrl.startsWith('/') ? '' : '/'}${rawImageUrl}`
      : rawImageUrl;

  // Construct full section name (Class - Subject - Semester)
  const sectionParts = [
    article.schoolClass?.grade_name,
    article.subject?.subject_name || article.subject?.name,
    article.semester?.semester_name
  ].filter(Boolean);
  const sectionName = sectionParts.length > 0 ? sectionParts.join(' - ') : (article.subject?.name || '');

  // Schema.org Structured Data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.meta_title ? `${article.title} - ${article.meta_title}` : article.title,
    image: [ogImage],
    datePublished: article.created_at,
    dateModified: article.updated_at,
    author: {
      '@type': 'Person',
      name: article.author?.name || 'Admin',
      url: (baseUrl ? `${baseUrl}/members` : '/members') + (article.author?.id ? `?user_id=${article.author.id}` : ''),
    },
    publisher: {
      '@type': 'Organization',
      name: resolvedSiteName,
      logo: {
        '@type': 'ImageObject',
        url: baseUrl ? `${baseUrl}/logo.png` : '/logo.png',
      },
    },
    description: article.meta_description || article.title,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': baseUrl ? `${baseUrl}/${countryCode}/lesson/articles/${id}` : `/${countryCode}/lesson/articles/${id}`
    },
    keywords: article.keywords?.map((k: any) => k.keyword).join(', '),
    articleSection: sectionName,
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* JSON-LD for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
      />

      {/* Header */}
      <ClassHeader title={article.title} />

      {/* Main Content */}
      <div className="container mx-auto px-4 mt-8">
        
        {/* Breadcrumb - Styled like ClassBreadcrumb */}
        <nav aria-label="breadcrumb" className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 mb-8">
          <ol className="flex items-center flex-wrap gap-2 text-sm text-gray-600">
            <li>
              <Link href="/" className="flex items-center hover:text-blue-600 transition-colors">
                <Home size={14} className="ml-1" />
                <span>الرئيسية</span>
              </Link>
            </li>
            <li>
              <ChevronLeft size={14} className="text-gray-400" />
            </li>
            
            {sectionName && (
              <>
                <li className="hidden sm:block">
                  <span className="text-gray-500">{sectionName}</span>
                </li>
                <li className="hidden sm:block">
                  <ChevronLeft size={14} className="text-gray-400" />
                </li>
              </>
            )}

            <li>
              <span className="text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded-full">{categoryName}</span>
            </li>
          </ol>
        </nav>

        {/* Article Metadata Bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                  <User size={16} />
                </div>
                <span className="font-medium text-gray-900">{article.author?.name || 'المسؤول'}</span>
              </div>

              <div className="w-px h-4 bg-gray-200 hidden sm:block" />

              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-gray-400" />
                <span suppressHydrationWarning>{new Date(article.created_at).toLocaleDateString('ar-JO', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>

              <div className="w-px h-4 bg-gray-200 hidden sm:block" />

              <div className="flex items-center gap-2">
                <Eye size={16} className="text-gray-400" />
                <span>{article.visit_count || 0} مشاهدة</span>
              </div>
            </div>

            {/* Share / Action Buttons could go here */}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Right Column: Article Content (8 cols) */}
          <div className="lg:col-span-8">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-10">

              <ArticleContentWrapper>
                <ArticleContent
                  content={article.content}
                  files={article.files}
                  backLink={`/${countryCode}/lesson/articles/${article.id}`}
                  adSettings={adSettings}
                  showInlineAd={showArticleAds && articleAdLimit >= 1}
                />

                {/* SEO Content Block (Increases text density) */}
                <SeoContentBlock
                  title={article.title}
                  subject={article.subject?.name}
                  category={categoryName}
                  sectionName={sectionName}
                />

                {showArticleAds && articleAdLimit >= 2 && (
                  <ArticleAds adSettings={adSettings} position="content-bottom" />
                )}
              </ArticleContentWrapper>

              {/* Keywords */}
              {article.keywords && article.keywords.length > 0 && (
                <div className="mt-8 pt-8 border-t border-gray-100">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">الكلمات المفتاحية</h3>
                  <div className="flex flex-wrap gap-2">
                    {article.keywords.map((keyword: any, index: number) => (
                      <a
                        key={keyword.id || `keyword-${index}`}
                        href={`/${countryCode}/lesson/articles/keyword/${encodeURIComponent(keyword.keyword)}`}
                        className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-primary hover:text-white transition-colors"
                      >
                        {keyword.keyword}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Comments Section */}
              <ArticleComments 
                articleId={article.id} 
                countryCode={countryCode} 
                authorId={article.author?.id}
              />
            </div>
          </div>

          {/* Left Column: Sidebar (4 cols) */}
          <SidebarAdWrapper>
            {/* Related Articles Widget */}
            <RelatedArticles articles={article.relatedArticles} countryCode={countryCode} />
          </SidebarAdWrapper>

        </div>
      </div>
    </div>
  );
}
