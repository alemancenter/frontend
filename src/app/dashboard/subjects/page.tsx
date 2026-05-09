'use client';

import { useEffect, useMemo, useState } from 'react';
import { Plus, Search, Edit, Trash2, BookMarked, Layers, ChevronDown } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import DataTable from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import type { Subject, SchoolClass } from '@/types';
import { subjectsService, schoolClassesService, COUNTRIES } from '@/lib/api/services';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import AccessDenied from '@/components/common/AccessDenied';

export default function SubjectsPage() {
  const { isAuthorized } = usePermissionGuard('manage subjects');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [schoolClasses, setSchoolClasses] = useState<SchoolClass[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [modal, setModal] = useState<{ open: boolean; mode: 'create' | 'edit'; subject: Subject | null }>({
    open: false,
    mode: 'create',
    subject: null,
  });
  const [selectedCountry, setSelectedCountry] = useState<string>('1');
  const [formData, setFormData] = useState<{ subject_name: string; grade_level: number | '' }>({
    subject_name: '',
    grade_level: '',
  });
  const [expandedGrades, setExpandedGrades] = useState<Set<number>>(new Set());

  const gradeLevelOptions = useMemo(
    () => schoolClasses.map((c) => ({ value: c.grade_level, label: c.grade_name })),
    [schoolClasses]
  );

  useEffect(() => {
    if (!isAuthorized) return;
    let cancelled = false;

    const fetchData = async () => {
      try {
        setLoading(true);
        const [subjectsData, classesData] = await Promise.all([
          subjectsService.getAll(selectedCountry),
          schoolClassesService.getAll(selectedCountry),
        ]);
        if (!cancelled) {
          setSubjects(subjectsData);
          setSchoolClasses(classesData);
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();
    return () => { cancelled = true; };
  }, [selectedCountry, isAuthorized]);

  if (isAuthorized === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (isAuthorized === false) {
    return <AccessDenied />;
  }

  const getGradeName = (gradeLevel: number) => {
    const cls = schoolClasses.find((c) => c.grade_level === gradeLevel);
    if (cls) return cls.grade_name;
    const arabicOrdinals = [
      'الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس',
      'السابع', 'الثامن', 'التاسع', 'العاشر', 'الحادي عشر', 'الثاني عشر',
    ];
    if (gradeLevel >= 1 && gradeLevel <= 12) return `الصف ${arabicOrdinals[gradeLevel - 1]}`;
    return `الصف ${gradeLevel}`;
  };

  const columns = [
    {
      key: 'subject_name',
      title: 'اسم المادة',
      sortable: true,
      render: (value: string, item: Subject) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
            <BookMarked className="w-5 h-5 text-accent" />
          </div>
          <div>
            <p className="font-medium">{item.subject_name}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'grade_level',
      title: 'الصف',
      render: (value: number) => <Badge variant="info">{getGradeName(value)}</Badge>,
    },
    {
      key: 'articles_count',
      title: 'المقالات',
      sortable: true,
      render: (value: number) => (
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-muted-foreground" />
          <span>{value}</span>
        </div>
      ),
    },
    {
      key: 'actions',
      title: 'الإجراءات',
      render: (_: unknown, item: Subject) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => openEditModal(item)}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
          >
            <Edit className="w-4 h-4 text-muted-foreground" />
          </button>
          <button
            onClick={() => handleDelete(item.id)}
            className="p-1.5 rounded-lg hover:bg-error/10 transition-colors"
          >
            <Trash2 className="w-4 h-4 text-error" />
          </button>
        </div>
      ),
    },
  ];

  const filteredSubjects = subjects.filter((s) =>
    (s.subject_name ?? '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedByGrade = filteredSubjects.reduce<Record<number, Subject[]>>((acc, s) => {
    const key = Number(s.grade_level || 0);
    if (!acc[key]) acc[key] = [];
    acc[key].push(s);
    return acc;
  }, {});

  const orderedGrades = Object.keys(groupedByGrade)
    .map((k) => Number(k))
    .sort((a, b) => a - b);

  const toggleGrade = (grade: number) => {
    setExpandedGrades((prev) => {
      const next = new Set(prev);
      if (next.has(grade)) next.delete(grade);
      else next.add(grade);
      return next;
    });
  };

  const formatSubjectsCount = (count: number) => {
    const num = Number(count).toLocaleString('ar-SA');
    return `${num} ${count === 1 ? 'مادة' : 'مواد'}`;
  };

  const openEditModal = (subject: Subject) => {
    setFormData({ subject_name: subject.subject_name, grade_level: subject.grade_level });
    setModal({ open: true, mode: 'edit', subject });
  };

  const openCreateModal = () => {
    setFormData({ subject_name: '', grade_level: '' });
    setModal({ open: true, mode: 'create', subject: null });
  };

  const handleSubmit = async () => {
    if (!formData.subject_name || !formData.grade_level) return;
    try {
      setLoading(true);
      if (modal.mode === 'create') {
        await subjectsService.create({
          country_id: selectedCountry,
          subject_name: formData.subject_name,
          grade_level: Number(formData.grade_level),
        });
      } else if (modal.subject) {
        await subjectsService.update(modal.subject.id, {
          country_id: selectedCountry,
          subject_name: formData.subject_name,
          grade_level: Number(formData.grade_level),
        });
      }
      const refreshed = await subjectsService.getAll(selectedCountry);
      setSubjects(refreshed);
      setModal({ open: false, mode: 'create', subject: null });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذه المادة؟')) return;
    try {
      setLoading(true);
      await subjectsService.delete(id, selectedCountry);
      setSubjects((prev) => prev.filter((s) => s.id !== id));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">إدارة المواد الدراسية</h1>
          <p className="text-muted-foreground">إدارة المواد والمناهج الدراسية</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            className="bg-card border border-border rounded-lg px-3 py-2 text-sm"
          >
            {COUNTRIES.map((country) => (
              <option key={country.id} value={country.id}>
                {country.name}
              </option>
            ))}
          </select>
          <Button leftIcon={<Plus className="w-4 h-4" />} onClick={openCreateModal}>
            إضافة مادة
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-muted-foreground">إجمالي المواد</p>
            <p className="text-2xl font-bold text-primary">{subjects.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-muted-foreground">إجمالي المقالات</p>
            <p className="text-2xl font-bold text-accent">
              {subjects.reduce((sum, s) => sum + (s.articles_count || 0), 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-muted-foreground">الصفوف الدراسية</p>
            <p className="text-2xl font-bold text-success">{schoolClasses.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle>قائمة المواد</CardTitle>
          <div className="relative">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <label htmlFor="subjects-search" className="sr-only">بحث عن مادة</label>
            <input
              type="text"
              placeholder="بحث..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              id="subjects-search"
              name="search"
              className="bg-muted border-none rounded-lg pr-9 pl-4 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <DataTable data={[]} columns={columns} loading={loading} />
          ) : orderedGrades.length === 0 ? (
            <DataTable data={[]} columns={columns} loading={false} emptyMessage="لا توجد مواد مطابقة" />
          ) : (
            <div className="space-y-6">
              {orderedGrades.map((grade) => (
                <div key={grade} className="space-y-2">
                  <button
                    type="button"
                    onClick={() => toggleGrade(grade)}
                    className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant="info" size="md">{getGradeName(grade)}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {formatSubjectsCount(groupedByGrade[grade]?.length || 0)}
                      </span>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-muted-foreground transition-transform ${expandedGrades.has(grade) ? 'rotate-180' : 'rotate-0'}`}
                    />
                  </button>
                  {expandedGrades.has(grade) ? (
                    <DataTable
                      data={groupedByGrade[grade]}
                      columns={columns}
                      loading={false}
                      emptyMessage="لا توجد مواد"
                    />
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal */}
      <Modal
        isOpen={modal.open}
        onClose={() => setModal({ open: false, mode: 'create', subject: null })}
        title={modal.mode === 'create' ? 'إضافة مادة جديدة' : 'تعديل المادة'}
      >
        <div className="space-y-4 mt-4">
          <Input
            label="اسم المادة"
            value={formData.subject_name}
            onChange={(e) => setFormData({ ...formData, subject_name: e.target.value })}
            placeholder="مثال: الرياضيات"
          />
          <Select
            label="الصف الدراسي"
            value={formData.grade_level || ''}
            onChange={(e) => setFormData({ ...formData, grade_level: Number(e.target.value) })}
            options={gradeLevelOptions}
            placeholder="اختر الصف الدراسي"
          />
          <div className="flex items-center justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setModal({ open: false, mode: 'create', subject: null })}
            >
              إلغاء
            </Button>
            <Button onClick={handleSubmit}>
              {modal.mode === 'create' ? 'إضافة' : 'حفظ'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
