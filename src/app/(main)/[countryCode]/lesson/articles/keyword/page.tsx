import { Metadata } from 'next';
import ClassHeader from '@/components/class/ClassHeader';
import { Search, Tag } from 'lucide-react';
import KeywordSearchForm from './KeywordSearchForm';
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import Link from 'next/link';

interface Props {
  params: Promise<{
    countryCode: string;
  }>;
}

export const metadata: Metadata = {
  title: 'بحث عن الكلمات المفتاحية | منصة التعليم',
  description: 'ابحث عن المقالات والملفات باستخدام الكلمات المفتاحية',
};

async function getPopularKeywords(countryCode: string) {
  try {
    const response = await apiClient.get<any>(
      API_ENDPOINTS.KEYWORDS.INDEX,
      { database: countryCode, per_page: 50, type: 'articles' }
    );
    return response.data?.data?.article_keywords?.data || [];
  } catch (err) {
    console.error('Error fetching keywords:', err);
    return [];
  }
}

export default async function KeywordsIndexPage({ params }: Props) {
  const { countryCode } = await params;
  const keywords = await getPopularKeywords(countryCode);

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <ClassHeader title="الكلمات المفتاحية" />

      <div className="container mx-auto px-4 mt-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 mb-8">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search size={32} className="text-blue-600" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              ما الذي تبحث عنه؟
            </h2>
            
            <p className="text-gray-500 mb-8">
              اكتب كلمة مفتاحية للبحث عن جميع المقالات والملفات المرتبطة بها.
            </p>

            <KeywordSearchForm countryCode={countryCode} />
          </div>

          {/* Popular Keywords Cloud */}
          {keywords.length > 0 && (
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-center gap-2 mb-6 text-gray-900 font-bold text-lg">
                <Tag size={20} className="text-blue-600" />
                <h3>الأكثر بحثاً</h3>
              </div>
              
              <div className="flex flex-wrap justify-center gap-3">
                {keywords.map((k: any) => (
                  <Link
                    key={k.id}
                    href={`/${countryCode}/lesson/articles/keyword/${encodeURIComponent(k.keyword)}`}
                    className="px-4 py-2 bg-gray-50 hover:bg-blue-50 text-gray-700 hover:text-blue-600 rounded-lg text-sm transition-colors border border-gray-100 hover:border-blue-100"
                  >
                    {k.keyword}
                    <span className="mr-2 text-xs text-gray-400">({k.items_count})</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
