'use client';

import { useEffect, useState } from 'react';
import { Plus, Search, Edit, Trash2, Key, Shield } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import DataTable from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import type { Permission } from '@/types';
import { rolesService } from '@/lib/api/services';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import AccessDenied from '@/components/common/AccessDenied';

type UIPermission = Permission & { display_name?: string; group?: string };

const groupColors: Record<string, 'info' | 'success' | 'warning' | 'error'> = {
  'المستخدمون': 'info',
  'المقالات': 'success',
  'الفئات': 'warning',
  'الإعدادات': 'error',
  'الصلاحيات': 'info',
};

export default function PermissionsPage() {
  const { isAuthorized } = usePermissionGuard('manage roles');
  
  const [permissions, setPermissions] = useState<UIPermission[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGroup, setFilterGroup] = useState('');
  const [modal, setModal] = useState<{ open: boolean; mode: 'create' | 'edit'; permission: Permission | null }>({
    open: false,
    mode: 'create',
    permission: null,
  });
  const [formData, setFormData] = useState({
    name: '',
    guard_name: 'sanctum',
  });
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toGroupLabel = (key: string) => {
    switch (key) {
      case 'users': return 'المستخدمون';
      case 'articles': return 'المقالات';
      case 'categories': return 'الفئات';
      case 'settings': return 'الإعدادات';
      case 'roles': return 'الصلاحيات';
      default: return 'أخرى';
    }
  };

  const toActionLabel = (key: string) => {
    switch (key) {
      case 'view': return 'عرض';
      case 'create': return 'إضافة';
      case 'edit': return 'تعديل';
      case 'delete': return 'حذف';
      case 'publish': return 'نشر';
      default: return key || '';
    }
  };

  const makeDisplayName = (name: string) => {
    const [g, a] = (name || '').split('.');
    const gl = toGroupLabel(g || '');
    const al = toActionLabel(a || '');
    return gl && al ? `${al} ${gl}` : name;
  };

  const transformPermissions = (list: Permission[]): UIPermission[] => {
    return (Array.isArray(list) ? list : []).map((p) => {
      const [g] = (p.name || '').split('.');
      const gl = toGroupLabel(g || '');
      return {
        ...p,
        group: gl,
        display_name: makeDisplayName(p.name),
      };
    });
  };

  const loadPermissions = async () => {
    try {
      setLoading(true);
      setError(null);
      const list = await rolesService.getPermissions();
      setPermissions(transformPermissions(list));
    } catch (e: any) {
      setError(e?.message || 'فشل في تحميل الصلاحيات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPermissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      key: 'display_name',
      title: 'الصلاحية',
      sortable: true,
      render: (value: string, item: UIPermission) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
            <Key className="w-5 h-5 text-accent" />
          </div>
          <div>
            <p className="font-medium">{value}</p>
            <p className="text-xs text-muted-foreground font-mono">{item.name}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'group',
      title: 'المجموعة',
      sortable: true,
      render: (value: string) => (
        <Badge variant={groupColors[value] || 'info'}>{value}</Badge>
      ),
    },
    {
      key: 'actions',
      title: 'الإجراءات',
      render: (_: any, item: UIPermission) => (
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

  const openEditModal = (permission: UIPermission) => {
    setFormData({
      name: permission.name,
      guard_name: (permission.guard_name as string) || 'web',
    });
    setModal({ open: true, mode: 'edit', permission });
  };

  const openCreateModal = () => {
    setFormData({ name: '', guard_name: 'sanctum' });
    setModal({ open: true, mode: 'create', permission: null });
  };

  const handleSubmit = async () => {
    try {
      setActionLoading(true);
      setError(null);
      const payload = { name: formData.name, guard_name: formData.guard_name };
      if (modal.mode === 'create') {
        await rolesService.createPermission(payload);
      } else if (modal.permission) {
        await rolesService.updatePermission(modal.permission.id, payload);
      }
      setModal({ open: false, mode: 'create', permission: null });
      await loadPermissions();
    } catch (e: any) {
      setError(e?.message || 'فشل تنفيذ العملية');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    const ok = confirm('هل أنت متأكد من حذف هذه الصلاحية؟');
    if (!ok) return;
    try {
      setActionLoading(true);
      setError(null);
      await rolesService.deletePermission(id);
      await loadPermissions();
    } catch (e: any) {
      setError(e?.message || 'فشل حذف الصلاحية');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredPermissions = permissions.filter(p => {
    const matchesSearch =
      (p.display_name || p.name).toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGroup = !filterGroup || p.group === filterGroup;
    return matchesSearch && matchesGroup;
  });

  const permissionsByGroup = permissions.reduce((acc, p) => {
    const group = p.group || 'أخرى';
    acc[group] = (acc[group] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">إدارة الصلاحيات</h1>
          <p className="text-muted-foreground">إدارة صلاحيات النظام</p>
        </div>
        <Button leftIcon={<Plus className="w-4 h-4" />} onClick={openCreateModal}>
          إضافة صلاحية
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-destructive text-sm">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-muted-foreground">إجمالي الصلاحيات</p>
            <p className="text-2xl font-bold text-primary">{permissions.length}</p>
          </CardContent>
        </Card>
        {Object.entries(permissionsByGroup).slice(0, 3).map(([group, count]) => (
          <Card key={group}>
            <CardContent className="py-4">
              <p className="text-sm text-muted-foreground">{group}</p>
              <p className="text-2xl font-bold" style={{ color: `var(--${groupColors[group] || 'primary'})` }}>
                {count}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Permissions by Group */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(permissionsByGroup).map(([group, count]) => (
          <Card
            key={group}
            className="cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => setFilterGroup(filterGroup === group ? '' : group)}
          >
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{group}</p>
                    <p className="text-sm text-muted-foreground">{count} صلاحية</p>
                  </div>
                </div>
                {filterGroup === group && (
                  <Badge variant="success">محدد</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle>قائمة الصلاحيات</CardTitle>
          <div className="flex items-center gap-3">
            {filterGroup && (
              <Button variant="outline" size="sm" onClick={() => setFilterGroup('')}>
                إلغاء الفلتر
              </Button>
            )}
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
            data={filteredPermissions}
            columns={columns}
            loading={loading || actionLoading}
          />
        </CardContent>
      </Card>

      {/* Modal */}
      <Modal
        isOpen={modal.open}
        onClose={() => setModal({ open: false, mode: 'create', permission: null })}
        title={modal.mode === 'create' ? 'إضافة صلاحية جديدة' : 'تعديل الصلاحية'}
      >
        <div className="space-y-4 mt-4">
          <Input
            label="اسم الصلاحية (بالإنجليزية)"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="مثال: manage articles"
          />
          <Select
            label="الحارس (guard)"
            value={formData.guard_name}
            onChange={(e) => setFormData({ ...formData, guard_name: e.target.value })}
            options={[
              { value: 'web', label: 'web' },
              { value: 'api', label: 'api' },
              { value: 'sanctum', label: 'sanctum' },
            ]}
            placeholder="اختر الحارس"
          />
          <div className="flex items-center justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setModal({ open: false, mode: 'create', permission: null })}
            >
              إلغاء
            </Button>
            <Button onClick={handleSubmit} isLoading={actionLoading}>
              {modal.mode === 'create' ? 'إضافة' : 'حفظ'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
