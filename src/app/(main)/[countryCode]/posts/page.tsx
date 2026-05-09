import { Metadata } from 'next';
import { postsService, categoriesService } from '@/lib/api/services';
import { COUNTRIES } from '@/lib/api/config';
import { safeJsonLd } from '@/lib/utils';
import PostsIndexView from '@/components/posts/PostsIndexView';

// Use ISR with revalidation for better performance
export const revalidate = 60;


interface PageProps {
  params: Promise<{
    countryCode: string;
  }>;
  searchParams: Promise<{
    page?: string;
    search?: string;
    category_id?: string;
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

export async function generateMetadata(
  { params, searchParams }: PageProps
): Promise<Metadata> {
  const { countryCode } = await params;
  const resolvedSearchParams = await searchParams;
  
  const search = resolvedSearchParams.search || '';
  const category_id = resolvedSearchParams.category_id;
  const page = Number(resolvedSearchParams.page) || 1;

  let title = 'المقالات';
  let description = 'تصفح جميع المقالات والأخبار التعليمية والتربوية والملفات الدراسية';

  if (category_id) {
    const categories = await getCategories(countryCode);
    const category = categories.find((c: any) => c.id.toString() === category_id);
    if (category) {
      title = `${category.name} - المقالات`;
      description = `تصفح جميع المقالات في قسم ${category.name}. ${description}`;
    }
  }

  if (search) {
    title = `نتائج البحث عن "${search}" - ${title}`;
  }

  if (page > 1) {
    title = `${title} - صفحة ${page}`;
  }

  return {
    title,
    description,
    robots: {
      index: !search,
      follow: true,
    },
    openGraph: {
      title,
      description,
      type: 'website',
      locale: 'ar_JO',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    alternates: {
      canonical: `/jo/posts${category_id ? `?category_id=${category_id}` : ''}${page > 1 ? `${category_id ? '&' : '?'}page=${page}` : ''}`,
    },
  };
}

export default async function PostsPage({ params, searchParams }: PageProps) {
  const { countryCode } = await params;
  const resolvedSearchParams = await searchParams;
  
  const page = Number(resolvedSearchParams.page) || 1;
  const search = resolvedSearchParams.search || '';
  const category_id = resolvedSearchParams.category_id || undefined;
  const sort_by = resolvedSearchParams.sort_by || 'created_at';
  const sort_dir = (resolvedSearchParams.sort_dir === 'asc' ? 'asc' : 'desc') as 'asc' | 'desc';

  const categories = await getCategories(countryCode);

  let posts: any[] = [];
  let pagination: any = {
    current_page: page,
    last_page: 1,
    total: 0,
    per_page: 12,
    from: 1,
    to: 0,
  };
  let errorMessage: string | null = null;

  try {
    const postsRes = await postsService.getAll(
      {
        country: countryCode,
        page,
        per_page: 12,
        search: search || undefined,
        category_id,
        sort_by,
        sort_dir,
      },
      { next: { revalidate: 60 } } as any
    );

    // ApiClient returns: { data: { data: [...] }, status: 200, success: true }
    // So we need to access postsRes.data.data to get the actual posts array
    if (postsRes && (postsRes as any).data) {
      const apiData = (postsRes as any).data;

      // The API returns { data: [...] }
      if (Array.isArray(apiData.data)) {
        posts = apiData.data;

        // Extract pagination info from meta object
        pagination = {
          current_page: apiData.meta?.current_page || page,
          last_page: apiData.meta?.last_page || 1,
          total: apiData.meta?.total || posts.length,
          per_page: apiData.meta?.per_page || 12,
          from: apiData.meta?.from || ((page - 1) * 12 + 1),
          to: apiData.meta?.to || posts.length
        };
      }
    }
  } catch (error: any) {
    console.error('Error fetching posts:', error);
    if (error?.message?.includes('Too many requests') || error?.status === 429) {
      errorMessage = 'تم تجاوز الحد المسموح من الطلبات. يرجى الانتظار قليلاً والمحاولة مرة أخرى.';
    } else {
      errorMessage = 'حدث خطأ أثناء تحميل المنشورات';
    }
  }

  // Find active category name for UI
  const activeCategory = categories.find((c: any) => c.id.toString() === category_id);
  const pageTitle = activeCategory
    ? `تصفح ${activeCategory.name}`
    : (search ? `نتائج البحث عن "${search}"` : 'جميع المقالات');

  if (errorMessage) {
    return (
      <PostsIndexView
        initialPosts={[]}
        categories={categories}
        pagination={{
          current_page: 1,
          last_page: 1,
          total: 0,
          per_page: 12,
        }}
        countryCode={countryCode}
        error={errorMessage}
        pageTitle="حدث خطأ"
      />
    );
  }

  // JSON-LD Schema
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: pageTitle,
    description: 'تصفح المقالات والأخبار التعليمية',
    url: `${process.env.NEXT_PUBLIC_URL || 'https://example.com'}/${countryCode}/posts`,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: posts.map((post: any, index: number) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: `${process.env.NEXT_PUBLIC_URL || 'https://example.com'}/${countryCode}/posts/${post.id}`,
        name: post.title,
      })),
    },
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
          per_page: pagination.per_page,
        }}
        countryCode={countryCode}
        pageTitle={pageTitle}
      />
    </>
  );
}
