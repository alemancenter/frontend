import Link from 'next/link';
import { Home, ChevronLeft } from 'lucide-react';
import { getSchoolClass } from '@/lib/academic-data';

async function getClassData(countryCode: string, classId: string) {
  return getSchoolClass(countryCode, classId);
}

export default async function ClassBreadcrumb({
  countryCode,
  classId,
  className,
  classLevel,
}: {
  countryCode: string;
  classId: string;
  className?: string | null;
  classLevel?: number | null;
}) {
  const schoolClass = className
    ? { id: Number(classId), grade_name: className, grade_level: classLevel ?? 0 }
    : await getClassData(countryCode, classId);

  return (
    <nav
      aria-label="breadcrumb"
      className="bg-white/95 backdrop-blur-sm p-6 rounded-2xl border border-slate-100/50 shadow-lg"
    >
      <ol className="flex items-center flex-wrap gap-2 text-sm text-slate-600">
        <li>
          <Link
            href="/"
            className="flex items-center hover:text-blue-600 transition-colors"
          >
            <Home className="w-4 h-4 ml-1" />
            <span>الرئيسية</span>
          </Link>
        </li>
        <li>
          <ChevronLeft className="w-4 h-4 text-slate-400" />
        </li>
        <li>
          <Link
            href={`/${countryCode}/lesson`}
            className="hover:text-blue-600 transition-colors"
          >
            الصفوف الدراسية
          </Link>
        </li>
        <li>
          <ChevronLeft className="w-4 h-4 text-slate-400" />
        </li>
        <li className="font-medium text-slate-900" aria-current="page">
          {schoolClass?.grade_name || classId}
        </li>
      </ol>
    </nav>
  );
}
