import { Metadata } from 'next';
import { postsService, categoriesService } from '@/lib/api/services';
import { COUNTRIES } from '@/lib/api/config';
import { safeJsonLd } from '@/lib/utils';
import PostsIndexView from '@/components/posts/PostsIndexView';
import { getFrontSettings } from '@/lib/front-settings';

// Use ISR with revalidation for better performance
export const revalidate = 60;


interface PageProps {
  params: Promise<{
    countryCode: string;
    categoryId: string;
  }>;
  searchParams: Promise<{
    page?: string;
    search?: string;
    sort_by?: string;
    sort_dir?: string;
  }>;
}

async function getCategories(countryCode: string) {
  // Helper to extract data from various response formats
  const extractData = (res: any) => {
    if ((res as any)?.data && Array.isArray((res as any).data)) return (res as any).data;
    if (Array.isArray(res)) return res;
    if ((res as any)?.data?.data && Array.isArray((res as any).data.data)) return (res as any).data.data;
    return null;
  };

  try {
    // Attempt 1: Try with country ID if available (often more reliable than code)
    const countryObj = COUNTRIES.find(c => c.code === countryCode);
    if (countryObj) {
      const res = await categoriesService.getAll(
        { country: countryObj.id, per_page: 100 },
        { next: { revalidate: 300 } } as any,
        true
      );
      const data = extractData(res);
      if (data && data.length > 0) return data;
    }

    // Attempt 2: Try with country code
    let res = await categoriesService.getAll(
      { country: countryCode, per_page: 100 },
      { next: { revalidate: 300 } } as any,
      true
    );

    let data = extractData(res);
    if (data && data.length > 0) return data;

    // Attempt 3: Try fetching without filters (Global fallback)
    res = await categoriesService.getAll(
      { per_page: 100 },
      { next: { revalidate: 300 } } as any,
      true
    );
    data = extractData(res);
    if (data && data.length > 0) return data;

    // Final fallback: return empty list when no categories exist
    return [];
  } catch {
    return [];
  }
}

async function getPublicSettings(): Promise<Record<string, string | null>> {
  return getFrontSettings();
}

