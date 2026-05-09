import { Suspense } from 'react';
import CategoryHeader from '@/components/category/CategoryHeader';
import CategoryBreadcrumb from '@/components/category/CategoryBreadcrumb';
import CategoryArticlesList from '@/components/category/CategoryArticlesList';
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';

interface PageProps {
  params: Promise<{
    countryCode: string;
    subjectId: string;
    semesterId: string;
    categoryId: string;
  }>;
  searchParams: Promise<{
    id?: string;
  }>;
}

// Helper to get category name
const getCategoryName = (id: string) => {
  const categories: Record<string, string> = {
    'plans': 'خطط الدراسة',
    'papers': 'أوراق عمل',
    'tests': 'اختبارات',
    'books': 'كتب المدرسة',
    'records': 'السجلات',
  };
  return categories[id] || 'المقالات';
};

// Use ISR with revalidation
export const revalidate = 300;

async function getSubjectAndSemesterInfo(countryCode: string, subjectId: string, semesterId: string) {
  try {
     const response = await apiClient.get<any>(
      API_ENDPOINTS.FILTER.SEMESTERS_BY_SUBJECT(subjectId),
      { database: countryCode },
      { next: { revalidate: 300 } } as any
    );

    const data = response.data.data || response.data;
    const subject = data.subject || {};
    const subjectName = subject.name || subject.subject_name || data.subject_name || 'المادة الدراسية';

    // Use class_id from API response (this is school_classes.id)
    // Fall back to grade_level only if class_id is not available
    const classId = data.class_id || subject.class_id || subject.grade_level || null;

    const semesters = data.semesters || [];
    const semester = semesters.find((s: any) => s.id == semesterId);
    const semesterName = semester?.semester_name || 'الفصل الدراسي';

    return { subjectName, semesterName, classId };
  } catch (error) {
    console.error('Error fetching subject info:', error);
    return { subjectName: 'المادة الدراسية', semesterName: 'الفصل الدراسي', classId: null };
  }
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const { countryCode, subjectId, semesterId, categoryId } = await params;
  const { id: queryClassId } = await searchParams;

  const categoryName = getCategoryName(categoryId);
  const { subjectName, semesterName, classId: fetchedClassId } = await getSubjectAndSemesterInfo(countryCode, subjectId, semesterId);
  
  // Use fetched classId if available, otherwise fallback to query param
  const classId = fetchedClassId || queryClassId;

  if (!classId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8">
          <h2 className="text-xl font-bold text-gray-800 mb-2">عذراً</h2>
          <p className="text-gray-600">رقم الصف الدراسي مفقود</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* Header */}
      <CategoryHeader 
        title={subjectName} 
        subtitle={`${subjectName} - ${semesterName} - ${categoryName}`}
      />

      {/* Breadcrumb */}
      <div className="container mx-auto px-4 mt-8">
        <Suspense fallback={<div className="h-14 bg-white rounded-lg animate-pulse" />}>
          <CategoryBreadcrumb 
            countryCode={countryCode} 
            classId={String(classId)} 
            subjectId={subjectId} 
            categoryId={categoryId}
            subjectName={subjectName}
            categoryName={categoryName}
            semesterName={semesterName}
          />
        </Suspense>
      </div>

      {/* Articles List */}
      <div className="container mx-auto px-4 mt-8">
        <Suspense fallback={<div className="h-64 bg-white rounded-xl animate-pulse" />}>
          <CategoryArticlesList 
            countryCode={countryCode} 
            classId={String(classId)} 
            subjectId={subjectId} 
            semesterId={semesterId}
            categoryId={categoryId}
            categoryName={categoryName}
            subjectName={subjectName}
          />
        </Suspense>
      </div>
    </div>
  );
}
