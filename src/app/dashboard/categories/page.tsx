'use client';

import { useEffect, useState, useMemo } from 'react';
import Image from '@/components/common/AppImage';
import { getStorageUrl } from '@/lib/utils';
import * as LucideIcons from 'lucide-react';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  FolderTree,
  ToggleLeft,
  ToggleRight,
  XCircle,
  CheckCircle2,
  CornerDownLeft,
} from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import DataTable from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import IconPicker from '@/components/ui/IconPicker';
import type { Category } from '@/types';
import { categoriesService, COUNTRIES } from '@/lib/api/services';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import AccessDenied from '@/components/common/AccessDenied';

const mockCategories: Category[] = [];

// Helper functions for Tree View
function buildCategoryTree(categories: Category[]): Category[] {
  const categoryMap = new Map<number, Category & { children: Category[] }>();
  
  // Initialize map
  categories.forEach(cat => {
    categoryMap.set(cat.id, { ...cat, children: [] });
  });

  const roots: (Category & { children: Category[] })[] = [];

  // Build relationships
  categories.forEach(cat => {
    const mappedCat = categoryMap.get(cat.id)!;
    if (cat.parent_id && categoryMap.has(cat.parent_id)) {
      categoryMap.get(cat.parent_id)!.children.push(mappedCat);
    } else {
      roots.push(mappedCat);
    }
  });

  return roots;
}

function flattenCategoryTree(categories: (Category & { children?: Category[] })[], depth = 0): Category[] {
  let flat: Category[] = [];
  categories.forEach(cat => {
    const { children, ...rest } = cat;
    // Ensure depth is set based on tree structure, prioritizing the calculated depth
    flat.push({ ...rest, depth });
    if (children && children.length > 0) {
      flat = flat.concat(flattenCategoryTree(children, depth + 1));
    }
  });
  return flat;
}

