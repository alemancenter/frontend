import Link from 'next/link';
import { Home, ChevronLeft, BookOpen } from 'lucide-react';
import { getSchoolClass } from '@/lib/academic-data';

async function getClassData(countryCode: string, classId: string) {
  return getSchoolClass(countryCode, classId);
}

export default async function SubjectBreadcrumb({
  countryCode,
  classId,
  subjectName,
}: {
  countryCode: string;
  classId: string;
  subjectName: string;
}) {
  const schoolClass = await getClassData(countryCode, classId);

  return (
    <nav aria-label="breadcrumb" className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
      <ol className="flex items-center flex-wrap gap-2 text-sm text-gray-600">
        <li>
          <Link href="/" className="flex items-center hover:text-blue-600 transition-colors">
            <Home className="w-4 h-4 ml-1" />
            <span>الرئيسية</span>
          </Link>
        </li>
        <li>
          <ChevronLeft className="w-4 h-4 text-gray-400" />
        </li>
        <li>
          <Link href={`/${countryCode}/lesson`} className="hover:text-blue-600 transition-colors">
            الصفوف الدراسية
          </Link>
        </li>
        <li>
          <ChevronLeft className="w-4 h-4 text-gray-400" />
        </li>
        <li>
          <Link href={`/${countryCode}/lesson/${classId}`} className="hover:text-blue-600 transition-colors">
            {schoolClass?.grade_name || classId}
          </Link>
        </li>
        <li>
          <ChevronLeft className="w-4 h-4 text-gray-400" />
        </li>
        <li className="font-medium text-gray-900 flex items-center" aria-current="page">
          <BookOpen className="w-4 h-4 ml-1 text-primary" />
          {subjectName}
        </li>
      </ol>
    </nav>
  );
}
