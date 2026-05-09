'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from '@/lib/motion-lite';
import { 
  Search as SearchIcon, 
  FileText, 
  BookOpen, 
  GraduationCap, 
  Filter, 
  ArrowLeft,
  Calendar,
  Layers,
  FileQuestion,
  Book,
  FileCheck,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import AnimatedSection from '@/components/ui/AnimatedSection';

interface SearchResult {
  id: string;
  title: string;
  type: 'post' | 'article' | 'lesson';
  description?: string;
  url: string;
  date: string;
}

// Helper for random-like consistent colors
const getCardColor = (index: number) => {
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

function SearchHeader({ 
  resultCount, 
  criteriaList 
}: { 
  resultCount: number | null, 
  criteriaList: { label: string, value: string }[] 
}) {
  return (
    <section className="relative pt-32 pb-20 overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900/90 to-indigo-900/80">
      {/* Background Pattern */}
      <div className="absolute w-full h-full top-0 left-0 bg-gradient-to-r from-blue-600/10 via-transparent to-indigo-600/10" />

      {/* Animated Shapes */}
      <div className="absolute rounded-full w-72 h-72 -top-36 -right-36 bg-gradient-to-br from-blue-600/20 via-transparent to-indigo-600/20" />
      <div className="absolute rounded-full w-48 h-48 -bottom-24 -left-24 bg-gradient-to-br from-blue-600/20 via-transparent to-indigo-600/20" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="flex justify-center">
          <div className="w-full lg:w-2/3 text-center">
            {/* Main Title */}
            <motion.h2 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-5xl font-bold text-white mb-6"
              style={{ textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
            >
              نتائج البحث
            </motion.h2>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-blue-100 text-lg mb-8"
            >
              {resultCount !== null 
                ? `تم العثور على ${resultCount} نتيجة مطابقة لبحثك`
                : 'جاري البحث في المصادر التعليمية...'
              }
            </motion.div>

            {/* Active Filters as Chips */}
            {criteriaList.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex flex-wrap justify-center gap-3"
              >
                {criteriaList.map((criteria, index) => (
                  <div 
                    key={index} 
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white text-sm"
                  >
                    <span className="opacity-70">{criteria.label}:</span>
                    <span className="font-semibold">{criteria.value}</span>
                  </div>
                ))}
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Modern Wave Shape Divider */}
      <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-[0]" style={{ height: '80px' }}>
        <svg 
          viewBox="0 0 1200 120" 
          preserveAspectRatio="none" 
          style={{ width: '100%', height: '80px', transform: 'rotate(180deg)' }}
        >
          <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" className="fill-slate-50" />
          <path d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" className="fill-slate-50/50" />
        </svg>
      </div>
    </section>
  );
}

function SearchContent() {
  const searchParams = useSearchParams();
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const classId = searchParams.get('class');
  const subjectId = searchParams.get('subject');
  const semester = searchParams.get('semester');
  const fileType = searchParams.get('type');
  const query = searchParams.get('q');

  useEffect(() => {
    const performSearch = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (classId) params.append('class', classId);
        if (subjectId) params.append('subject', subjectId);
        if (semester) params.append('semester', semester);
        if (fileType) params.append('type', fileType);
        if (query) params.append('q', query);

        const response = await fetch(`/api/search?${params.toString()}`);
        const data = await response.json();
        
        if (data.success) {
          setResults(data.results);
        } else {
          setError(data.error || 'حدث خطأ أثناء البحث');
        }
        
      } catch (err) {
        setError('حدث خطأ أثناء البحث. يرجى المحاولة مرة أخرى.');
        console.error('Search error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    performSearch();
  }, [classId, subjectId, semester, fileType, query]);

  const getSearchCriteria = () => {
    const criteria = [];
    if (classId) criteria.push({ label: 'الصف', value: classId });
    if (subjectId) criteria.push({ label: 'المادة', value: subjectId });
    if (semester) criteria.push({ label: 'الفصل', value: semester });
    if (fileType) criteria.push({ label: 'النوع', value: fileType });
    if (query) criteria.push({ label: 'بحث', value: query });
    return criteria;
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'lesson': return <GraduationCap className="w-6 h-6" />;
      case 'article': return <BookOpen className="w-6 h-6" />;
      case 'post': return <FileText className="w-6 h-6" />;
      default: return <FileText className="w-6 h-6" />;
    }
  };

  const criteriaList = getSearchCriteria();

  return (
    <div className="min-h-screen bg-slate-50">
      <SearchHeader resultCount={isLoading ? null : results.length} criteriaList={criteriaList} />

      <div className="container mx-auto px-4 -mt-10 relative z-20 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Sidebar Filters */}
          <AnimatedSection delay={0.2} className="lg:col-span-1">
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl border border-slate-100/50 p-6 shadow-lg sticky top-24">
              <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
                <Filter className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-800">تصفية النتائج</h3>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-3 block">نوع الملف</label>
                  <div className="space-y-2">
                    {[
                      { id: 'plan', label: 'الخطط الدراسية', icon: FileText },
                      { id: 'worksheet', label: 'أوراق العمل', icon: FileCheck },
                      { id: 'exam', label: 'الاختبارات', icon: FileQuestion },
                      { id: 'book', label: 'الكتب المدرسية', icon: Book }
                    ].map((type) => (
                      <Link 
                        key={type.id} 
                        href={`/search?${new URLSearchParams({
                            ...(classId && {class: classId}),
                            ...(subjectId && {subject: subjectId}),
                            ...(semester && {semester: semester}),
                            ...(query && {q: query}),
                            type: type.id
                        }).toString()}`}
                        className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${
                          fileType === type.id 
                            ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm' 
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                      >
                        <type.icon className={`w-4 h-4 ${fileType === type.id ? 'text-blue-600' : 'text-slate-400'}`} />
                        <span className="text-sm font-medium">{type.label}</span>
                        {fileType === type.id && <div className="mr-auto w-1.5 h-1.5 rounded-full bg-blue-600" />}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </AnimatedSection>

          {/* Results Grid */}
          <div className="lg:col-span-3">
            <AnimatedSection delay={0.3}>
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="bg-white/95 backdrop-blur-sm rounded-2xl border border-slate-100/50 p-6 shadow-lg animate-pulse h-48">
                      <div className="flex gap-4">
                        <div className="w-12 h-12 bg-slate-100 rounded-xl shrink-0" />
                        <div className="flex-1 space-y-3">
                          <div className="h-5 bg-slate-100 rounded-lg w-3/4" />
                          <div className="h-4 bg-slate-100 rounded-lg w-1/2" />
                          <div className="h-3 bg-slate-100 rounded-lg w-full mt-4" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="bg-white/95 backdrop-blur-sm rounded-2xl border border-red-100 p-12 text-center shadow-lg">
                  <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                    <AlertCircle className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">عذراً، حدث خطأ</h3>
                  <p className="text-slate-600 mb-6">{error}</p>
                  <button 
                    onClick={() => window.location.reload()}
                    className="px-8 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors font-medium shadow-lg shadow-red-500/20"
                  >
                    إعادة المحاولة
                  </button>
                </div>
              ) : results.length === 0 ? (
                <div className="bg-white/95 backdrop-blur-sm rounded-2xl border border-slate-100/50 p-12 text-center shadow-lg">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-400">
                    <SearchIcon className="w-10 h-10" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">لا توجد نتائج</h3>
                  <p className="text-slate-600 mb-8 max-w-md mx-auto">
                    لم نتمكن من العثور على أي نتائج تطابق معايير البحث الخاصة بك. حاول تغيير معايير البحث أو استخدام كلمات مفتاحية مختلفة.
                  </p>
                  <Link 
                    href="/"
                    className="inline-flex items-center px-6 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors font-medium"
                  >
                    <ArrowLeft className="w-4 h-4 ml-2" />
                    العودة للصفحة الرئيسية
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {results.map((result, index) => {
                    const color = getCardColor(index);
                    return (
                      <Link
                        key={result.id}
                        href={result.url}
                        className={`group block p-6 bg-white/95 backdrop-blur-sm rounded-2xl border border-slate-100/50 ${color.hover} shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300`}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`w-12 h-12 rounded-xl ${color.bg} ${color.text} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-md`}>
                            {getIconForType(result.type)}
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                              {result.title}
                            </h3>
                            <p className="text-sm text-slate-600 line-clamp-2 mb-4 leading-relaxed">
                              {result.description}
                            </p>
                            
                            <div className="flex items-center gap-4 text-xs font-medium text-slate-400 border-t border-slate-100 pt-4 mt-auto">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" />
                                {result.date}
                              </span>
                              <span className="flex items-center gap-1">
                                <Layers className="w-3.5 h-3.5" />
                                {result.type === 'lesson' ? 'درس' : result.type === 'article' ? 'مقال' : 'منشور'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </AnimatedSection>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}

