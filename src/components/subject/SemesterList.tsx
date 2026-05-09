import Link from 'next/link';
import { getSubjectSemesters, type AcademicSemester } from '@/lib/academic-data';

interface FileCategory {
  id: number | string;
  name: string;
  slug?: string;
  files_count?: number;
  articles_count?: number;
}

interface Semester extends AcademicSemester {
  file_categories?: FileCategory[];
}

export const STANDARD_CATEGORIES = [
  { id: 'plans', name: 'خطط الدراسة', slug: 'plans' },
  { id: 'papers', name: 'أوراق عمل', slug: 'papers' },
  { id: 'tests', name: 'اختبارات', slug: 'tests' },
  { id: 'books', name: 'كتب المدرسة', slug: 'books' },
  { id: 'records', name: 'السجلات', slug: 'records' },
];

const getCategoryStyle = (id: string) => {
  switch (id) {
    case 'plans':
      return 'border-gray-400 text-gray-600 hover:bg-gray-50';
    case 'papers':
      return 'border-green-500 text-green-600 hover:bg-green-50';
    case 'tests':
      return 'border-red-500 text-red-600 hover:bg-red-50';
    case 'books':
      return 'border-yellow-500 text-yellow-600 hover:bg-yellow-50';
    case 'records':
      return 'border-cyan-500 text-cyan-600 hover:bg-cyan-50';
    default:
      return 'border-blue-500 text-blue-600 hover:bg-blue-50';
  }
};

async function getSemesters(countryCode: string, subjectId: string) {
  const data = await getSubjectSemesters(countryCode, subjectId);
  return data.semesters;
}

export default async function SemesterList({
  countryCode,
  subjectId,
  subjectName,
  initialSemesters,
}: {
  countryCode: string;
  subjectId: string;
  subjectName: string;
  classId?: string;
  initialSemesters?: Semester[];
}) {
  const semesters = initialSemesters ?? await getSemesters(countryCode, subjectId);

  if (!semesters.length) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">لا توجد فصول دراسية متاحة حالياً</p>
      </div>
    );
  }

  return (
    <>
      {semesters.map((semester) => (
        <div key={semester.id} className="my-4">
          <div className="row justify-content-center">
            <div className="col-lg-10 mx-auto">
              <div className="p-6 bg-white rounded-xl shadow-lg border border-gray-100">
                <div className="text-center">
                  <h5 className="font-bold text-xl text-gray-800 mb-6">
                    {semester.semester_name} - {subjectName}
                  </h5>

                  <div className="flex flex-wrap justify-center gap-4">
                    {STANDARD_CATEGORIES.map((cat) => (
                      <Link
                        key={cat.id}
                        href={`/${countryCode}/lesson/subjects/${subjectId}/articles/${semester.id}/${cat.id}`}
                        className={`px-6 py-2 rounded-lg border transition-all duration-200 font-medium ${getCategoryStyle(cat.id as string)}`}
                      >
                        {cat.name}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </>
  );
}