export async function generateMetadata(
  { params, searchParams }: PageProps
): Promise<Metadata> {
  const { countryCode, categoryId } = await params;
  const resolvedSearchParams = await searchParams;
  
  const search = resolvedSearchParams.search || '';
  const page = Number(resolvedSearchParams.page) || 1;
  
  // جلب التصنيفات وإعدادات الموقع بالتوازي لاستخدامها في SEO
  const [categories, settings] = await Promise.all([
    getCategories(countryCode),
    getPublicSettings(),
  ]);

  let title = 'المقالات';
  let description = '';
  let categoryName: string | null = null;

  const category = categories.find((c: any) => c.id.toString() === categoryId);
  if (category) {
    categoryName = category.name;
    title = `${categoryName} - المقالات`;
  }

  const siteName = (settings.site_name || (settings as any).siteName || '').toString().trim();
  const resolvedSiteName = siteName || 'منصة التعليم';
  const countryObj = COUNTRIES.find((c) => c.code === countryCode);
  const countryName = countryObj?.name;

  // وصف مختصر مع كلمات مفتاحية مركّزة
  if (search) {
    description = `نتائج البحث عن "${search}" في ${categoryName || 'المقالات'} على منصة ${resolvedSiteName}${countryName ? ` في ${countryName}` : ''}.`;
  } else if (categoryName) {
    description = `مقالات قسم ${categoryName} على منصة ${resolvedSiteName}${countryName ? ` في ${countryName}` : ''}. أخبار وموارد تعليمية مختارة للطلاب والمعلمين.`;
  } else {
    description = `مقالات ومنشورات تعليمية على منصة ${resolvedSiteName}${countryName ? ` في ${countryName}` : ''} حول التعليم والاختبارات والموارد الدراسية.`;
  }

  if (search) {
    title = `نتائج البحث عن "${search}" - ${title}`;
  }

  if (page > 1) {
    title = `${title} - صفحة ${page}`;
  }

  // بناء baseUrl و canonical و ogImage من إعدادات الموقع
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

  const canonicalPath = `/${countryCode}/posts/category/${categoryId}${page > 1 ? `?page=${page}` : ''}`;
  const canonicalUrl = baseUrl ? `${baseUrl}${canonicalPath}` : canonicalPath;

  const ogImagePath = '/assets/img/front-pages/icons/articles_default_image.webp';
  const ogImage = baseUrl ? `${baseUrl}${ogImagePath}` : ogImagePath;

  const fullTitle = countryName
    ? `${title} - ${countryName} | ${resolvedSiteName}`
    : `${title} | ${resolvedSiteName}`;

  return {
    title: fullTitle,
    description,
    robots: {
      index: !search,
      follow: true,
    },
    openGraph: {
      title: fullTitle,
      description,
      type: 'website',
      locale: 'ar_JO',
      url: canonicalUrl,
      siteName: resolvedSiteName,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: fullTitle,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [ogImage],
    },
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const { countryCode, categoryId } = await params;
  const resolvedSearchParams = await searchParams;
  
  const page = Number(resolvedSearchParams.page) || 1;
  const search = resolvedSearchParams.search || '';
  const sort_by = resolvedSearchParams.sort_by || 'created_at';
  const sort_dir = (resolvedSearchParams.sort_dir === 'asc' ? 'asc' : 'desc') as 'asc' | 'desc';

  try {
    // Execute requests in parallel
    const [categories, settings] = await Promise.all([
      getCategories(countryCode),
      getPublicSettings(),
    ]);

    const postsRes = await postsService.getAll({
      country: countryCode,
      page,
      per_page: 12,
      search: search || undefined,
      category_id: categoryId, // Strict category filter
      sort_by,
      sort_dir,
    }, { next: { revalidate: 60 } } as any);

    // Handle response structure with null check
    const postsData = postsRes ? ((postsRes as any).data || postsRes) : null;

    // Normalize posts with safety check
    const posts = postsData
      ? (Array.isArray(postsData.data) ? postsData.data : (Array.isArray(postsData) ? postsData : []))
      : [];
    
    // Normalize pagination with safety check
    const pagination = postsData
      ? (postsData.pagination || postsData.meta || {
          current_page: postsData.current_page || page,
          last_page: postsData.last_page || 1,
          total: postsData.total || posts.length,
          per_page: postsData.per_page || 12,
          from: postsData.from || 1,
          to: postsData.to || posts.length
        })
      : {
          current_page: page,
          last_page: 1,
          total: 0,
          per_page: 12,
          from: 0,
          to: 0
        };

    // Find active category for UI
    const activeCategory = categories.find((c: any) => c.id.toString() === categoryId);
    const pageTitle = activeCategory
      ? `تصفح ${activeCategory.name}`
      : (search ? `نتائج البحث عن "${search}"` : 'تصفح القسم');

    // Extract ad settings for posts/category pages
    const adSettings = {
      googleAdsDesktop: settings.google_ads_desktop_classes || '',
      googleAdsMobile: settings.google_ads_mobile_classes || '',
      googleAdsDesktop2: settings.google_ads_desktop_classes_2 || '',
      googleAdsMobile2: settings.google_ads_mobile_classes_2 || '',
    };

    // JSON-LD Schema
    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: pageTitle,
      description: `تصفح مقالات قسم ${activeCategory?.name || 'التصنيف'}`,
      url: `${process.env.NEXT_PUBLIC_URL || 'https://example.com'}/${countryCode}/posts/category/${categoryId}`,
      mainEntity: {
        '@type': 'ItemList',
        itemListElement: posts.map((post: any, index: number) => ({
          '@type': 'ListItem',
          position: index + 1,
          url: `${process.env.NEXT_PUBLIC_URL || 'https://example.com'}/${countryCode}/posts/${post.id}`,
          name: post.title
        }))
      }
    };

    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
        />
        <PostsIndexView
          initialPosts={posts}
          categories={categories}
          pagination={{
              current_page: pagination.current_page,
              last_page: pagination.last_page,
              total: pagination.total,
              per_page: pagination.per_page
          }}
          countryCode={countryCode}
          pageTitle={pageTitle}
          selectedCategoryId={categoryId}
          adSettings={adSettings}
        />
      </>
    );
  } catch (error: any) {
    console.error('Error fetching posts:', error);
    
    // Fallback error UI reusing PostsIndexView (it handles empty state/errors)
    const categories = await getCategories(countryCode).catch(() => []);
    
    let errorMessage = 'حدث خطأ أثناء تحميل المنشورات';
    if (error?.message?.includes('Too many requests') || error?.status === 429) {
      errorMessage = 'تم تجاوز الحد المسموح من الطلبات. يرجى الانتظار قليلاً والمحاولة مرة أخرى.';
    }

    return (
      <PostsIndexView
        initialPosts={[]}
        categories={categories}
        pagination={{
            current_page: 1,
            last_page: 1,
            total: 0,
            per_page: 12
        }}
        countryCode={countryCode}
        error={errorMessage}
        selectedCategoryId={categoryId}
      />
    );
  }
}
