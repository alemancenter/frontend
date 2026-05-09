import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import ClassHeader from '@/components/class/ClassHeader';
import { Calendar, Eye, ChevronLeft, Home, FileText } from 'lucide-react';

interface Props {
  params: Promise<{
    countryCode: string;
    keyword: string;
  }>;
}

// Use ISR with revalidation
export const revalidate = 300;

// Fetch articles by keyword
async function getArticlesByKeyword(keyword: string, countryCode: string) {
  try {
    const response = await apiClient.get<any>(
      API_ENDPOINTS.ARTICLES.BY_KEYWORD(keyword),
      { database: countryCode },
      { next: { revalidate: 300 } } as any
    );
    return response.data;
  } catch (err) {
    console.error('Error fetching articles by keyword:', err);
    return null;
  }
}

// Generate Metadata for SEO
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { keyword } = await params;
  const decodedKeyword = decodeURIComponent(keyword);

  return {
    title: `مقالات حول ${decodedKeyword} | منصة التعليم`,
    description: `تصفح جميع المقالات والملفات المتعلقة بـ ${decodedKeyword} في منصة التعليم`,
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function KeywordPage({ params }: Props) {
  const { countryCode, keyword } = await params;
  const decodedKeyword = decodeURIComponent(keyword);
  const data = await getArticlesByKeyword(keyword, countryCode);

  if (!data || !data.data) {
    notFound();
  }

  const articles = data.data;

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* Header */}
      <ClassHeader title={`كلمة مفتاحية: ${decodedKeyword}`} />

      <div className="container mx-auto px-4 mt-8">
        
        {/* Breadcrumb */}
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
            <li className="font-medium text-gray-900" aria-current="page">
              {decodedKeyword}
            </li>
          </ol>
        </nav>

        {/* Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.length > 0 ? (
            articles.map((article: any) => (
              <Link 
                href={`/${countryCode}/lesson/articles/${article.id}`} 
                key={article.id}
                className="group bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300"
              >
                <div className="aspect-video relative bg-gray-100">
                  {/* You might want to use a real image if available */}
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400 bg-gray-50">
                     <FileText size={48} className="opacity-20" />
                  </div>
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-medium text-gray-700 shadow-sm">
                    {article.school_class?.grade_name || 'عام'}
                  </div>
                </div>
                
                <div className="p-5">
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      {new Date(article.created_at).toLocaleDateString('ar-JO')}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-gray-300" />
                    <span className="flex items-center gap-1">
                      <Eye size={12} />
                      {article.visit_count}
                    </span>
                  </div>
                  
                  <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                    {article.title}
                  </h3>
                  
                  <p className="text-sm text-gray-500 line-clamp-2 mb-4">
                    {article.meta_description || article.content?.substring(0, 100).replace(/<[^>]*>?/gm, '')}
                  </p>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                    <span className="text-xs font-medium text-blue-600 flex items-center gap-1 group-hover:gap-2 transition-all">
                      اقرأ المزيد
                      <ChevronLeft size={12} />
                    </span>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="col-span-full py-12 text-center text-gray-500 bg-white rounded-xl border border-gray-100">
              <FileText size={48} className="mx-auto mb-4 opacity-20" />
              <p>لا توجد مقالات مرتبطة بهذه الكلمة المفتاحية حالياً.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
