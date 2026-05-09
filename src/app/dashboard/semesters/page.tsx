'use client';

import { useEffect, useMemo, useState } from 'react';
import { Plus, Search, Edit, Trash2, Calendar, BookOpen, ChevronDown } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import DataTable from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import type { Semester } from '@/types';
import { semestersService, COUNTRIES } from '@/lib/api/services';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import AccessDenied from '@/components/common/AccessDenied';

export default function SemestersPage() {
  const { isAuthorized } = usePermissionGuard('manage semesters');
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [modal, setModal] = useState<{ open: boolean; mode: 'create' | 'edit'; semester: Semester | null }>({
    open: false,
    mode: 'create',
    semester: null,
  });
  const [selectedCountry, setSelectedCountry] = useState<'1' | '2' | '3' | '4'>('1');
  const [formData, setFormData] = useState<{ semester_name: string; grade_level: number | '' }>({
    semester_name: '',
    grade_level: '',
  });

  const gradeLevelOptions = useMemo(
    () => Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: `المستوى ${i + 1}` })),
    []
  );

  useEffect(() => {
    if (!isAuthorized) return;
    let cancelled = false;
    const fetchSemesters = async () => {
      try {
        setLoading(true);
        const data = await semestersService.getAll(selectedCountry);
        if (!cancelled) setSemesters(data);
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchSemesters();
    return () => { cancelled = true; };
  }, [selectedCountry, isAuthorized]);

  const [expandedGrades, setExpandedGrades] = useState<Set<number>>(new Set());

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

  const filteredSemesters = semesters.filter((s) =>
    (s.semester_name ?? '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedByGrade = filteredSemesters.reduce<Record<number, Semester[]>>((acc, s) => {
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

  const arabicOrdinals = [
    'الأول',
    'الثاني',
    'الثالث',
    'الرابع',
    'الخامس',
    'السادس',
    'السابع',
    'الثامن',
    'التاسع',
    'العاشر',
    'الحادي عشر',
    'الثاني عشر',
  ];

  const getGradeName = (grade: number) => {
    if (grade >= 1 && grade <= 12) {
      return `الصف ${arabicOrdinals[grade - 1]}`;
    }
    return `الصف ${grade}`;
  };

  const formatSemestersCount = (count: number) => {
    const num = Number(count).toLocaleString('ar-SA');
    return `${num} ${count === 1 ? 'فصل' : 'فصول'}`;
  };

  const columns = [
    {
      key: 'semester_name',
      title: 'اسم الفصل',
      sortable: true,
      render: (value: string, item: Semester) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-medium">{item.semester_name}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'grade_level',
      title: 'المستوى',
      render: (value: number) => <Badge variant="info">المستوى {value}</Badge>,
    },
    {
      key: 'articles_count',
      title: 'المقالات',
      sortable: true,
      render: (value: number) => (
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-muted-foreground" />
          <span>{value}</span>
        </div>
      ),
    },
    {
      key: 'actions',
      title: 'الإجراءات',
      render: (_: unknown, item: Semester) => (
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

  const openEditModal = (semester: Semester) => {
    setFormData({ semester_name: semester.semester_name, grade_level: semester.grade_level });
    setModal({ open: true, mode: 'edit', semester });
  };

  const openCreateModal = () => {
    setFormData({ semester_name: '', grade_level: '' });
    setModal({ open: true, mode: 'create', semester: null });
  };

  const handleSubmit = async () => {
    if (!formData.semester_name || !formData.grade_level) return;
    try {
      setLoading(true);
      if (modal.mode === 'create') {
        await semestersService.create({
          country_id: selectedCountry,
          semester_name: formData.semester_name,
          grade_level: Number(formData.grade_level),
        });
      } else if (modal.semester) {
        await semestersService.update(modal.semester.id, {
          country_id: selectedCountry,
          semester_name: formData.semester_name,
          grade_level: Number(formData.grade_level),
        });
      }
      const refreshed = await semestersService.getAll(selectedCountry);
      setSemesters(refreshed);
      setModal({ open: false, mode: 'create', semester: null });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا الفصل؟')) return;
    try {
      setLoading(true);
      await semestersService.delete(id, selectedCountry);
      setSemesters((prev) => prev.filter((s) => s.id !== id));
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
          <h1 className="text-2xl font-bold">إدارة الفصول الدراسية</h1>
          <p className="text-muted-foreground">إدارة فصول العام الدراسي</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value as '1' | '2' | '3' | '4')}
            className="bg-card border border-border rounded-lg px-3 py-2 text-sm"
          >
            {COUNTRIES.map((country) => (
              <option key={country.id} value={country.id}>
                {country.name}
              </option>
            ))}
          </select>
          <Button leftIcon={<Plus className="w-4 h-4" />} onClick={openCreateModal}>
            إضافة فصل
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-muted-foreground">إجمالي الفصول</p>
            <p className="text-2xl font-bold text-primary">{semesters.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-muted-foreground">إجمالي المقالات</p>
            <p className="text-2xl font-bold text-accent">
              {semesters.reduce((sum, s) => sum + (s.articles_count || 0), 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-muted-foreground">الصفوف المرتبطة</p>
            <p className="text-2xl font-bold text-success">
              {new Set(semesters.map((s) => s.class_id)).size}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle>قائمة الفصول</CardTitle>
          <div className="relative">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <label htmlFor="semesters-search" className="sr-only">بحث عن فصل</label>
            <input
              type="text"
              placeholder="بحث..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              id="semesters-search"
              name="search"
              className="bg-muted border-none rounded-lg pr-9 pl-4 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <DataTable data={[]} columns={columns} loading={loading} />
          ) : orderedGrades.length === 0 ? (
            <DataTable data={[]} columns={columns} loading={false} emptyMessage="لا توجد فصول مطابقة" />
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
                        {formatSemestersCount(groupedByGrade[grade]?.length || 0)}
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
                      emptyMessage="لا توجد فصول"
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
        onClose={() => setModal({ open: false, mode: 'create', semester: null })}
        title={modal.mode === 'create' ? 'إضافة فصل جديد' : 'تعديل الفصل'}
      >
        <div className="space-y-4 mt-4">
          <Input
            label="اسم الفصل"
            value={formData.semester_name}
            onChange={(e) => setFormData({ ...formData, semester_name: e.target.value })}
            placeholder="مثال: الفصل الدراسي الأول"
          />
          <Select
            label="المستوى"
            value={formData.grade_level || ''}
            onChange={(e) => setFormData({ ...formData, grade_level: Number(e.target.value) })}
            options={gradeLevelOptions}
            placeholder="اختر المستوى"
          />
          <div className="flex items-center justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setModal({ open: false, mode: 'create', semester: null })}
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
