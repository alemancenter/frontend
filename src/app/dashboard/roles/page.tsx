'use client';

import { useEffect, useState } from 'react';
import { Plus, Search, Edit, Trash2, Shield, Users, Check } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import DataTable from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import type { Role, Permission } from '@/types';
import { rolesService } from '@/lib/api/services';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import AccessDenied from '@/components/common/AccessDenied';

export default function RolesPage() {
  const { isAuthorized } = usePermissionGuard('manage roles');
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [modal, setModal] = useState<{ open: boolean; mode: 'create' | 'edit'; role: Role | null }>({
    open: false,
    mode: 'create',
    role: null,
  });
  const [formData, setFormData] = useState({
    name: '',
    permissions: [] as number[],
  });

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        setError(null);
        const [rolesResp, permsResp] = await Promise.all([
          rolesService.getAll(),
          rolesService.getPermissions(),
        ]);
        setRoles(Array.isArray(rolesResp as any) ? (rolesResp as Role[]) : ((rolesResp as any).data ?? []));
        setPermissions(Array.isArray(permsResp as any) ? (permsResp as Permission[]) : ((permsResp as any).data ?? (permsResp as any).permissions ?? []));
      } catch (e: any) {
        setError(e?.message || 'فشل في تحميل الأدوار والصلاحيات');
        setRoles([]);
        setPermissions([]);
      } finally {
        setLoading(false);
      }
    };
    if (isAuthorized) {
      fetchAll();
    }
  }, [isAuthorized]);

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
      key: 'name',
      title: 'الدور',
      sortable: true,
      render: (value: string) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-medium">{value}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'permissions',
      title: 'الصلاحيات',
      render: (value: Permission[] | undefined) => (
        <Badge variant="info">{(value && value.length) || '-'}</Badge>
      ),
    },
    {
      key: 'users_count',
      title: 'المستخدمون',
      sortable: true,
      render: (value: number) => (
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-muted-foreground" />
          <span>{value}</span>
        </div>
      ),
    },
    {
      key: 'actions',
      title: 'الإجراءات',
      render: (_: any, item: Role) => (
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
            disabled={item.name === 'admin'}
          >
            <Trash2 className={`w-4 h-4 ${item.name === 'admin' ? 'text-muted' : 'text-error'}`} />
          </button>
        </div>
      ),
    },
  ];

  const openEditModal = (role: Role) => {
    (async () => {
      try {
        setActionLoading(true);
        const fresh = await rolesService.getById(role.id);
        const detailed = (fresh as any).data ?? fresh;
        setFormData({
          name: detailed.name,
          permissions: (detailed.permissions || []).map((p: Permission) => p.id),
        });
        setModal({ open: true, mode: 'edit', role: detailed });
      } catch (e: any) {
        setError(e?.message || 'فشل في جلب بيانات الدور');
      } finally {
        setActionLoading(false);
      }
    })();
  };

  const openCreateModal = () => {
    setFormData({ name: '', permissions: [] });
    setModal({ open: true, mode: 'create', role: null });
  };

  const togglePermission = (permissionId: number) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter(id => id !== permissionId)
        : [...prev.permissions, permissionId],
    }));
  };

  const handleSubmit = async () => {
    try {
      setActionLoading(true);
      setError(null);
      if (modal.mode === 'create') {
        const created = await rolesService.create({
          name: formData.name,
          permissions: formData.permissions,
        });
        const role = (created as any).data ?? created;
        setRoles(prev => [...prev, role as Role]);
      } else if (modal.role) {
        const updated = await rolesService.update(modal.role.id, {
          name: formData.name,
          permissions: formData.permissions,
        });
        const role = (updated as any).data ?? updated;
        setRoles(prev => prev.map(r => (r.id === role.id ? { ...r, ...role } as Role : r)));
      }
      setModal({ open: false, mode: 'create', role: null });
    } catch (e: any) {
      setError(e?.message || 'فشل حفظ الدور');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    const ok = typeof window !== 'undefined' ? window.confirm('هل أنت متأكد من حذف هذا الدور؟') : true;
    if (!ok) return;
    try {
      setActionLoading(true);
      await rolesService.delete(id);
      setRoles(prev => prev.filter(r => r.id !== id));
    } catch (e: any) {
      setError(e?.message || 'فشل حذف الدور');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">إدارة الأدوار</h1>
          <p className="text-muted-foreground">إدارة أدوار وصلاحيات المستخدمين</p>
        </div>
        <Button leftIcon={<Plus className="w-4 h-4" />} onClick={openCreateModal}>
          إضافة دور
        </Button>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-muted-foreground">إجمالي الأدوار</p>
            <p className="text-2xl font-bold text-primary">{roles.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-muted-foreground">إجمالي الصلاحيات</p>
            <p className="text-2xl font-bold text-accent">{permissions.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-muted-foreground">المستخدمون المعينون</p>
            <p className="text-2xl font-bold text-success">
              {roles.reduce((sum, r) => sum + (r.users_count || 0), 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle>قائمة الأدوار</CardTitle>
          <div className="relative">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="بحث..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              id="roles-search"
              name="search"
              className="bg-muted border-none rounded-lg pr-9 pl-4 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </CardHeader>
        <CardContent>
          {error ? <p className="text-sm text-error mb-2">{error}</p> : null}
          <DataTable
            data={roles.filter(r =>
              r.name.toLowerCase().includes(searchQuery.toLowerCase())
            )}
            columns={columns}
            loading={loading}
          />
        </CardContent>
      </Card>

      {/* Modal */}
      <Modal
        isOpen={modal.open}
        onClose={() => setModal({ open: false, mode: 'create', role: null })}
        title={modal.mode === 'create' ? 'إضافة دور جديد' : 'تعديل الدور'}
        size="lg"
      >
        <div className="space-y-4 mt-4">
          <Input
            label="اسم الدور (بالإنجليزية)"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="مثال: editor"
          />

          <div>
            <label className="mb-3 block text-sm font-medium">الصلاحيات</label>
            <div className="grid sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
              {Array.isArray(permissions) && permissions.map(permission => (
                <label
                  key={permission.id}
                  className="flex items-center gap-2 p-2 rounded-lg border border-border hover:bg-muted/50 cursor-pointer transition-colors"
                >
                  <div
                    className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                      formData.permissions.includes(permission.id)
                        ? 'bg-primary border-primary'
                        : 'border-border'
                    }`}
                    onClick={() => togglePermission(permission.id)}
                  >
                    {formData.permissions.includes(permission.id) && (
                      <Check className="w-3 h-3 text-white" />
                    )}
                  </div>
                  <span className="text-sm">{permission.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setModal({ open: false, mode: 'create', role: null })}
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
