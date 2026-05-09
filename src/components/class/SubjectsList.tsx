import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import { getSubjectsForClass, type AcademicSubject } from '@/lib/academic-data';

type Subject = AcademicSubject;

async function getSubjects(countryCode: string, classId: string) {
  return getSubjectsForClass(countryCode, classId);
}

// Subject colors helper
const getSubjectColor = (index: number) => {
  const colors = [
    { bg: 'bg-blue-500/10', text: 'text-blue-500', border: 'border-blue-200', hover: 'hover:border-blue-300' },
    { bg: 'bg-purple-500/10', text: 'text-purple-500', border: 'border-purple-200', hover: 'hover:border-purple-300' },
    { bg: 'bg-green-500/10', text: 'text-green-500', border: 'border-green-200', hover: 'hover:border-green-300' },
    { bg: 'bg-orange-500/10', text: 'text-orange-500', border: 'border-orange-200', hover: 'hover:border-orange-300' },
    { bg: 'bg-red-500/10', text: 'text-red-500', border: 'border-red-200', hover: 'hover:border-red-300' },
    { bg: 'bg-indigo-500/10', text: 'text-indigo-500', border: 'border-indigo-200', hover: 'hover:border-indigo-300' },
    { bg: 'bg-teal-500/10', text: 'text-teal-500', border: 'border-teal-200', hover: 'hover:border-teal-300' },
    { bg: 'bg-fuchsia-500/10', text: 'text-fuchsia-500', border: 'border-fuchsia-200', hover: 'hover:border-fuchsia-300' },
  ];
  return colors[index % colors.length];
};

export default async function SubjectsList({
  countryCode,
  classId,
}: {
  countryCode: string;
  classId: string;
}) {
  const subjects = await getSubjects(countryCode, classId);

  if (!subjects.length) {
    return (
      <div className="text-center py-16 bg-white/95 backdrop-blur-sm rounded-2xl border border-slate-100/50 shadow-lg">
        <p className="text-slate-600 text-lg">لا توجد مواد دراسية متاحة لهذا الصف حالياً</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {subjects.map((subject: Subject, index: number) => {
        const color = getSubjectColor(index);
        return (
          <Link
            key={subject.id}
            href={`/${countryCode}/lesson/subjects/${subject.id}?id=${classId}`}
            className={`group block p-6 bg-white/95 backdrop-blur-sm rounded-2xl border border-slate-100/50 ${color.hover} shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300`}
          >
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl ${color.bg} ${color.text} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-md`}>
                <BookOpen className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                  {subject.subject_name || subject.name}
                </h3>
                <p className="text-sm text-slate-600 line-clamp-2">
                  {subject.description || 'تصفح محتوى المادة الدراسية، أوراق العمل، والاختبارات.'}
                </p>
                <div className="mt-4 flex items-center gap-4 text-xs text-slate-500">
                  <span>{subject.files_count || 0} ملف</span>
                  <span>•</span>
                  <span>{subject.articles_count || 0} مقال</span>
                </div>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
