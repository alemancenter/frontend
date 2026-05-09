import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { COUNTRIES } from '@/lib/api/config';
import { getSchoolClasses } from '@/lib/academic-data';

// Academic structure changes rarely; keep ISR aligned with the backend long-lived cache.
export const revalidate = 86400;

async function getClasses(countryId: string) {
  return getSchoolClasses(countryId);
}

export async function generateMetadata({ params }: { params: Promise<{ countryCode: string }> }): Promise<Metadata> {
  const { countryCode } = await params;
  const country = COUNTRIES.find((c) => c.code === countryCode);
  if (!country) {
    return { title: 'Page Not Found' };
  }

  return {
    title: `الصفوف الدراسية - ${country.name}`,
    description: `تصفح الصفوف الدراسية المتاحة في ${country.name} للوصول إلى المواد والملفات التعليمية.`,
  };
}

export default async function LessonIndexPage({ params }: { params: Promise<{ countryCode: string }> }) {
  const { countryCode } = await params;
  const country = COUNTRIES.find((c) => c.code === countryCode);
  if (!country) notFound();

  const classes = await getClasses(country.id);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 pb-16">
      <section
        className="relative pt-28 pb-20 overflow-hidden"
        style={{ background: 'linear-gradient(226deg, #202c45 0%, #286aad 100%)' }}
      >
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage:
              'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)',
            backgroundSize: '32px 32px',
          }}
        />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 drop-shadow-sm leading-tight">
              الصفوف الدراسية
            </h1>
            <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto font-light">
              اختر الصف الدراسي في {country.name} للوصول إلى المواد والملفات التعليمية
            </p>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-[0]">
          <svg
            viewBox="0 0 1440 120"
            preserveAspectRatio="none"
            className="relative block w-[calc(100%+2px)] -ml-[1px] h-[60px] md:h-[100px]"
            shapeRendering="geometricPrecision"
          >
            <path
              d="M0,64L80,69.3C160,75,320,85,480,80C640,75,800,53,960,48C1120,43,1280,53,1360,58.7L1440,64L1440,120L1360,120C1280,120,1120,120,960,120C800,120,640,120,480,120C320,120,160,120,80,120L0,120Z"
              className="fill-[#f8f9fa]"
            />
          </svg>
        </div>
      </section>

      <div className="container mx-auto px-4 -mt-8 relative z-20 mb-10">
        <nav className="flex items-center gap-2 text-sm font-medium text-slate-600 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full w-fit shadow-sm border border-white/50">
          <Link href="/" className="hover:text-blue-600 transition-colors">
            الرئيسية
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-slate-900">{country.name}</span>
          <span className="text-slate-300">/</span>
          <span className="text-slate-900">الصفوف الدراسية</span>
        </nav>
      </div>

      <div className="container mx-auto px-4">
        {classes.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-10 text-center">
            <div className="text-slate-900 font-bold text-xl mb-2">لا توجد صفوف متاحة حالياً</div>
            <div className="text-slate-500">يرجى المحاولة لاحقاً</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {classes.map((cls) => (
              <Link
                key={cls.id}
                href={`/${countryCode}/lesson/${cls.id}`}
                className="group relative bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-blue-900/10 transition-all duration-300 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/0 via-cyan-500/0 to-indigo-600/0 group-hover:from-blue-600/5 group-hover:to-indigo-600/5 transition-colors" />
                <div className="relative p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white flex items-center justify-center font-bold shadow-lg shadow-blue-500/20">
                      {cls.grade_level}
                    </div>
                    <div className="text-slate-300 group-hover:text-blue-600 transition-colors">‹</div>
                  </div>
                  <div className="text-lg font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                    {cls.grade_name}
                  </div>
                  <div className="text-sm text-slate-500 mt-1">عرض المواد الدراسية والملفات</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