export default function CategoriesPage() {
  const { isAuthorized } = usePermissionGuard('manage categories');
  
  const [categories, setCategories] = useState<Category[]>(mockCategories);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modal, setModal] = useState<{ open: boolean; mode: 'create' | 'edit'; category: Category | null }>({
    open: false,
    mode: 'create',
    category: null,
  });
  const [formData, setFormData] = useState<{
    name: string;
    parent_id: number | '';
    is_active: boolean;
    icon: string;
    icon_image: File | null;
    image: File | null;
  }>({
    name: '',
    parent_id: '',
    is_active: true,
    icon: '',
    icon_image: null,
    image: null,
  });
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 24,
    total: 0,
    from: 0,
    to: 0,
  });
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<'1' | '2' | '3' | '4'>(COUNTRIES[0].id as '1' | '2' | '3' | '4');
  const parentDepth = (() => {
    const pid = formData.parent_id;
    if (!pid) return 0;
    const parent = allCategories.find((c) => c.id === Number(pid));
    return parent ? (parent.depth ?? 0) + 1 : 0;
  })();

  // Compute Tree Data
  const treeData = useMemo(() => {
    if (searchQuery || statusFilter) return categories; // Use server results if searching/filtering
    
    // Otherwise build tree from allCategories
    const tree = buildCategoryTree(allCategories);
    return flattenCategoryTree(tree);
  }, [allCategories, categories, searchQuery, statusFilter]);

  const columns = [
    {
      key: 'name',
      title: 'الاسم',
      sortable: true,
      render: (value: string, item: Category) => {
        const imageUrl = getStorageUrl(item.icon_image_url);
        const depth = item.depth || 0;
        
        return (
          <div className="flex items-center gap-3" style={{ paddingRight: `${depth * 24}px` }}>
            {depth > 0 && (
              <CornerDownLeft className="w-4 h-4 text-muted-foreground/50 ml-1" />
            )}
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt={value}
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                />
              ) : (() => {
                 const IconComponent = item.icon ? (LucideIcons as any)[item.icon] : null;
                 return IconComponent ? (
                   <IconComponent className="w-5 h-5 text-primary" />
                 ) : (
                   <FolderTree className="w-5 h-5 text-primary" />
                 );
              })()}
            </div>
            <div>
              <p className="font-medium">{value}</p>
              <p className="text-xs text-muted-foreground">{item.slug}</p>
            </div>
          </div>
        );
      },
    },
    {
      key: 'slug',
      title: 'المعرف',
      render: (value: string) => <span className="text-muted-foreground">{value || '-'}</span>,
    },
    {
      key: 'news_count',
      title: 'المقالات',
      sortable: true,
      render: (value: number) => (
        <Badge variant="info">{value} مقال</Badge>
      ),
    },
    {
      key: 'is_active',
      title: 'الحالة',
      render: (value: boolean, item: Category) => (
        <button
          onClick={() => toggleStatus(item.id)}
          className="flex items-center gap-2"
        >
          {value ? (
            <>
              <ToggleRight className="w-6 h-6 text-success" />
              <span className="text-success text-sm">مفعل</span>
            </>
          ) : (
            <>
              <ToggleLeft className="w-6 h-6 text-muted-foreground" />
              <span className="text-muted-foreground text-sm">معطل</span>
            </>
          )}
        </button>
      ),
    },
    {
      key: 'actions',
      title: 'الإجراءات',
      render: (_: any, item: Category) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => openEditModal(item)}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
          >
            <Edit className="w-4 h-4 text-muted-foreground" />
          </button>
          <button
            onClick={() => openDeleteModal(item.id)}
            className="p-1.5 rounded-lg hover:bg-error/10 transition-colors"
          >
            <Trash2 className="w-4 h-4 text-error" />
          </button>
        </div>
      ),
    },
  ];

  const fetchAll = async () => {
    try {
      const res: unknown = await categoriesService.getAll({
        country: selectedCountry,
        per_page: 1000,
      });
      const { list } = unwrapList(res);
      setAllCategories(list || []);
    } catch (e) {
      console.error('Failed to fetch all categories', e);
    }
  };

  const toggleStatus = async (id: number) => {
    try {
      setLoading(true);
      const updated = await categoriesService.toggle(id, selectedCountry);
      setCategories((prev) => prev.map((c) => (c.id === id ? updated : c)));
      setAllCategories((prev) => prev.map((c) => (c.id === id ? updated : c)));
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (category: Category) => {
    setFormData({
      name: category.name,
      parent_id: category.parent_id ?? '',
      is_active: !!category.is_active,
      icon: category.icon || '',
      icon_image: null,
      image: null,
    });
    setModal({ open: true, mode: 'edit', category });
  };

  const openCreateModal = () => {
    setFormData({
      name: '',
      parent_id: '',
      is_active: true,
      icon: '',
      icon_image: null,
      image: null,
    });
    setModal({ open: true, mode: 'create', category: null });
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      if (modal.mode === 'create') {
        await categoriesService.create({
          country: selectedCountry,
          name: formData.name,
          is_active: formData.is_active,
          parent_id: formData.parent_id ? Number(formData.parent_id) : undefined,
          icon: formData.icon || undefined,
          icon_image: formData.icon_image || undefined,
          image: formData.image || undefined,
        });
      } else if (modal.category) {
        await categoriesService.update(modal.category.id, {
          country: selectedCountry,
          name: formData.name,
          is_active: formData.is_active,
          parent_id: formData.parent_id ? Number(formData.parent_id) : undefined,
          icon: formData.icon || undefined,
          icon_image: formData.icon_image || undefined,
          image: formData.image || undefined,
        });
      }
      await Promise.all([fetchCategories(1), fetchAll()]);
      setModal({ open: false, mode: 'create', category: null });
    } finally {
      setLoading(false);
    }
  };

  const openDeleteModal = (id: number) => {
    setPendingDeleteId(id);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!pendingDeleteId) {
      setDeleteModalOpen(false);
      return;
    }
    try {
      setLoading(true);
      await categoriesService.delete(pendingDeleteId, selectedCountry);
      setCategories((prev) => prev.filter((c) => c.id !== pendingDeleteId));
      setAllCategories((prev) => prev.filter((c) => c.id !== pendingDeleteId));
      await fetchCategories(pagination.current_page);
    } finally {
      setLoading(false);
      setDeleteModalOpen(false);
      setPendingDeleteId(null);
    }
  };

  const unwrapList = (res: unknown): { list: Category[]; meta?: any } => {
    const getProp = (o: unknown, k: string): unknown =>
      o && typeof o === 'object' && k in (o as Record<string, unknown>) ? (o as any)[k] : undefined;
    const data = getProp(res, 'data');
    const nested = getProp(data, 'data');
    const list: Category[] = Array.isArray(nested)
      ? (nested as Category[])
      : Array.isArray(data)
      ? (data as Category[])
      : Array.isArray(res)
      ? (res as Category[])
      : [];
    const metaUnknown = getProp(data, 'pagination') ?? getProp(res, 'pagination');
    const meta = metaUnknown && typeof metaUnknown === 'object' ? metaUnknown : undefined;
    return { list, meta };
  };

  const fetchCategories = async (page = 1) => {
    try {
      setLoading(true);
      const res: unknown = await categoriesService.getAll({
        country: selectedCountry,
        page,
        per_page: pagination.per_page,
        search: searchQuery || undefined,
        is_active: statusFilter === '' ? undefined : statusFilter === 'true',
      });
      const { list, meta } = unwrapList(res);
      setCategories(list || []);
      const total = (meta?.total as number) ?? list.length ?? 0;
      const perPage = (meta?.per_page as number) ?? pagination.per_page;
      const current = (meta?.current_page as number) ?? page;
      const last = (meta?.last_page as number) ?? 1;
      const from = (meta?.from as number) ?? (list.length ? 1 : 0);
      const to = (meta?.to as number) ?? list.length;
      setPagination({
        current_page: current,
        last_page: last,
        per_page: perPage,
        total,
        from,
        to,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthorized) return;
    fetchCategories(1);
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthorized]);

  useEffect(() => {
    if (!isAuthorized) return;
    fetchCategories(1);
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCountry, isAuthorized]);

  useEffect(() => {
    if (!isAuthorized) return;
    const id = setTimeout(() => {
      fetchCategories(1);
    }, 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, isAuthorized]);

  useEffect(() => {
    if (!isAuthorized) return;
    fetchCategories(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, isAuthorized]);

  // Permission check after all hooks
  if (isAuthorized === false) {
    return <AccessDenied />;
  }

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">إدارة الفئات</h1>
          <p className="text-muted-foreground">إدارة فئات المقالات والمحتوى</p>
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
            إضافة فئة
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-muted-foreground">إجمالي الفئات</p>
            <p className="text-2xl font-bold text-primary">{pagination.total || categories.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-muted-foreground">الفئات المفعلة</p>
            <p className="text-2xl font-bold text-success">
              {categories.filter((c) => c.is_active).length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-muted-foreground">الفئات المعطلة</p>
            <p className="text-2xl font-bold text-warning">
              {categories.filter((c) => !c.is_active).length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-muted-foreground">إجمالي المقالات</p>
            <p className="text-2xl font-bold text-accent">
              {categories.reduce((sum, c) => sum + (c.news_count || 0), 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-muted-foreground">فئات رئيسية</p>
            <p className="text-2xl font-bold text-info">
              {categories.filter((c) => !c.parent_id).length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle>قائمة الفئات</CardTitle>
          <div className="flex items-center gap-3">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: '', label: 'كل الحالات' },
                { value: 'true', label: 'نشط' },
                { value: 'false', label: 'معطل' },
              ]}
              className="w-40"
            />
            <div className="relative">
              <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                id="categories-search"
                name="search"
                aria-label="بحث في الفئات"
                type="text"
                placeholder="بحث..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-muted border-none rounded-lg pr-9 pl-4 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            data={treeData}
            columns={columns}
            loading={loading}
            pagination={(!searchQuery && !statusFilter) ? undefined : {
              current_page: pagination.current_page,
              last_page: pagination.last_page,
              per_page: pagination.per_page,
              total: pagination.total,
              from: pagination.from,
              to: pagination.to,
            }}
            onPageChange={(page) => fetchCategories(page)}
          />
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={modal.open}
        onClose={() => setModal({ open: false, mode: 'create', category: null })}
        title={modal.mode === 'create' ? 'إضافة فئة جديدة' : 'تعديل الفئة'}
        size="lg"
      >
        <div className="space-y-4 mt-4">
          <Input
            id="category-name"
            name="name"
            label="اسم الفئة"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="أدخل اسم الفئة"
          />
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="category-parent" className="mb-1.5 block text-sm font-medium">الفئة الأب</label>
              <select
                id="category-parent"
                name="parent_id"
                value={formData.parent_id}
                onChange={(e) =>
                  setFormData({ ...formData, parent_id: e.target.value ? Number(e.target.value) : '' })
                }
                className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">— لا شيء —</option>
                {allCategories
                  .filter((c) => c.id !== modal.category?.id)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label htmlFor="category-depth" className="mb-1.5 block text-sm font-medium">العمق</label>
              <input
                id="category-depth"
                name="depth"
                value={parentDepth}
                disabled
                className="w-full rounded-lg border border-border bg-muted px-4 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">الحالة</label>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="sr-only peer"
                  id="category-active"
                />
                <label htmlFor="category-active" className="relative inline-flex items-center cursor-pointer">
                  <div className="w-11 h-6 bg-muted rounded-full transition-colors peer-checked:bg-primary relative">
                    <span className="absolute top-[2px] right-[2px] h-5 w-5 rounded-full bg-white border border-border transition-all peer-checked:right-[22px]"></span>
                  </div>
                </label>
                <span className={`text-sm ${formData.is_active ? 'text-success' : 'text-muted-foreground'}`}>
                  {formData.is_active ? 'نشط' : 'معطل'}
                </span>
              </div>
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">أيقونة الفئة</label>
            <IconPicker
              value={formData.icon}
              onChange={(val) => setFormData({ ...formData, icon: val })}
            />
            <p className="text-xs text-muted-foreground mt-1">اختر أيقونة من المكتبة لتظهر في الواجهة الرئيسية</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="category-icon-image" className="mb-1.5 block text-sm font-medium">أيقونة الفئة (صورة صغيرة)</label>
              <input
                id="category-icon-image"
                name="icon_image"
                type="file"
                accept="image/*"
                onChange={(e) => setFormData({ ...formData, icon_image: e.target.files?.[0] || null })}
                className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1">تُعرض كأفاتار صغير في القوائم</p>
              {modal.mode === 'edit' && modal.category?.icon_image_url && (
                <div className="mt-2">
                  <Image
                    src={getStorageUrl(modal.category.icon_image_url) || ''}
                    alt="Category icon preview"
                    width={40}
                    height={40}
                    className="h-10 w-10 object-contain rounded border"
                  />
                </div>
              )}
            </div>
            <div>
              <label htmlFor="category-image" className="mb-1.5 block text-sm font-medium">الصورة الرئيسية</label>
              <input
                id="category-image"
                name="image"
                type="file"
                accept="image/*"
                onChange={(e) => setFormData({ ...formData, image: e.target.files?.[0] || null })}
                className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1">تُستخدم في الهيدر/الهيرو لهذه الفئة</p>
              {modal.mode === 'edit' && (modal.category?.image_url || modal.category?.image) && (
                <div className="mt-2">
                  <Image
                    src={getStorageUrl(modal.category.image_url || modal.category.image) || ''}
                    alt="Current Image"
                    width={120}
                    height={80}
                    className="h-20 w-auto object-contain rounded border"
                  />
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setModal({ open: false, mode: 'create', category: null })}
            >
              إلغاء
            </Button>
            <Button onClick={handleSubmit}>
              {modal.mode === 'create' ? 'إضافة' : 'حفظ التغييرات'}
            </Button>
          </div>
        </div>
      </Modal>
      
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="تأكيد الحذف"
      >
        <div className="mt-2">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-destructive/10">
              <XCircle className="w-8 h-8 text-destructive" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">تأكيد الحذف</h3>
            <p className="text-muted-foreground">
              سيتم حذف هذه الفئة نهائياً
            </p>
          </div>
          <div className="flex items-center justify-end gap-3 pt-6">
            <Button
              variant="success"
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
              onClick={() => setDeleteModalOpen(false)}
              disabled={loading}
            >
              إلغاء
            </Button>
            <Button
              variant="danger"
              leftIcon={<Trash2 className="w-4 h-4" />}
              onClick={confirmDelete}
              isLoading={loading}
            >
              حذف
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
