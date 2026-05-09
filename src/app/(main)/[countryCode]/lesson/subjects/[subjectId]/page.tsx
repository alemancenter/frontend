import { Suspense } from 'react';
import SubjectHeader from '@/components/subject/SubjectHeader';
import SubjectBreadcrumb from '@/components/subject/SubjectBreadcrumb';
import SemesterList from '@/components/subject/SemesterList';
import SemesterListWrapper from '@/components/subject/SemesterListWrapper';
import { getSubjectSemesters } from '@/lib/academic-data';
import { getFrontSettings } from '@/lib/front-settings';

interface PageProps {
  params: Promise<{
    countryCode: string;
    subjectId: string;
  }>;
  searchParams: Promise<{
    id?: string;
  }>;
}

// Academic semesters are stable; content itself is cached separately in article endpoints.
export const revalidate = 86400;

export default async function SubjectSemestersPage({ params, searchParams }: PageProps) {
  const { countryCode, subjectId } = await params;
  const { id: queryClassId } = await searchParams;

  const { subjectName, classId: fetchedClassId, semesters } = await getSubjectSemesters(countryCode, subjectId);
  const settings = await getFrontSettings();
  const adSettings = {
    googleAdsDesktop: settings.google_ads_desktop_subject || '',
    googleAdsMobile: settings.google_ads_mobile_subject || '',
    googleAdsDesktop2: settings.google_ads_desktop_subject_2 || '',
    googleAdsMobile2: settings.google_ads_mobile_subject_2 || '',
  };

  // Use query param classId if available, otherwise use fetched classId from API
  const classId = queryClassId || fetchedClassId;

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
      {/* Page Header */}
      <SubjectHeader subjectName={subjectName} />

      {/* Breadcrumb */}
      <div className="container mx-auto px-4 mt-8">
        <Suspense fallback={<div className="h-14 bg-white rounded-lg animate-pulse" />}>
          <SubjectBreadcrumb
            countryCode={countryCode}
            classId={classId}
            subjectName={subjectName}
          />
        </Suspense>
      </div>

      {/* Main Content - Semesters List */}
      <div className="container mx-auto px-4 mt-8">
        <Suspense fallback={
          <div className="space-y-4">
            <div className="h-64 bg-white rounded-xl animate-pulse" />
            <div className="h-64 bg-white rounded-xl animate-pulse" />
          </div>
        }>
          <SemesterListWrapper hasContent={semesters.length > 0} adSettings={adSettings}>
            <SemesterList
              countryCode={countryCode}
              subjectId={subjectId}
              subjectName={subjectName}
              initialSemesters={semesters}
            />
          </SemesterListWrapper>
        </Suspense>
      </div>
    </div>
  );
}
