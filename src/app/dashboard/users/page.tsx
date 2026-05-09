'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import Image from '@/components/common/AppImage';
import {
  Search,
  Eye,
  Edit,
  Trash2,
  Mail,
  Shield,
  Loader2,
  UserPlus,
  Activity,
  LayoutGrid,
  List,
  Facebook,
  Twitter,
  Linkedin,
  Instagram,
  Github,
  Key,
  Ban,
  Globe
} from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import Pagination from '@/components/ui/Pagination';
import { cn, getStorageUrl } from '@/lib/utils';
import type { User, Role, Permission } from '@/types';
import { usersService, messagesService, rolesService, securityService } from '@/lib/api/services';
import { COUNTRIES } from '@/lib/api/config';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import AccessDenied from '@/components/common/AccessDenied';

// Helper for avatars
const getAvatarUrl = (user: User) => {
  const photo = getStorageUrl(user.profile_photo_url || user.profile_photo_path);
  if (photo) return photo;
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.name || String(user.id))}`;
};

const isSafeUrl = (url: unknown): url is string =>
  typeof url === 'string' && /^https?:\/\//i.test(url);

const roleColors: Record<string, "primary" | "secondary" | "accent" | "success" | "warning" | "error" | "info" | "default"> = {
  admin: 'primary',
  manager: 'accent',
  supervisor: 'info',
  editor: 'secondary',
  member: 'default',
  user: 'default',
};

const statusColors: Record<string, "success" | "warning" | "error" | "default"> = {
  active: 'success',
  online: 'success',
  pending: 'warning',
  inactive: 'default',
  banned: 'error',
  offline: 'default',
};

const statusLabels: Record<string, string> = {
  active: 'نشط',
  online: 'متصل',
  pending: 'قيد الانتظار',
  inactive: 'غير نشط',
  banned: 'محظور',
  offline: 'غير متصل',
};

export default function UsersPage() {
  const { isAuthorized } = usePermissionGuard('users.view');
  const { isAuthorized: canManageRoles } = usePermissionGuard('manage roles');
  // Data State
  const [users, setUsers] = useState<User[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [availablePermissions, setAvailablePermissions] = useState<Permission[]>([]);
  
  // Loading States
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Selection State
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');

  // Modals State
  const [createModal, setCreateModal] = useState(false);
  const [viewModal, setViewModal] = useState<{ open: boolean; user: User | null }>({ open: false, user: null });
  const [editModal, setEditModal] = useState<{ open: boolean; user: User | null }>({ open: false, user: null });
  const [messageModal, setMessageModal] = useState<{ open: boolean; user: User | null }>({ open: false, user: null });
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; user: User | null }>({ open: false, user: null });
  const [bulkDeleteModal, setBulkDeleteModal] = useState(false);
  const [blockIpModal, setBlockIpModal] = useState<{ open: boolean; ip: string | null; userId: number | null }>({ open: false, ip: null, userId: null });

  // Forms Data
  const [createData, setCreateData] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    role: '',
    phone: '',
    job_title: '',
    gender: '',
    country: '1',
    bio: '',
    status: 'active',
    social_links: { facebook: '', twitter: '', linkedin: '', instagram: '', github: '' }
  });

  const [editData, setEditData] = useState<{
    name: string;
    email: string;
    phone: string;
    bio: string;
    job_title: string;
    gender: string;
    country: string;
    status: string;
    password?: string;
    password_confirmation?: string;
    profile_photo: File | null;
    social_links: Record<string, string>;
  }>({
    name: '',
    email: '',
    phone: '',
    bio: '',
    job_title: '',
    gender: '',
    country: '',
    status: 'active',
    profile_photo: null,
    social_links: { facebook: '', twitter: '', linkedin: '', instagram: '', github: '' }
  });

  const [editTab, setEditTab] = useState<'profile' | 'permissions' | 'social'>('profile');
  const [selectedRoles, setSelectedRoles] = useState<number[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);

  const [messageData, setMessageData] = useState({ subject: '', body: '' });
  const [actionError, setActionError] = useState<string | null>(null);
  const [bulkAction, setBulkAction] = useState('');

  // Fetch static data (roles & permissions) once on mount
  useEffect(() => {
    if (!isAuthorized) return;
    rolesService.getAll().then(setAvailableRoles).catch(() => {});
    rolesService.getPermissions().then(setAvailablePermissions).catch(() => {});
  }, [isAuthorized]);

  // Fetch users — separated from roles fetch for speed
  const fetchUsers = useCallback(async (page = 1, search = searchQuery, role = roleFilter, status = statusFilter) => {
    try {
      setLoading(true);
      const params: any = { page };
      if (search.trim()) params.search = search.trim();
      if (role) params.role = role;
      if (status) params.status = status;

      const usersResponse = await usersService.getAll(params);

      const responseData = (usersResponse as any);
      const list = Array.isArray(responseData.data) ? responseData.data : (Array.isArray(responseData) ? responseData : []);
      const meta = responseData.meta ?? responseData;

      setUsers(list as User[]);
      setCurrentPage(meta.current_page || 1);
      setLastPage(meta.last_page || 1);
      setTotalCount(meta.total || list.length);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, roleFilter, statusFilter]);

  // Initial load
  useEffect(() => {
    if (!isAuthorized) return;
    fetchUsers(1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthorized]);

  // Search: debounced 300ms
  useEffect(() => {
    if (!isAuthorized) return;
    const timeout = setTimeout(() => fetchUsers(1), 300);
    return () => clearTimeout(timeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  // Dropdowns: immediate
  useEffect(() => {
    if (!isAuthorized) return;
    fetchUsers(1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleFilter, statusFilter]);

  const handlePageChange = (page: number) => {
    fetchUsers(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Derived Stats — totalUsers comes from API meta.total (all pages), others from current page
  const totalUsers = totalCount;
  const verifiedUsers = users.filter((u) => !!u.email_verified_at).length;
  // Use is_online if available, otherwise check last_activity (within 5 mins)
  const isUserOnline = (user: User) => {
    if (user.is_online !== undefined) return user.is_online;
    if (!user.last_activity) return false;
    const lastActivity = new Date(user.last_activity);
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return lastActivity > fiveMinutesAgo;
  };
  const onlineUsers = users.filter(isUserOnline).length;

  // Helpers
  const getStatus = (user: User) => {
    // Check online status first (unless banned)
    if (isUserOnline(user) && user.status !== 'banned') return 'online';
    if (user.status) return user.status;
    return user.email_verified_at ? 'active' : 'pending';
  };

  // Handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(users.map(u => u.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(x => x !== id));
    }
  };

  const handleCreate = async () => {
    try {
      setActionLoading(true);
      setActionError(null);
      
      if (createData.password !== createData.password_confirmation) {
        setActionError('كلمة المرور غير متطابقة');
        return;
      }

      await usersService.create(createData);
      setCreateModal(false);
      setCreateData({
        name: '', email: '', password: '', password_confirmation: '', role: '',
        phone: '', job_title: '', gender: '', country: '', bio: '', status: 'active',
        social_links: { facebook: '', twitter: '', linkedin: '', instagram: '', github: '' }
      });
      fetchUsers(currentPage); // Refresh list
    } catch (e: any) {
      setActionError(e.message || 'فشل إنشاء المستخدم');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!editModal.user) return;
    try {
      setActionLoading(true);
      setActionError(null);

      // Update Profile Info
      const updatePayload: any = {
        name: editData.name,
        email: editData.email,
        phone: editData.phone,
        bio: editData.bio,
        job_title: editData.job_title,
        gender: editData.gender,
        country: editData.country,
        // status: editData.status, // Disabled manually, let backend handle or ignore
        profile_photo: editData.profile_photo || undefined,
        social_links: editData.social_links
      };

      if (editData.password) {
        if (editData.password !== editData.password_confirmation) {
          setActionError('كلمة المرور غير متطابقة');
          setActionLoading(false);
          return;
        }
        updatePayload.password = editData.password;
        updatePayload.password_confirmation = editData.password_confirmation;
      }

      // Update Profile Data
      await usersService.update(editModal.user.id, updatePayload);

      // Update Roles & Permissions (if authorized)
      if (canManageRoles) {
        await usersService.updateRolesPermissions(editModal.user.id, {
          roles: selectedRoles,
          permissions: selectedPermissions,
        });
      }

      setEditModal({ open: false, user: null });
      fetchUsers(currentPage); // Refresh to get latest data including images
    } catch (e: any) {
      setActionError(e.message || 'فشل تحديث البيانات');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.user) return;
    try {
      setActionLoading(true);
      await usersService.delete(deleteModal.user.id);
      setDeleteModal({ open: false, user: null });
      fetchUsers(currentPage);
    } catch (e: any) {
      setActionError(e.message || 'فشل حذف المستخدم');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    try {
      setActionLoading(true);
      await usersService.bulkDelete(selectedIds);
      setBulkDeleteModal(false);
      setSelectedIds([]);
      setBulkAction('');
      fetchUsers(currentPage);
    } catch (e: any) {
      setActionError(e.message || 'فشل حذف المستخدمين المحددين');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkStatus = async (status: string) => {
    try {
      setActionLoading(true);
      await usersService.bulkUpdateStatus(selectedIds, status);
      setSelectedIds([]);
      setBulkAction('');
      fetchUsers(currentPage);
    } catch (e: any) {
      setActionError(e?.message || 'فشل تحديث حالة المستخدمين');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!messageModal.user) return;
    try {
      setActionLoading(true);
      await messagesService.send({
        recipient_id: messageModal.user.id,
        subject: messageData.subject,
        body: messageData.body,
      });
      setMessageModal({ open: false, user: null });
      setMessageData({ subject: '', body: '' });
    } catch (e: any) {
      setActionError(e.message || 'فشل إرسال الرسالة');
    } finally {
      setActionLoading(false);
    }
  };

  // Open Modals
  const openEdit = (user: User) => {
    let socialLinks = { facebook: '', twitter: '', linkedin: '', instagram: '', github: '' };
    
    if (user.social_links) {
      if (typeof user.social_links === 'string') {
        try {
          const parsed = JSON.parse(user.social_links);
          if (parsed && !Array.isArray(parsed)) {
            socialLinks = { ...socialLinks, ...parsed };
          }
        } catch {}
      } else if (!Array.isArray(user.social_links)) {
        socialLinks = { ...socialLinks, ...user.social_links };
      }
    }

    const countryObj = COUNTRIES.find(c => String(c.id) === String(user.country) || c.code === user.country || c.name === user.country);

    setEditData({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      bio: user.bio || '',
      job_title: user.job_title || '',
      gender: user.gender || '',
      country: countryObj ? countryObj.id : (user.country ? String(user.country) : ''),
      status: user.status || 'active',
      profile_photo: null,
      password: '',
      password_confirmation: '',
      social_links: socialLinks
    });
    setSelectedRoles(user.roles?.map(r => r.id).filter(Boolean) || []);
    setSelectedPermissions(user.permissions?.map(p => p.id).filter(Boolean) || []);
    setEditTab('profile');
    setEditModal({ open: true, user });
    setActionError(null);
  };

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
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">إدارة المستخدمين</h1>
          <p className="text-muted-foreground">نظام إدارة المستخدمين والصلاحيات الشامل</p>
        </div>
        <div className="flex gap-2">
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-5 duration-300">
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                تم تحديد {selectedIds.length}
              </span>
              <select
                name="bulk_action"
                id="bulk-action"
                value={bulkAction}
                className="bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                onChange={(e) => setBulkAction(e.target.value)}
              >
                <option value="">اختر إجراء...</option>
                <option value="active">تفعيل</option>
                <option value="inactive">تعطيل</option>
                <option value="pending">قيد الانتظار</option>
                <option value="banned">حظر</option>
                <option value="delete">حذف</option>
              </select>
              <Button
                size="sm"
                variant={bulkAction === 'delete' || bulkAction === 'banned' ? 'danger' : 'primary'}
                disabled={!bulkAction || actionLoading}
                onClick={() => {
                  if (!bulkAction) return;
                  if (bulkAction === 'delete') {
                    setBulkDeleteModal(true);
                  } else {
                    handleBulkStatus(bulkAction);
                    setBulkAction('');
                  }
                }}
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'تطبيق'}
              </Button>
              <button
                onClick={() => { setSelectedIds([]); setBulkAction(''); }}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                إلغاء
              </button>
            </div>
          )}
          
          <div className="flex items-center border border-border rounded-lg bg-background p-1">
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                "p-2 rounded-md transition-colors",
                viewMode === 'list' ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground"
              )}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                "p-2 rounded-md transition-colors",
                viewMode === 'grid' ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground"
              )}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          <Button onClick={() => setCreateModal(true)} leftIcon={<UserPlus className="w-4 h-4" />}>
            إضافة مستخدم
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center gap-4 py-6">
            <div className="p-3 rounded-full bg-primary/10 text-primary">
              <UserPlus className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">إجمالي المستخدمين</p>
              <p className="text-2xl font-bold">{totalUsers}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 py-6">
            <div className="p-3 rounded-full bg-success/10 text-success">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">حسابات موثقة (الصفحة الحالية)</p>
              <p className="text-2xl font-bold">{verifiedUsers}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 py-6">
            <div className="p-3 rounded-full bg-accent/10 text-accent">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">المتصلين الآن (الصفحة الحالية)</p>
              <p className="text-2xl font-bold">{onlineUsers}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Search */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle>قائمة الأعضاء</CardTitle>
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  name="search"
                  id="search-users"
                  placeholder="بحث بالاسم أو البريد..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-muted border-none rounded-lg pr-9 pl-4 py-2 text-sm w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <select
                name="role_filter"
                id="role-filter"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="bg-muted border-none rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
              >
                <option value="">كل الأدوار</option>
                {availableRoles.map(role => (
                  <option key={role.id} value={role.name}>{role.name}</option>
                ))}
              </select>
              <select
                name="status_filter"
                id="status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-muted border-none rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
              >
                <option value="">كل الحالات</option>
                <option value="active">نشط</option>
                <option value="pending">قيد الانتظار</option>
                <option value="inactive">غير نشط</option>
                <option value="banned">محظور</option>
                <option value="ip_blocked">IP محظور</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {viewMode === 'list' ? (
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="py-3 px-4 w-[40px]">
                      <input
                        type="checkbox"
                        name="select_all"
                        id="select-all-users"
                        className="rounded border-gray-300"
                        checked={users.length > 0 && selectedIds.length === users.length}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                      />
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">المستخدم</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">الدور</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">الحالة</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">الدولة</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">تاريخ الانضمام</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loading && users.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-muted-foreground">
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          جاري التحميل...
                        </div>
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-muted-foreground">
                        لا يوجد مستخدمين
                      </td>
                    </tr>
                  ) : (
                    users.map((user, index) => (
                      <motion.tr
                        key={user.id}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="group hover:bg-muted/30 transition-colors"
                      >
                        <td className="py-4 px-4">
                          <input
                            type="checkbox"
                            name={`select_user_${user.id}`}
                            id={`select-user-${user.id}`}
                            className="rounded border-gray-300"
                            checked={selectedIds.includes(user.id)}
                            onChange={(e) => handleSelectOne(user.id, e.target.checked)}
                          />
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                              <div className="relative">
                                <Image
                                  src={getAvatarUrl(user)}
                                  alt={user.name}
                                  width={40}
                                  height={40}
                                  className="rounded-full object-cover border border-border bg-muted"
                                  unoptimized={getAvatarUrl(user).includes('127.0.0.1') || getAvatarUrl(user).includes('localhost')}
                                />
                                {isUserOnline(user) && (
                                <span className="absolute bottom-0 right-0 w-3 h-3 bg-success rounded-full border-2 border-background" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{user.name}</p>
                              <p className="text-xs text-muted-foreground">{user.email}</p>
                              {user.job_title && (
                                <p className="text-[10px] text-primary mt-0.5">{user.job_title}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex flex-wrap gap-1">
                            {user.roles?.map((role) => (
                              <Badge
                                key={role.id || role.name}
                                variant={roleColors[role.name.toLowerCase()] || 'default'}
                                size="sm"
                              >
                                {role.name}
                              </Badge>
                            ))}
                            {(!user.roles || user.roles.length === 0) && (
                              <Badge variant="default" size="sm">مستخدم</Badge>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex flex-col gap-1">
                            <Badge variant={statusColors[getStatus(user)] || 'default'} size="sm" dot>
                              {statusLabels[getStatus(user)] || getStatus(user)}
                            </Badge>
                            {(user as any).ip_is_blocked && (
                              <Badge variant="error" size="xs">IP محظور</Badge>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-sm">
                          {user.country ? (
                            COUNTRIES.find(c => c.id === user.country || c.code === user.country)?.name || user.country
                          ) : '-'}
                        </td>
                        <td className="py-4 px-4 text-sm text-muted-foreground">
                          {new Date(user.created_at || '').toLocaleDateString('en-GB')}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="sm" onClick={() => setViewModal({ open: true, user })}>
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => openEdit(user)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => {
                               setMessageData({ subject: '', body: '' });
                               setMessageModal({ open: true, user });
                            }}>
                              <Mail className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-error hover:bg-error/10" onClick={() => setDeleteModal({ open: true, user })}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {loading && users.length === 0 ? (
                 <div className="col-span-full py-12 text-center text-muted-foreground">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                    جاري التحميل...
                 </div>
              ) : users.length === 0 ? (
                 <div className="col-span-full py-12 text-center text-muted-foreground">
                    لا يوجد مستخدمين
                 </div>
              ) : (
                users.map((user, index) => (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="group relative bg-card border border-border rounded-xl p-4 hover:shadow-lg transition-all duration-300"
                  >
                    <div className="absolute top-4 left-4">
                      <input
                        type="checkbox"
                        name={`select_user_grid_${user.id}`}
                        id={`select-user-grid-${user.id}`}
                        className="rounded border-gray-300 w-4 h-4"
                        checked={selectedIds.includes(user.id)}
                        onChange={(e) => handleSelectOne(user.id, e.target.checked)}
                      />
                    </div>
                    
                    <div className="flex flex-col items-center text-center">
                      <div className="relative mb-3">
                        <Image
                          src={getAvatarUrl(user)}
                          alt={user.name}
                          width={80}
                          height={80}
                          className="rounded-full object-cover border-4 border-background shadow-sm"
                          unoptimized={getAvatarUrl(user).includes('127.0.0.1') || getAvatarUrl(user).includes('localhost')}
                        />
                        <span className={cn(
                          "absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-background",
                          isUserOnline(user) ? "bg-success" : "bg-muted-foreground"
                        )} />
                      </div>
                      
                      <h3 className="font-bold text-lg text-foreground truncate w-full px-2">{user.name}</h3>
                      <p className="text-sm text-muted-foreground truncate w-full px-2 mb-1">{user.email}</p>
                      {user.job_title && (
                        <p className="text-xs text-primary font-medium mb-2">{user.job_title}</p>
                      )}
                      
                      <div className="flex flex-wrap justify-center gap-1 mb-3 mt-1">
                        {user.roles?.map((role) => (
                          <Badge
                            key={role.id || role.name}
                            variant={roleColors[role.name.toLowerCase()] || 'default'}
                            size="xs"
                          >
                            {role.name}
                          </Badge>
                        ))}
                        {(!user.roles || user.roles.length === 0) && (
                          <Badge variant="default" size="xs">مستخدم</Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mb-4 text-xs text-muted-foreground">
                         <span className="flex items-center gap-1">
                           <span className={cn("w-2 h-2 rounded-full", 
                            (getStatus(user) === 'active' || getStatus(user) === 'online') ? "bg-success" : 
                            getStatus(user) === 'pending' ? "bg-warning" : 
                            getStatus(user) === 'banned' ? "bg-error" : "bg-muted-foreground"
                          )} />
                           <span className={cn(
                             (getStatus(user) === 'active' || getStatus(user) === 'online') ? "text-emerald-600" :
                             getStatus(user) === 'pending' ? "text-amber-600" :
                             getStatus(user) === 'banned' ? "text-red-600" : ""
                           )}>
                             {statusLabels[getStatus(user)] || getStatus(user)}
                           </span>
                         </span>
                         <span>•</span>
                         <span>{user.country ? (COUNTRIES.find(c => c.id === user.country || c.code === user.country)?.name || user.country) : 'غير محدد'}</span>
                         {(user as any).ip_is_blocked && (
                           <><span>•</span><Badge variant="error" size="xs">IP محظور</Badge></>
                         )}
                      </div>

                      {user.social_links && (
                        <div className="flex justify-center gap-2 mb-4">
                          {(() => {
                             const links = Array.isArray(user.social_links) ? {} : (user.social_links ?? {});
                             return (
                               <>
                                 {isSafeUrl(links.facebook) && <a href={links.facebook} target="_blank" rel="noreferrer noopener" className="text-muted-foreground hover:text-blue-600 transition-colors"><Facebook className="w-4 h-4" /></a>}
                                 {isSafeUrl(links.twitter) && <a href={links.twitter} target="_blank" rel="noreferrer noopener" className="text-muted-foreground hover:text-sky-500 transition-colors"><Twitter className="w-4 h-4" /></a>}
                                 {isSafeUrl(links.linkedin) && <a href={links.linkedin} target="_blank" rel="noreferrer noopener" className="text-muted-foreground hover:text-blue-700 transition-colors"><Linkedin className="w-4 h-4" /></a>}
                                 {isSafeUrl(links.instagram) && <a href={links.instagram} target="_blank" rel="noreferrer noopener" className="text-muted-foreground hover:text-pink-600 transition-colors"><Instagram className="w-4 h-4" /></a>}
                               </>
                             );
                          })()}
                        </div>
                      )}

                      <div className="grid grid-cols-4 w-full gap-2 border-t border-border pt-3 mt-auto">
                        <Button variant="ghost" size="sm" className="h-8 w-full px-0" onClick={() => setViewModal({ open: true, user })}>
                           <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-full px-0" onClick={() => openEdit(user)}>
                           <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-full px-0" onClick={() => {
                             setMessageData({ subject: '', body: '' });
                             setMessageModal({ open: true, user });
                        }}>
                           <Mail className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-full px-0 text-error hover:bg-error/10 hover:text-error" onClick={() => setDeleteModal({ open: true, user })}>
                           <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          )}
          
          <div className="mt-8 border-t border-border pt-4">
            <Pagination
              currentPage={currentPage}
              totalPages={lastPage}
              onPageChange={handlePageChange}
            />
          </div>
        </CardContent>
      </Card>

      {/* --- MODALS --- */}

      {/* CREATE MODAL */}
      <Modal
        isOpen={createModal}
        onClose={() => setCreateModal(false)}
        title="إضافة مستخدم جديد"
        size="lg"
      >
        <div className="space-y-4 mt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              name="name"
              label="الاسم الكامل"
              value={createData.name}
              onChange={(e) => setCreateData({ ...createData, name: e.target.value })}
              placeholder="مثال: أحمد محمد"
            />
            <Input
              name="email"
              label="البريد الإلكتروني"
              type="email"
              value={createData.email}
              onChange={(e) => setCreateData({ ...createData, email: e.target.value })}
              placeholder="example@domain.com"
            />
            <Input
              name="password"
              label="كلمة المرور"
              type="password"
              value={createData.password}
              onChange={(e) => setCreateData({ ...createData, password: e.target.value })}
            />
            <Input
              name="password_confirmation"
              label="تأكيد كلمة المرور"
              type="password"
              value={createData.password_confirmation}
              onChange={(e) => setCreateData({ ...createData, password_confirmation: e.target.value })}
            />
            <Input
              name="phone"
              label="الهاتف"
              value={createData.phone}
              onChange={(e) => setCreateData({ ...createData, phone: e.target.value })}
            />
            <Input
              name="job_title"
              label="المسمى الوظيفي"
              value={createData.job_title}
              onChange={(e) => setCreateData({ ...createData, job_title: e.target.value })}
            />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
             <div>
              <label htmlFor="create-gender" className="block text-sm font-medium mb-1.5">الجنس</label>
              <select
                name="gender"
                id="create-gender"
                className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={createData.gender}
                onChange={(e) => setCreateData({ ...createData, gender: e.target.value })}
              >
                <option value="">اختر...</option>
                <option value="male">ذكر</option>
                <option value="female">أنثى</option>
              </select>
             </div>
             <div>
              <label htmlFor="create-country" className="block text-sm font-medium mb-1.5">الدولة</label>
              <select
                name="country"
                id="create-country"
                className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={createData.country}
                onChange={(e) => setCreateData({ ...createData, country: e.target.value })}
              >
                <option value="">اختر...</option>
                {COUNTRIES.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
             </div>
             <div>
              <label htmlFor="create-status" className="block text-sm font-medium mb-1.5">الحالة</label>
              <select
                name="status"
                id="create-status"
                className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={createData.status}
                onChange={(e) => setCreateData({ ...createData, status: e.target.value })}
              >
                <option value="active">نشط</option>
                <option value="pending">معلق</option>
                <option value="inactive">غير نشط</option>
                <option value="banned">محظور</option>
              </select>
             </div>
          </div>

          <div>
            <label htmlFor="create-role" className="block text-sm font-medium mb-1.5">الدور والصلاحية</label>
            <select
              name="role"
              id="create-role"
              className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              value={createData.role}
              onChange={(e) => setCreateData({ ...createData, role: e.target.value })}
            >
              <option value="">اختر الدور...</option>
              {availableRoles.map(role => (
                <option key={role.id} value={role.name}>{role.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="create-bio" className="block text-sm font-medium mb-1.5">نبذة</label>
            <textarea
              name="bio"
              id="create-bio"
              className="w-full rounded-lg border border-border bg-card px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              rows={2}
              value={createData.bio}
              onChange={(e) => setCreateData({ ...createData, bio: e.target.value })}
            />
          </div>

          <div className="pt-2 border-t border-border">
            <label className="block text-sm font-medium mb-3">روابط التواصل الاجتماعي</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <div className="relative">
                 <Facebook className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                 <Input
                   name="social_facebook"
                   className="pr-9"
                   placeholder="Facebook URL"
                   value={createData.social_links.facebook}
                   onChange={(e) => setCreateData({ ...createData, social_links: { ...createData.social_links, facebook: e.target.value } })}
                 />
               </div>
               <div className="relative">
                 <Twitter className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                 <Input
                   name="social_twitter"
                   className="pr-9"
                   placeholder="Twitter URL"
                   value={createData.social_links.twitter}
                   onChange={(e) => setCreateData({ ...createData, social_links: { ...createData.social_links, twitter: e.target.value } })}
                 />
               </div>
               <div className="relative">
                 <Linkedin className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                 <Input
                   name="social_linkedin"
                   className="pr-9"
                   placeholder="LinkedIn URL"
                   value={createData.social_links.linkedin}
                   onChange={(e) => setCreateData({ ...createData, social_links: { ...createData.social_links, linkedin: e.target.value } })}
                 />
               </div>
               <div className="relative">
                 <Instagram className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                 <Input
                   name="social_instagram"
                   className="pr-9"
                   placeholder="Instagram URL"
                   value={createData.social_links.instagram}
                   onChange={(e) => setCreateData({ ...createData, social_links: { ...createData.social_links, instagram: e.target.value } })}
                 />
               </div>
            </div>
          </div>

          {actionError && <p className="text-error text-sm">{actionError}</p>}
          
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setCreateModal(false)}>إلغاء</Button>
            <Button onClick={handleCreate} isLoading={actionLoading}>إضافة</Button>
          </div>
        </div>
      </Modal>

      {/* EDIT MODAL */}
      <Modal
        isOpen={editModal.open}
        onClose={() => setEditModal({ open: false, user: null })}
        title="تعديل المستخدم"
        size="lg"
      >
        <div className="mt-2">
          <div className="flex border-b border-border mb-4">
            <button
              className={cn("px-4 py-2 text-sm font-medium border-b-2 transition-colors", 
                editTab === 'profile' ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setEditTab('profile')}
            >
              البيانات الشخصية
            </button>
            {canManageRoles && (
              <button
                className={cn("px-4 py-2 text-sm font-medium border-b-2 transition-colors", 
                  editTab === 'permissions' ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                )}
                onClick={() => setEditTab('permissions')}
              >
                الأدوار والصلاحيات
              </button>
            )}
            <button
              className={cn("px-4 py-2 text-sm font-medium border-b-2 transition-colors", 
                editTab === 'social' ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setEditTab('social')}
            >
              التواصل الاجتماعي
            </button>
          </div>

          <div className="space-y-4">
            {editTab === 'profile' && (
              <>
                <div className="flex items-center gap-4 mb-4">
                  <Image
                    src={editModal.user ? getAvatarUrl(editModal.user) : 'https://api.dicebear.com/7.x/avataaars/svg?seed=placeholder'}
                    className="rounded-full object-cover border"
                    alt="Preview"
                    width={64}
                    height={64}
                  />
                  <div className="flex-1">
                     <label htmlFor="edit-profile-photo" className="block text-sm font-medium mb-1">تغيير الصورة</label>
                     <input 
                        type="file" 
                        name="profile_photo"
                        id="edit-profile-photo"
                        className="text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                        onChange={(e) => setEditData({...editData, profile_photo: e.target.files?.[0] || null})}
                     />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    name="name"
                    label="الاسم"
                    value={editData.name}
                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  />
                  <Input
                    name="email"
                    label="البريد الإلكتروني"
                    value={editData.email}
                    disabled
                    className="bg-muted opacity-75 cursor-not-allowed"
                    onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                  />
                  <Input
                    name="phone"
                    label="الهاتف"
                    value={editData.phone}
                    onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                  />
                  <Input
                    name="job_title"
                    label="المسمى الوظيفي"
                    value={editData.job_title}
                    onChange={(e) => setEditData({ ...editData, job_title: e.target.value })}
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                   <div>
                    <label htmlFor="edit-gender" className="block text-sm font-medium mb-1.5">الجنس</label>
                    <select
                      name="gender"
                      id="edit-gender"
                      className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                      value={editData.gender}
                      onChange={(e) => setEditData({ ...editData, gender: e.target.value })}
                    >
                      <option value="">اختر...</option>
                      <option value="male">ذكر</option>
                      <option value="female">أنثى</option>
                    </select>
                   </div>
                   <div>
                    <label htmlFor="edit-country" className="block text-sm font-medium mb-1.5">الدولة</label>
                    <select
                      name="country"
                      id="edit-country"
                      className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                      value={editData.country}
                      onChange={(e) => setEditData({ ...editData, country: e.target.value })}
                    >
                      <option value="">اختر...</option>
                      {COUNTRIES.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                   </div>
                   <div>
                    <label htmlFor="edit-status" className="block text-sm font-medium mb-1.5">الحالة</label>
                    <select
                      name="status"
                      id="edit-status"
                      className="w-full rounded-lg border border-border bg-muted px-4 py-2.5 text-foreground focus:outline-none cursor-not-allowed opacity-75"
                      value={editData.status}
                      disabled
                    >
                      <option value="active">نشط</option>
                      <option value="pending">معلق</option>
                      <option value="inactive">غير نشط</option>
                      <option value="banned">محظور</option>
                    </select>
                   </div>
                </div>

                <div className="pt-2 border-t border-border mt-2">
                  <p className="text-sm font-medium mb-2">تغيير كلمة المرور (اتركه فارغاً للإبقاء على الحالية)</p>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      name="password"
                      label="كلمة المرور الجديدة"
                      type="password"
                      value={editData.password || ''}
                      onChange={(e) => setEditData({ ...editData, password: e.target.value })}
                    />
                    <Input
                      name="password_confirmation"
                      label="تأكيد كلمة المرور"
                      type="password"
                      value={editData.password_confirmation || ''}
                      onChange={(e) => setEditData({ ...editData, password_confirmation: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="edit-bio" className="block text-sm font-medium mb-1">نبذة</label>
                  <textarea
                    name="bio"
                    id="edit-bio"
                    className="w-full rounded-lg border border-border bg-card px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    rows={3}
                    value={editData.bio}
                    onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                  />
                </div>
              </>
            )}

            {canManageRoles && editTab === 'permissions' && (
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium mb-3 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-primary" />
                    الأدوار (Roles)
                  </h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto p-1">
                    {availableRoles.map(role => (
                      <label key={role.id} htmlFor={`role-${role.id}`} className="flex items-center gap-2 p-2 rounded-lg border border-border hover:bg-muted/50 cursor-pointer">
                        <input
                          type="checkbox"
                          name={`role_${role.id}`}
                          id={`role-${role.id}`}
                          className="rounded text-primary focus:ring-primary"
                          checked={selectedRoles.includes(role.id)}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedRoles(prev => [...prev, role.id]);
                            else setSelectedRoles(prev => prev.filter(r => r !== role.id));
                          }}
                        />
                        <span className="text-sm font-medium">{role.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="font-medium mb-3 flex items-center gap-2">
                    <Key className="w-4 h-4 text-primary" />
                    الصلاحيات الخاصة (Permissions)
                  </h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto p-1">
                    {availablePermissions.map(perm => (
                      <label key={perm.id} htmlFor={`perm-${perm.id}`} className="flex items-center gap-2 p-2 rounded-lg border border-border hover:bg-muted/50 cursor-pointer">
                        <input
                          type="checkbox"
                          name={`perm_${perm.id}`}
                          id={`perm-${perm.id}`}
                          className="rounded text-primary focus:ring-primary"
                          checked={selectedPermissions.includes(perm.id)}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedPermissions(prev => [...prev, perm.id]);
                            else setSelectedPermissions(prev => prev.filter(p => p !== perm.id));
                          }}
                        />
                        <span className="text-sm">{perm.name}</span>
                      </label>
                    ))}
                    {availablePermissions.length === 0 && (
                      <p className="text-xs text-muted-foreground">لا توجد صلاحيات إضافية متاحة</p>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {editTab === 'social' && (
              <div className="grid grid-cols-1 gap-4">
                 <div className="relative">
                   <Facebook className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                   <Input
                     name="social_facebook"
                     className="pr-9"
                     placeholder="Facebook URL"
                     label="Facebook"
                     value={editData.social_links.facebook}
                     onChange={(e) => setEditData({ ...editData, social_links: { ...editData.social_links, facebook: e.target.value } })}
                   />
                 </div>
                 <div className="relative">
                   <Twitter className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                   <Input
                     name="social_twitter"
                     className="pr-9"
                     placeholder="Twitter URL"
                     label="Twitter"
                     value={editData.social_links.twitter}
                     onChange={(e) => setEditData({ ...editData, social_links: { ...editData.social_links, twitter: e.target.value } })}
                   />
                 </div>
                 <div className="relative">
                   <Linkedin className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                   <Input
                     name="social_linkedin"
                     className="pr-9"
                     placeholder="LinkedIn URL"
                     label="LinkedIn"
                     value={editData.social_links.linkedin}
                     onChange={(e) => setEditData({ ...editData, social_links: { ...editData.social_links, linkedin: e.target.value } })}
                   />
                 </div>
                 <div className="relative">
                   <Instagram className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                   <Input
                     name="social_instagram"
                     className="pr-9"
                     placeholder="Instagram URL"
                     label="Instagram"
                     value={editData.social_links.instagram}
                     onChange={(e) => setEditData({ ...editData, social_links: { ...editData.social_links, instagram: e.target.value } })}
                   />
                 </div>
                 <div className="relative">
                   <Github className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                   <Input
                     name="social_github"
                     className="pr-9"
                     placeholder="GitHub URL"
                     label="GitHub"
                     value={editData.social_links.github}
                     onChange={(e) => setEditData({ ...editData, social_links: { ...editData.social_links, github: e.target.value } })}
                   />
                 </div>
              </div>
            )}
            
            {actionError && <p className="text-error text-sm">{actionError}</p>}

            <div className="flex justify-end gap-2 pt-4 border-t border-border mt-4">
              <Button variant="outline" onClick={() => setEditModal({ open: false, user: null })}>إلغاء</Button>
              <Button onClick={handleUpdate} isLoading={actionLoading}>حفظ التغييرات</Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* VIEW MODAL */}
      <Modal
        isOpen={viewModal.open}
        onClose={() => setViewModal({ open: false, user: null })}
        title="بطاقة المستخدم"
        size="md"
      >
        {viewModal.user && (
          <div className="text-center space-y-4 mt-4">
            <div className="relative inline-block">
              <Image
                src={getAvatarUrl(viewModal.user)}
                alt={viewModal.user.name}
                width={96}
                height={96}
                className="rounded-full border-4 border-background shadow-lg mx-auto object-cover"
              />
              <span className={cn(
                "absolute bottom-1 right-1 w-5 h-5 rounded-full border-2 border-background",
                isUserOnline(viewModal.user) ? "bg-success" : "bg-muted-foreground"
              )} />
            </div>
            
            <div>
              <h3 className="text-xl font-bold">{viewModal.user.name}</h3>
              <p className="text-muted-foreground">{viewModal.user.email}</p>
              <div className="flex justify-center gap-2 mt-2">
                {viewModal.user.roles?.map((r, index) => (
                  <Badge key={r.id || r.name || index} variant="secondary">{r.name}</Badge>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-right bg-muted/30 p-4 rounded-xl">
              <div>
                <p className="text-xs text-muted-foreground">تاريخ الانضمام</p>
                <p className="text-sm font-medium">{new Date(viewModal.user.created_at || '').toLocaleDateString('en-GB')}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">آخر نشاط</p>
                <p className="text-sm font-medium">{viewModal.user.last_activity ? new Date(viewModal.user.last_activity).toLocaleString('en-GB') : '-'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">الهاتف</p>
                <p className="text-sm font-medium">{viewModal.user.phone || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">الحالة</p>
                <Badge variant={statusColors[getStatus(viewModal.user)] || 'default'} size="xs">
                  {statusLabels[getStatus(viewModal.user)] || getStatus(viewModal.user)}
                </Badge>
              </div>
              <div>
                 <p className="text-xs text-muted-foreground">الدولة</p>
                 <p className="text-sm font-medium">
                   {viewModal.user.country ? (COUNTRIES.find(c => String(c.id) === String(viewModal.user?.country) || c.code === viewModal.user?.country)?.name || viewModal.user.country) : '-'}
                 </p>
              </div>
              <div>
                 <p className="text-xs text-muted-foreground">المسمى الوظيفي</p>
                 <p className="text-sm font-medium">{viewModal.user.job_title || '-'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-muted-foreground mb-1">عنوان IP (آخر تسجيل دخول)</p>
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-sm font-mono font-medium">{viewModal.user.last_login_ip || 'غير متاح'}</span>
                  {viewModal.user.last_login_ip && (
                    <button
                      onClick={() => setBlockIpModal({ open: true, ip: viewModal.user!.last_login_ip!, userId: viewModal.user!.id })}
                      className="mr-auto flex items-center gap-1 text-xs text-destructive hover:text-destructive/80 transition-colors border border-destructive/30 hover:border-destructive/60 rounded px-2 py-0.5"
                    >
                      <Ban className="w-3 h-3" />
                      حظر IP
                    </button>
                  )}
                </div>
              </div>
            </div>

            {viewModal.user.bio && (
              <div className="text-right">
                <p className="text-xs text-muted-foreground mb-1">نبذة</p>
                <p className="text-sm bg-muted/30 p-3 rounded-lg">{viewModal.user.bio}</p>
              </div>
            )}

            {viewModal.user.social_links && (
               <div className="flex justify-center gap-3 pt-2">
                 {(() => {
                    let links: any = {};
                    if (typeof viewModal.user.social_links === 'string') {
                      try {
                        const parsed = JSON.parse(viewModal.user.social_links);
                        if (parsed && !Array.isArray(parsed)) links = parsed;
                      } catch {}
                    } else if (!Array.isArray(viewModal.user.social_links)) {
                      links = viewModal.user.social_links;
                    }
                    
                    return (
                      <>
                        {isSafeUrl(links.facebook) && <a href={links.facebook} target="_blank" rel="noreferrer noopener" className="text-muted-foreground hover:text-blue-600 transition-colors"><Facebook className="w-5 h-5" /></a>}
                        {isSafeUrl(links.twitter) && <a href={links.twitter} target="_blank" rel="noreferrer noopener" className="text-muted-foreground hover:text-sky-500 transition-colors"><Twitter className="w-5 h-5" /></a>}
                        {isSafeUrl(links.linkedin) && <a href={links.linkedin} target="_blank" rel="noreferrer noopener" className="text-muted-foreground hover:text-blue-700 transition-colors"><Linkedin className="w-5 h-5" /></a>}
                        {isSafeUrl(links.instagram) && <a href={links.instagram} target="_blank" rel="noreferrer noopener" className="text-muted-foreground hover:text-pink-600 transition-colors"><Instagram className="w-5 h-5" /></a>}
                        {isSafeUrl(links.github) && <a href={links.github} target="_blank" rel="noreferrer noopener" className="text-muted-foreground hover:text-gray-900 transition-colors"><Github className="w-5 h-5" /></a>}
                      </>
                    );
                 })()}
               </div>
            )}

            <div className="flex justify-center gap-2 pt-2">
               <Button variant="outline" onClick={() => setViewModal({ open: false, user: null })}>إغلاق</Button>
               <Button onClick={() => {
                 setViewModal({ open: false, user: null });
                 openEdit(viewModal.user!);
               }}>تعديل</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* BLOCK IP MODAL */}
      <Modal
        isOpen={blockIpModal.open}
        onClose={() => setBlockIpModal({ open: false, ip: null, userId: null })}
        title="حظر عنوان IP"
        size="sm"
      >
        <div className="space-y-4 mt-2">
          <p className="text-sm text-muted-foreground text-right">
            هل أنت متأكد من حظر عنوان IP التالي؟ لن يتمكن أي مستخدم يتصل من هذا العنوان من الوصول إلى الموقع.
          </p>
          <div className="flex items-center gap-2 bg-muted/40 rounded-lg p-3">
            <Globe className="w-4 h-4 text-muted-foreground" />
            <span className="font-mono text-sm font-medium">{blockIpModal.ip}</span>
          </div>
          {actionError && <p className="text-xs text-destructive text-right">{actionError}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => { setBlockIpModal({ open: false, ip: null, userId: null }); setActionError(null); }}>
              إلغاء
            </Button>
            <Button
              variant="danger"
              disabled={actionLoading}
              onClick={async () => {
                if (!blockIpModal.ip) return;
                setActionLoading(true);
                setActionError(null);
                try {
                  await securityService.blockIp({ ip: blockIpModal.ip, reason: 'محظور من لوحة إدارة المستخدمين' });
                  setBlockIpModal({ open: false, ip: null, userId: null });
                } catch (e: any) {
                  setActionError(e?.message || 'حدث خطأ أثناء حظر IP');
                } finally {
                  setActionLoading(false);
                }
              }}
            >
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Ban className="w-4 h-4 ml-1" />تأكيد الحظر</>}
            </Button>
          </div>
        </div>
      </Modal>

      {/* MESSAGE MODAL */}
      <Modal
        isOpen={messageModal.open}
        onClose={() => setMessageModal({ open: false, user: null })}
        title={`مراسلة: ${messageModal.user?.name}`}
        size="md"
      >
        <div className="space-y-4 mt-2">
          <Input
            name="subject"
            label="الموضوع"
            value={messageData.subject}
            onChange={(e) => setMessageData({ ...messageData, subject: e.target.value })}
          />
          <div>
            <label htmlFor="message-body" className="block text-sm font-medium mb-1">الرسالة</label>
            <textarea
              name="message_body"
              id="message-body"
              className="w-full rounded-lg border border-border bg-card px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20"
              rows={5}
              value={messageData.body}
              onChange={(e) => setMessageData({ ...messageData, body: e.target.value })}
            />
          </div>
          {actionError && <p className="text-error text-sm">{actionError}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setMessageModal({ open: false, user: null })}>إلغاء</Button>
            <Button onClick={handleSendMessage} isLoading={actionLoading}>إرسال</Button>
          </div>
        </div>
      </Modal>

      {/* DELETE MODAL */}
      <Modal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, user: null })}
        title="حذف المستخدم"
        size="sm"
      >
        <div className="space-y-4 mt-2">
          <p className="text-muted-foreground">
            هل أنت متأكد من حذف المستخدم <strong>{deleteModal.user?.name}</strong>؟ 
            سيتم حذف جميع البيانات المرتبطة به ولا يمكن التراجع عن هذا الإجراء.
          </p>
          {actionError && <p className="text-error text-sm">{actionError}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeleteModal({ open: false, user: null })}>إلغاء</Button>
            <Button variant="danger" onClick={handleDelete} isLoading={actionLoading}>تأكيد الحذف</Button>
          </div>
        </div>
      </Modal>

      {/* BULK DELETE MODAL */}
      <Modal
        isOpen={bulkDeleteModal}
        onClose={() => setBulkDeleteModal(false)}
        title="حذف متعدد"
        size="sm"
      >
        <div className="space-y-4 mt-2">
          <p className="text-muted-foreground">
            هل أنت متأكد من حذف <strong>{selectedIds.length}</strong> مستخدمين؟
            هذا الإجراء نهائي ولا يمكن استعادته.
          </p>
          {actionError && <p className="text-error text-sm">{actionError}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setBulkDeleteModal(false)}>إلغاء</Button>
            <Button variant="danger" onClick={handleBulkDelete} isLoading={actionLoading}>حذف الكل</Button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
