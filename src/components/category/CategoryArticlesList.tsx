import Link from 'next/link';
import { FileText, Calendar, Eye } from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';

interface Article {
  id: number;
  title: string;
  created_at: string;
  visit_count?: number;
  files?: {
    id: number;
    file_type: string;
    file_path: string;
    file_category?: string;
  }[];
}

function extractArticles(response: any): Article[] {
  if (!response) return [];

  if (Array.isArray(response)) return response;

  if (Array.isArray(response.data)) return response.data;

  if (Array.isArray(response.data?.data)) return response.data.data;

  return [];
}

async function getArticles(
  countryCode: string,
  subjectId: string,
  semesterId: string,
  categoryId: string
): Promise<Article[]> {
  try {
    const response = await apiClient.get<any>(
      API_ENDPOINTS.ARTICLES.LIST_PUBLIC,
      {
        database: countryCode,
        subject_id: subjectId,
        semester_id: semesterId,
        category_id: categoryId,
        per_page: 50,
      },
      { cache: 'no-store' } as any
    );

    return extractArticles(response);
  } catch (err) {
    console.error('Error fetching articles:', err);
    return [];
  }
}

export default async function CategoryArticlesList({
  countryCode,
  subjectId,
  semesterId,
  categoryId,
  categoryName,
  subjectName,
}: {
  countryCode: string;
  classId: string;
  subjectId: string;
  semesterId: string;
  categoryId: string;
  categoryName: string;
  subjectName: string;
}) {
  const articles = await getArticles(countryCode, subjectId, semesterId, categoryId);

  if (!articles.length) {
    return (
      <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
        <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-medium text-gray-900 mb-2">لا توجد محتويات حالياً</h3>
        <p className="text-gray-500">لم يتم إضافة أي ملفات أو مقالات في هذا القسم بعد.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
      <div className="bg-primary px-6 py-4 text-center">
        <h3 className="text-xl font-bold text-white">
          {categoryName} - {subjectName}
        </h3>
      </div>

      <div className="p-6">
        <div className="grid gap-4">
          {articles.map((article: Article) => {
            const file = article.files && article.files[0];
            const fileType = file ? file.file_type : null;

            return (
              <Link
                key={article.id}
                href={`/${countryCode}/lesson/articles/${article.id}`}
                className="flex items-center p-4 rounded-lg border border-gray-100 hover:border-primary/30 hover:bg-gray-50 transition-all duration-200 group"
              >
                <div className="w-12 h-12 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 ml-4 group-hover:scale-110 transition-transform">
                  <FileText className="w-6 h-6" />
                </div>

                <div className="flex-1 min-w-0 ml-4">
                  <h4 className="text-lg font-medium text-gray-900 whitespace-normal break-words mb-1 group-hover:text-primary transition-colors">
                    {article.title}
                  </h4>

                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(article.created_at).toLocaleDateString('ar-JO')}
                    </span>

                    {article.visit_count !== undefined && (
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {article.visit_count} مشاهدة
                      </span>
                    )}

                    {fileType && (
                      <span className="uppercase bg-gray-100 px-2 py-0.5 rounded text-gray-600 font-semibold">
                        {fileType}
                      </span>
                    )}
                  </div>
                </div>

                <div className="px-4 py-2 rounded-lg bg-primary/10 text-primary font-medium group-hover:bg-primary group-hover:text-white transition-all flex items-center gap-2 shrink-0">
                  <Eye className="w-4 h-4" />
                  <span className="hidden sm:inline">عرض</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}