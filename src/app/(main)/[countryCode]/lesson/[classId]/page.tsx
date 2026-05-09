import { Suspense } from 'react';
import type { Metadata } from 'next';
import ClassHeader from '@/components/class/ClassHeader';
import ClassBreadcrumb from '@/components/class/ClassBreadcrumb';
import SubjectsListWrapper from '@/components/class/SubjectsListWrapper';
import SubjectsList from '@/components/class/SubjectsList';
import AnimatedSection from '@/components/ui/AnimatedSection';
import { COUNTRIES } from '@/lib/api/config';
import { getSchoolClass } from '@/lib/academic-data';
import { getFrontSettings } from '@/lib/front-settings';

interface PageProps {
  params: Promise<{
    countryCode: string;
    classId: string;
  }>;
}

async function getClassInfo(countryCode: string, classId: string) {
  return getSchoolClass(countryCode, classId);
}

async function getPublicSettings(): Promise<Record<string, string | null>> {
  return getFrontSettings();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ countryCode: string; classId: string }>;
}): Promise<Metadata> {
  const { countryCode, classId } = await params;
  const country = COUNTRIES.find((c) => c.code === countryCode);

  if (!country) {
    return {
      title: 'Page Not Found',
    };
  }

  const [classInfo, settings] = await Promise.all([
    getClassInfo(countryCode, classId),
    getPublicSettings(),
  ]);

  const siteName = (settings.site_name || (settings as any).siteName || '').toString().trim();
  const resolvedSiteName = siteName || 'منصة التعليم';
  const gradeName = classInfo?.grade_name || 'الصف الدراسي';

  const title = `${gradeName} - المنهاج الدراسي ${country.name} | ${resolvedSiteName}`;
  const description = `استكشف المواد الدراسية والملفات التعليمية الخاصة بـ ${gradeName} ضمن المنهاج الدراسي في ${country.name} على منصة ${resolvedSiteName}.`;

  const keywords: string[] = [
    gradeName,
    classInfo?.grade_level ? `صف ${classInfo.grade_level}` : 'صف دراسي',
    `منهاج ${country.name}`,
    'مواد دراسية',
    'ملفات تعليمية',
    resolvedSiteName,
  ];

  return {
    title,
    description,
    keywords,
    openGraph: {
      title,
      description,
      type: 'website',
    },
  };
}

function BreadcrumbSkeleton() {
  return (
    <div className="bg-white/95 backdrop-blur-sm p-6 rounded-2xl border border-slate-100/50 shadow-lg animate-pulse">
      <div className="h-5 bg-gradient-to-r from-slate-100 to-slate-200 rounded-lg w-1/3"></div>
    </div>
  );
}

function SubjectsListSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          className="p-6 bg-white/95 backdrop-blur-sm rounded-2xl border border-slate-100/50 shadow-lg hover:shadow-xl transition-all duration-300 animate-pulse"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-slate-100 to-slate-200 shrink-0"></div>
            <div className="flex-1 space-y-3">
              <div className="h-6 bg-gradient-to-r from-slate-100 to-slate-200 rounded-lg w-3/4"></div>
              <div className="h-4 bg-gradient-to-r from-slate-100 to-slate-200 rounded-lg w-full"></div>
              <div className="h-3 bg-gradient-to-r from-slate-100 to-slate-200 rounded-lg w-1/2 mt-4"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default async function ClassSubjectsPage({ params }: PageProps) {
  const { countryCode, classId } = await params;

  // Fetch class info and settings in parallel
  const [classInfo, settings] = await Promise.all([
    getClassInfo(countryCode, classId),
    getPublicSettings(),
  ]);

  const pageTitle = classInfo?.grade_name || 'المواد الدراسية';

  // Extract ad settings for classes page
  const adSettings = {
    googleAdsDesktop: settings.google_ads_desktop_classes || '',
    googleAdsMobile: settings.google_ads_mobile_classes || '',
    googleAdsDesktop2: settings.google_ads_desktop_classes_2 || '',
    googleAdsMobile2: settings.google_ads_mobile_classes_2 || '',
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] pb-16">
      {/* Section 1: Page Header */}
      <ClassHeader title={pageTitle} />

      {/* Breadcrumb - Streaming */}
      <div className="container mx-auto px-4 mt-8">
        <Suspense fallback={<BreadcrumbSkeleton />}>
          <ClassBreadcrumb 
            countryCode={countryCode} 
            classId={classId} 
            className={classInfo?.grade_name}
            classLevel={classInfo?.grade_level}
          />
        </Suspense>
      </div>

      {/* Main Content - Subjects List with Ads - Streaming */}
      <div className="container mx-auto px-4 mt-8">
        <SubjectsListWrapper adSettings={adSettings} hasContent={!!classInfo?.subjects?.length}>
          {/* Section Title */}
          <AnimatedSection delay={0.2}>
            <h3 className="text-2xl lg:text-3xl font-bold text-slate-900 mb-8 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                </svg>
              </div>
              المواد الدراسية المتاحة
            </h3>
          </AnimatedSection>

          {/* Subjects List */}
          <AnimatedSection delay={0.3}>
            <Suspense fallback={<SubjectsListSkeleton />}>
              <SubjectsList countryCode={countryCode} classId={classId} />
            </Suspense>
          </AnimatedSection>
        </SubjectsListWrapper>
      </div>
    </div>
  );
}
