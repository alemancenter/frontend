'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Search, Edit, Trash2, FileText, Eye, Calendar, User, ToggleRight, ToggleLeft } from 'lucide-react';
import Link from 'next/link';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import DataTable from '@/components/ui/DataTable';
import Select from '@/components/ui/Select';
import { ConfirmModal } from '@/components/ui/Modal';
import type { Post } from '@/types';
import { postsService, COUNTRIES } from '@/lib/api/services';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import AccessDenied from '@/components/common/AccessDenied';
import { toast } from 'react-hot-toast';

const mockPosts: Post[] = [];

const statusOptions = [
  { value: '', label: 'كل الحالات' },
  { value: 'true', label: 'نشط' },
  { value: 'false', label: 'معطل' },
];

export default function PostsPage() {
  const { isAuthorized } = usePermissionGuard('manage posts');
  const [posts, setPosts] = useState<Post[]>(mockPosts);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<'1' | '2' | '3' | '4'>(COUNTRIES[0].id as '1' | '2' | '3' | '4');
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
  });

  const handleToggleStatus = async (post: Post) => {
    try {
      // Optimistic update
      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, is_active: !p.is_active } : p));
      
      const newStatus = await postsService.toggleStatus(post.id, selectedCountry);
      
      // Update with actual status from server
      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, is_active: newStatus } : p));
    } catch (err) {
      console.error(err);
      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, is_active: !p.is_active } : p));
      alert('Failed to update status');
    }
  };

  const columns: any[] = [
    {
      key: 'title',
      title: 'العنوان',
      sortable: true,
      render: (value: string, item: Post) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-medium">{value}</p>
            <p className="text-xs text-muted-foreground">{item.slug}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'author.name',
      title: 'الكاتب',
      render: (value: string, item: Post) => (
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm">{item.author?.name || (item.author_id ? `مستخدم #${item.author_id}` : '-')}</span>
        </div>
      ),
    },
    {
      key: 'is_active',
      title: 'الحالة',
      sortable: true,
      render: (_: any, item: Post) => (
        <button
          onClick={() => handleToggleStatus(item)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-300 border ${
            item.is_active
              ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100'
              : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
          }`}
          title={item.is_active ? 'تعطيل' : 'تفعيل'}
        >
          {item.is_active ? (
            <>
              <ToggleRight className="w-5 h-5" />
              <span className="text-sm font-medium">نشط</span>
            </>
          ) : (
            <>
              <ToggleLeft className="w-5 h-5" />
              <span className="text-sm font-medium">معطل</span>
            </>
          )}
        </button>
      ),
    },
    {
      key: 'views_count',
      title: 'المشاهدات',
      sortable: true,
      render: (value: number) => (
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-muted-foreground" />
          <span>{value?.toLocaleString() || 0}</span>
        </div>
      ),
    },
    {
      key: 'created_at',
      title: 'التاريخ',
      sortable: true,
      render: (value: string) => (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="w-4 h-4" />
          <span>{value}</span>
        </div>
      ),
    },
    {
      key: 'actions',
      title: 'الإجراءات',
      render: (_: any, item: Post) => (
        <div className="flex items-center gap-1">
          <Link
            href={`/dashboard/posts/edit/${item.id}?country=${selectedCountry}`}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
            title="تعديل"
          >
            <Edit className="w-4 h-4 text-muted-foreground" />
          </Link>
          <button
            onClick={() => handleDeleteClick(item.id)}
            disabled={deleteLoading && confirmDeleteId === item.id}
            className="p-1.5 rounded-lg hover:bg-error/10 transition-colors"
            title="حذف"
          >
            <Trash2 className="w-4 h-4 text-error" />
          </button>
        </div>
      ),
    },
  ];

  const handleDeleteClick = (id: number) => {
    setConfirmDeleteId(id);
  };

  const filteredPosts = posts.filter(p => {
    const matchesStatus =
      !statusFilter ||
      (statusFilter === 'true' && p.is_active) ||
      (statusFilter === 'false' && !p.is_active);
    const matchesSearch =
      !searchQuery ||
      p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.slug?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const stats = {
    total: pagination.total,
    published: posts.filter(p => p.is_active).length, // Note: This is only for current page
    draft: posts.filter(p => !p.is_active).length, // Note: This is only for current page
    pending: 0,
    totalViews: posts.reduce((sum, p) => sum + (p.views_count || 0), 0),
  };

  const fetchPosts = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const res = await postsService.getAll({
        country: selectedCountry,
        page,
        per_page: pagination.per_page,
        search: searchQuery || undefined,
      });
      // Handle ApiResponse<PaginatedResponse<Post>>
      const responseData = (res as any).data;
      const list = responseData?.data || [];
      const meta = responseData?.meta || responseData?.pagination;
      
      setPosts(list);
      setPagination({
        current_page: meta?.current_page ?? page,
        last_page: meta?.last_page ?? 1,
        per_page: meta?.per_page ?? pagination.per_page,
        total: meta?.total ?? list.length,
      });
    } finally {
      setLoading(false);
    }
  }, [selectedCountry, pagination.per_page, searchQuery]);

  const confirmDelete = useCallback(async () => {
    if (!confirmDeleteId || deleteLoading) return;

    const deletedId = confirmDeleteId;

    try {
      setDeleteLoading(true);
      await postsService.delete(deletedId, selectedCountry);

      const shouldGoPrevPage = posts.length === 1 && pagination.current_page > 1;
      const targetPage = shouldGoPrevPage ? pagination.current_page - 1 : pagination.current_page;

      try {
        await fetchPosts(targetPage);
      } catch {
        setPosts((prev) => prev.filter((post) => post.id !== deletedId));
        setPagination((prev) => ({
          ...prev,
          total: Math.max(0, prev.total - 1),
        }));
      }

      toast.success('تم حذف المنشور بنجاح');
      setConfirmDeleteId(null);
    } catch (error: any) {
      const errors = error?.errors && typeof error.errors === 'object' ? error.errors : null;
      const firstErrorValue = errors ? Object.values(errors)[0] : null;
      const firstErrorText =
        Array.isArray(firstErrorValue)
          ? (typeof firstErrorValue[0] === 'string' ? firstErrorValue[0] : null)
          : (typeof firstErrorValue === 'string' ? firstErrorValue : null);

      toast.error(firstErrorText || error?.message || 'فشل حذف المنشور');
    } finally {
      setDeleteLoading(false);
    }
  }, [
    confirmDeleteId,
    deleteLoading,
    selectedCountry,
    posts.length,
    pagination.current_page,
    fetchPosts,
  ]);

  useEffect(() => {
    fetchPosts(1);
  }, [fetchPosts]);

  useEffect(() => {
    fetchPosts(1);
  }, [selectedCountry, fetchPosts]);

  useEffect(() => {
    const id = setTimeout(() => {
      fetchPosts(1);
    }, 300);
    return () => clearTimeout(id as any);
  }, [searchQuery, fetchPosts]);
  



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
          <h1 className="text-2xl font-bold">إدارة المنشورات</h1>
          <p className="text-muted-foreground">إدارة منشورات المدونة</p>
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
          <Link href="/dashboard/posts/create">
            <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 font-medium">
              <Plus className="w-4 h-4" />
              <span>منشور جديد</span>
            </button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-muted-foreground">إجمالي المنشورات</p>
            <p className="text-2xl font-bold text-primary">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-muted-foreground">منشور</p>
            <p className="text-2xl font-bold text-success">{stats.published}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-muted-foreground">مسودة</p>
            <p className="text-2xl font-bold text-warning">{stats.draft}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-muted-foreground">قيد المراجعة</p>
            <p className="text-2xl font-bold text-info">{stats.pending}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-muted-foreground">إجمالي المشاهدات</p>
            <p className="text-2xl font-bold text-accent">{stats.totalViews.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle>قائمة المنشورات</CardTitle>
          <div className="flex items-center gap-3">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={statusOptions}
              className="w-40"
            />
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
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            data={filteredPosts}
            columns={columns}
            loading={loading}
            pagination={{
              current_page: pagination.current_page,
              last_page: pagination.last_page,
              per_page: pagination.per_page,
              total: pagination.total,
            }}
            onPageChange={(page) => fetchPosts(page)}
          />
        </CardContent>
      </Card>

      <ConfirmModal
        isOpen={confirmDeleteId !== null}
        onClose={() => !deleteLoading && setConfirmDeleteId(null)}
        onConfirm={confirmDelete}
        title="تأكيد الحذف"
        message="سيتم حذف المنشور نهائيا ولا يمكن التراجع عن هذا الإجراء."
        confirmText="حذف"
        cancelText="إلغاء"
        variant="danger"
        isLoading={deleteLoading}
      />
    </div>
  );
}

