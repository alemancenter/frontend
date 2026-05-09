import { Metadata } from 'next';
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import PostsIndexView from '@/components/posts/PostsIndexView';

interface Props {
  params: Promise<{
    countryCode: string;
    keyword: string;
  }>;
  searchParams: Promise<{
    page?: string;
  }>;
}

// Fetch posts by keyword
async function getPostsByKeyword(keyword: string, countryCode: string, page: number = 1) {
  try {
    const decodedKeyword = decodeURIComponent(keyword);
    const response = await apiClient.get<any>(
      API_ENDPOINTS.POSTS.LIST_PUBLIC,
      { 
        database: countryCode, 
        page,
        search: decodedKeyword // Use search parameter for keyword filtering
      }
    );
    return response.data;
  } catch (err) {
    console.error('Error fetching posts by keyword:', err);
    return null;
  }
}

// Generate Metadata for SEO
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { keyword } = await params;
  const decodedKeyword = decodeURIComponent(keyword);

  return {
    title: `مقالات حول ${decodedKeyword} | منصة التعليم`,
    description: `تصفح جميع المقالات المتعلقة بـ ${decodedKeyword} في منصة التعليم`,
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function KeywordPage({ params, searchParams }: Props) {
  const { countryCode, keyword } = await params;
  const { page } = await searchParams;
  const decodedKeyword = decodeURIComponent(keyword);
  const currentPage = page ? parseInt(page) : 1;
  
  const data = await getPostsByKeyword(keyword, countryCode, currentPage);

  if (!data || !data.data) {
    return (
      <PostsIndexView
        initialPosts={[]}
        categories={[]}
        pagination={{
          current_page: 1,
          last_page: 1,
          total: 0,
          per_page: 15
        }}
        countryCode={countryCode}
        pageTitle={`نتائج البحث عن: ${decodedKeyword}`}
        error="لم يتم العثور على مقالات تطابق بحثك"
      />
    );
  }

  // Handle different response structures
  const posts = Array.isArray(data.data) ? data.data : (data.data?.data || []);
  const meta = data.meta || (data.data?.current_page ? data.data : null) || {
    current_page: 1,
    last_page: 1,
    total: posts.length,
    per_page: 15
  };

  return (
    <PostsIndexView
      initialPosts={posts}
      categories={[]} // Categories might not be relevant here or can be fetched if needed
      pagination={{
        current_page: meta.current_page || 1,
        last_page: meta.last_page || 1,
        total: meta.total || 0,
        per_page: meta.per_page || 15,
        from: meta.from,
        to: meta.to
      }}
      countryCode={countryCode}
      pageTitle={`نتائج البحث عن: ${decodedKeyword}`}
    />
  );
}
