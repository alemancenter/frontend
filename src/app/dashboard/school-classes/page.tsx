'use client';

import { useEffect, useMemo, useState } from 'react';
import { Plus, Search, Edit, Trash2, GraduationCap } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import DataTable from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import type { SchoolClass } from '@/types';
import { schoolClassesService, COUNTRIES } from '@/lib/api/services';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import AccessDenied from '@/components/common/AccessDenied';

export default function SchoolClassesPage() {
  const { isAuthorized } = usePermissionGuard('manage school classes');
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('1');
  const [modal, setModal] = useState<{ open: boolean; mode: 'create' | 'edit'; classItem: SchoolClass | null }>({
    open: false,
    mode: 'create',
    classItem: null,
  });
  const [formData, setFormData] = useState<{ grade_name: string; grade_level: number | '' }>({
    grade_name: '',
    grade_level: '',
  });

  const gradeLevelOptions = useMemo(
    () => Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: `المستوى ${i + 1}` })),
    []
  );

  useEffect(() => {
    if (!isAuthorized) return;
    const fetchClasses = async () => {
      try {
        setLoading(true);
        const data = await schoolClassesService.getAll(selectedCountry);
        setClasses(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchClasses();
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

  const columns = [
    {
      key: 'grade_name',
      title: 'اسم الصف',
      sortable: true,
      render: (value: string) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-medium">{value}</p>
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
      key: 'actions',
      title: 'الإجراءات',
      render: (_: unknown, item: SchoolClass) => (
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

  const openEditModal = (classItem: SchoolClass) => {
    setFormData({
      grade_name: classItem.grade_name,
      grade_level: classItem.grade_level,
    });
    setModal({ open: true, mode: 'edit', classItem });
  };

  const openCreateModal = () => {
    setFormData({ grade_name: '', grade_level: '' });
    setModal({ open: true, mode: 'create', classItem: null });
  };

  const handleSubmit = async () => {
    if (!formData.grade_name || !formData.grade_level) return;
    try {
      setLoading(true);
      if (modal.mode === 'create') {
        await schoolClassesService.create({
          country_id: selectedCountry,
          grade_name: formData.grade_name,
          grade_level: Number(formData.grade_level),
        });
      } else if (modal.classItem) {
        await schoolClassesService.update(modal.classItem.id, {
          country_id: selectedCountry,
          grade_name: formData.grade_name,
          grade_level: Number(formData.grade_level),
        });
      }
      const refreshed = await schoolClassesService.getAll(selectedCountry);
      setClasses(refreshed);
      setModal({ open: false, mode: 'create', classItem: null });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا الصف؟')) return;
    try {
      setLoading(true);
      await schoolClassesService.delete(id, selectedCountry);
      setClasses((prev) => prev.filter((c) => c.id !== id));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">إدارة الصفوف الدراسية</h1>
          <p className="text-muted-foreground">إدارة الصفوف والمراحل الدراسية</p>
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
            إضافة صف
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle>قائمة الصفوف</CardTitle>
          <div className="relative">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="بحث..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-muted border-none rounded-lg pr-9 pl-4 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            data={classes.filter((c) =>
              (c.grade_name ?? '').toLowerCase().includes(searchQuery.toLowerCase())
            )}
            columns={columns}
            loading={loading}
          />
        </CardContent>
      </Card>

      <Modal
        isOpen={modal.open}
        onClose={() => setModal({ open: false, mode: 'create', classItem: null })}
        title={modal.mode === 'create' ? 'إضافة صف جديد' : 'تعديل الصف'}
      >
        <div className="space-y-4 mt-4">
          <Input
            label="اسم الصف"
            value={formData.grade_name}
            onChange={(e) => setFormData({ ...formData, grade_name: e.target.value })}
            placeholder="مثال: الصف الأول الابتدائي"
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
              onClick={() => setModal({ open: false, mode: 'create', classItem: null })}
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
