'use client';

import { useState, useEffect } from 'react';
import { School, BookOpen, Calendar, FileText, Search } from 'lucide-react';
import { motion } from '@/lib/motion-lite';
import { useSearch } from '@/hooks/useSearch';
import { useCountryStore } from '@/store/useStore';
import { schoolClassesService, apiClient, API_ENDPOINTS } from '@/lib/api/services';
import { cn } from '@/lib/utils';

interface QuickSearchProps {
  onSearch?: () => void;
  className?: string;
  showTitle?: boolean;
}

interface Option {
  id: string;
  name: string;
}

export default function QuickSearch({ onSearch, className, showTitle = true }: QuickSearchProps) {
  const { quickSearch, isSearching, error } = useSearch();
  const { country } = useCountryStore();
  
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedFileType, setSelectedFileType] = useState('');

  const [classes, setClasses] = useState<Option[]>([]);
  const [subjects, setSubjects] = useState<Option[]>([]);
  const [semesters, setSemesters] = useState<Option[]>([]);
  const [isLoadingClasses, setIsLoadingClasses] = useState(false);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(false);
  const [isLoadingSemesters, setIsLoadingSemesters] = useState(false);

  // Fetch Classes on Mount
  useEffect(() => {
    const fetchClasses = async () => {
      if (!country.id) return;
      setIsLoadingClasses(true);
      try {
        const data = await schoolClassesService.getPublicAll(country.id);
        if (Array.isArray(data)) {
          setClasses(data.map((item: any) => ({
            id: String(item.id),
            name: item.grade_name || item.name
          })));
        }
      } catch {
        // Network failure — UI shows empty dropdown gracefully
      } finally {
        setIsLoadingClasses(false);
      }
    };

    fetchClasses();
  }, [country.id]);

  // Fetch Subjects when Class changes
  useEffect(() => {
    if (!selectedClass) {
      setSubjects([]);
      setSelectedSubject('');
      return;
    }

    const fetchSubjects = async () => {
      setIsLoadingSubjects(true);
      try {
        // Use the public class details endpoint which includes subjects
        const data = await schoolClassesService.getPublicById(selectedClass);
        
        // Handle Subjects
        if (data && Array.isArray(data.subjects)) {
          setSubjects(data.subjects.map((item: any) => ({
            id: String(item.id),
            name: item.subject_name || item.name || item.title || item.label || 'مادة بدون اسم'
          })));
        } else {
            setSubjects([]);
        }
      } catch {
        setSubjects([]);
      } finally {
        setIsLoadingSubjects(false);
      }
    };

    fetchSubjects();
  }, [selectedClass]);

  // Fetch Semesters when Subject changes
  useEffect(() => {
    if (!selectedSubject) {
      setSemesters([]);
      setSelectedSemester('');
      return;
    }

    const fetchSemesters = async () => {
      setIsLoadingSemesters(true);
      try {
        // Use the filter endpoint for semesters
        const response = await apiClient.get<any>(
          API_ENDPOINTS.FILTER.SEMESTERS_BY_SUBJECT(selectedSubject),
          { database: country.code }
        );
        
        const data = response.data;
        let semestersList: any[] = [];

        // Robust response handling similar to SemesterList.tsx
        if (Array.isArray(data)) {
          semestersList = data;
        } else if (data?.data?.semesters) {
          semestersList = data.data.semesters;
        } else if (Array.isArray(data?.data)) {
          semestersList = data.data;
        } else if (data?.semesters) {
           semestersList = data.semesters;
        }

        if (semestersList.length > 0) {
          setSemesters(semestersList.map((item: any) => ({
            id: String(item.id),
            name: item.semester_name || item.name || item.title || item.label || `فصل دراسي ${item.id}`
          })));
        } else {
            setSemesters([]);
        }
      } catch {
        setSemesters([]);
      } finally {
        setIsLoadingSemesters(false);
      }
    };

    fetchSemesters();
  }, [selectedSubject, country.code]);

  const fileTypes = [
    { id: 'plan', name: 'خطط الدراسة' },
    { id: 'analysis', name: 'تحليل المحتوى' },
    { id: 'exam', name: 'اختبارات' },
    { id: 'book', name: 'كتب ودوسيات' },
    { id: 'worksheet', name: 'أوراق عمل' },
  ];

  const handleSearch = () => {
    quickSearch({
      classId: selectedClass,
      subjectId: selectedSubject,
      semester: selectedSemester,
      fileType: selectedFileType,
    });
    
    onSearch?.();
  };

  const isSearchDisabled = !selectedClass && !selectedSubject && !selectedSemester && !selectedFileType;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className={cn('bg-card rounded-2xl shadow-lg border border-border p-6 text-foreground', className)}
    >
      {showTitle && <h3 className="text-xl font-bold text-center text-foreground mb-6">بحث سريع</h3>}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Class Selector */}
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center text-green-600 mx-auto mb-2">
            <School className="w-6 h-6" />
          </div>
          <select
            id="qs-class"
            name="classId"
            aria-label="اختر الصف"
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            disabled={isLoadingClasses}
            className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:ring-2 focus:ring-green-500/30 focus:border-green-500 disabled:bg-muted disabled:text-muted-foreground"
          >
            <option value="">{isLoadingClasses ? 'جاري التحميل...' : 'اختر صف'}</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>
        </div>

        {/* Subject Selector */}
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 mx-auto mb-2">
            <BookOpen className="w-6 h-6" />
          </div>
          <select
            id="qs-subject"
            name="subjectId"
            aria-label="اختر المادة"
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            disabled={!selectedClass || isLoadingSubjects}
            className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 disabled:bg-muted disabled:text-muted-foreground"
          >
            <option value="">{isLoadingSubjects ? 'جاري التحميل...' : 'اختر المادة'}</option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
        </div>

        {/* Semester Selector */}
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600 mx-auto mb-2">
            <Calendar className="w-6 h-6" />
          </div>
          <select
            id="qs-semester"
            name="semesterId"
            aria-label="اختر الفصل الدراسي"
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
            disabled={!selectedSubject || isLoadingSemesters}
            className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 disabled:bg-muted disabled:text-muted-foreground"
          >
            <option value="">{isLoadingSemesters ? 'جاري التحميل...' : 'اختر فصل دراسي'}</option>
            {semesters.map((semester) => (
              <option key={semester.id} value={semester.id}>
                {semester.name}
              </option>
            ))}
          </select>
        </div>

        {/* File Type Selector */}
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 mx-auto mb-2">
            <FileText className="w-6 h-6" />
          </div>
          <select
            id="qs-file-type"
            name="fileType"
            aria-label="تصنيف الملف"
            value={selectedFileType}
            onChange={(e) => setSelectedFileType(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
          >
            <option value="">تصنيف الملف</option>
            {fileTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg text-sm text-center">
          {error}
        </div>
      )}

      {/* Search Button */}
      <div className="text-center">
        <button
          onClick={handleSearch}
          disabled={isSearchDisabled || isSearching}
          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-8 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center mx-auto gap-2"
        >
          <Search className="w-5 h-5" />
          {isSearching ? 'جاري البحث...' : 'ابحث الآن'}
        </button>
        
        {isSearchDisabled && (
          <p className="text-sm text-muted-foreground mt-3">
            اختر على الأقل خيار واحد للبحث
          </p>
        )}
      </div>
    </motion.div>
  );
}

