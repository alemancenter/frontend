import { Suspense } from 'react';
import CategoryHeader from '@/components/category/CategoryHeader';
import CategoryBreadcrumb from '@/components/category/CategoryBreadcrumb';
import CategoryArticlesList from '@/components/category/CategoryArticlesList';
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';

interface PageProps {
  params: Promise<{
    countryCode: string;
    classId: string;
    subjectId: string;
    categoryId: string;
  }>;
  searchParams: Promise<{
    semester?: string;
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

async function getSubjectAndSemesterInfo(countryCode: string, subjectId: string, semesterId: string) {
  try {
     const response = await apiClient.get<any>(
      API_ENDPOINTS.FILTER.SEMESTERS_BY_SUBJECT(subjectId),
      { database: countryCode }
    );
    
    const data = response.data.data || response.data;
    const subjectName = data.subject?.name || 'المادة الدراسية';
    
    const semesters = data.semesters || [];
    const semester = semesters.find((s: any) => s.id == semesterId);
    const semesterName = semester?.semester_name || 'الفصل الدراسي';
    
    return { subjectName, semesterName };
  } catch {
    return { subjectName: 'المادة الدراسية', semesterName: 'الفصل الدراسي' };
  }
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const { countryCode, classId, subjectId, categoryId } = await params;
  const { semester } = await searchParams;
  const semesterId = semester || '1'; // Default or handle error

  const categoryName = getCategoryName(categoryId);
  const { subjectName, semesterName } = await getSubjectAndSemesterInfo(countryCode, subjectId, semesterId);

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
            classId={classId} 
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
            classId={classId} 
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
