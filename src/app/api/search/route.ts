import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { API_CONFIG } from '@/lib/api/config';
import { ssrFetch } from '@/lib/api/ssr-fetch';

// واجهة نتيجة البحث
interface SearchResult {
  id: string;
  title: string;
  type: 'post' | 'article' | 'lesson';
  description?: string;
  url: string;
  date: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // استخراج معلمات البحث
    const classId = searchParams.get('class');
    const subjectId = searchParams.get('subject');
    const semester = searchParams.get('semester');
    const fileType = searchParams.get('type');
    const query = searchParams.get('q');
    const country = searchParams.get('country') || 'jo';

    // بناء معلمات الطلب للواجهة الخلفية
    const backendParams = new URLSearchParams();
    if (classId) backendParams.append('class_id', classId);
    if (subjectId) backendParams.append('subject_id', subjectId);
    if (semester) backendParams.append('semester_id', semester);
    if (fileType) backendParams.append('file_category', fileType);
    if (query) backendParams.append('q', query);
    if (country) backendParams.append('country', country);

    // محاولة الاتصال بالواجهة الخلفية
    try {
      const cookieStore = await cookies();
      const token = cookieStore.get('token')?.value;
      const headers: HeadersInit = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      };

      // Add the private Frontend API key from the server runtime.
      const apiKey = process.env.FRONTEND_API_KEY;
      if (apiKey) {
        headers['X-Frontend-Key'] = apiKey;
      }

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await ssrFetch(`${API_CONFIG.BASE_URL}/articles?${backendParams.toString()}`, {
        headers,
        cache: 'no-store',
      });

      if (response.ok) {
        const data = await response.json();
        const articles = data.data || [];

        const results: SearchResult[] = articles.map((article: any) => {
          // استنتاج التصنيف من الملفات إذا لم يكن موجوداً مباشرة
          let category = article.file_category;
          if (!category && article.files && Array.isArray(article.files) && article.files.length > 0) {
            category = article.files[0].category;
          }

          const type = mapCategoryToType(category);
          const pathSegment = type === 'post' ? 'posts' : 'lesson/articles';
          
          return {
            id: String(article.id),
            title: article.title,
            type: type,
            description: article.meta_description || article.description || extractExcerpt(article.content),
            url: `/${country}/${pathSegment}/${article.id}`,
            date: new Date(article.created_at).toLocaleDateString('ar-JO'),
          };
        });

        return NextResponse.json({
          success: true,
          results,
          total: data.meta?.total || results.length,
          filters: {
            class: classId,
            subject: subjectId,
            semester: semester,
            type: fileType,
            query: query
          }
        });
      } else {
        console.error(`Backend API Error: ${response.status} ${response.statusText}`);
        return NextResponse.json({ success: false, error: 'فشل الاتصال بالخادم', results: [] }, { status: response.status });
      }
    } catch (apiError) {
      console.error('Backend API connection failed:', apiError);
      return NextResponse.json({ success: false, error: 'تعذر الاتصال بالخادم', results: [] }, { status: 502 });
    }

  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'حدث خطأ أثناء معالجة طلب البحث',
        results: []
      },
      { status: 500 }
    );
  }
}

function mapCategoryToType(category: string): 'post' | 'article' | 'lesson' {
  const map: Record<string, 'post' | 'article' | 'lesson'> = {
    'study_plan': 'lesson',
    'worksheet': 'lesson',
    'exam': 'lesson',
    'book': 'lesson',
    'record': 'article',
    'article': 'article',
    'post': 'post'
  };
  return map[category] || 'article';
}

function extractExcerpt(html?: string): string {
  if (!html) return '';
  return html.replace(/<[^>]+>/g, '').substring(0, 150) + '...';
}
