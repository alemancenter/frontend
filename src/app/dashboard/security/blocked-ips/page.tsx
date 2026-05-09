'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { ShieldX, Search, User, Plus, Calendar, Unlock, Lock, AlertOctagon, Clock } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import DataTable from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import { securityService } from '@/lib/api/services';
import Input from '@/components/ui/Input';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import AccessDenied from '@/components/common/AccessDenied';

type BlockedIpStatus = 'active' | 'expired' | 'all';

type BlockedIp = {
  id: number;
  ip_address: string;
  reason?: string | null;
  blocked_by?: number | null;
  expires_at?: string | null;
  is_auto_block?: boolean;
  is_active?: boolean;
  is_expired?: boolean;
  status?: 'active' | 'expired';
  remaining_days?: number | null;
  created_at: string;
  updated_at?: string;
  user?: { name?: string } | null;
};

function isIpActive(item: BlockedIp): boolean {
  if (typeof item.is_active === 'boolean') return item.is_active;
  if (typeof item.is_expired === 'boolean') return !item.is_expired;
  if (!item.expires_at) return true;
  return new Date(item.expires_at).getTime() > Date.now();
}

function formatDate(value?: string | null): string {
  if (!value) return 'دائم';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'غير محدد';
  return date.toLocaleDateString('en-GB');
}

export default function BlockedIpsPage() {
  const { isAuthorized } = usePermissionGuard('manage security');
  const [ips, setIps] = useState<BlockedIp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<BlockedIpStatus>('active');
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
    per_page: 15,
  });

  const [unblockModal, setUnblockModal] = useState<{ open: boolean; ip: BlockedIp | null }>({
    open: false,
    ip: null,
  });
  const [blockModal, setBlockModal] = useState(false);
  const [blockForm, setBlockForm] = useState({ ip: '', reason: '', days: '' });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchBlockedIps = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      setError('');
      const response = await securityService.getBlockedIps({
        page,
        per_page: pagination.per_page,
        search: searchQuery.trim() || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
      });

      setIps(Array.isArray(response.data) ? response.data : []);
      setPagination((current) => ({
        current_page: response.current_page || page,
        last_page: response.last_page || 1,
        total: response.total || 0,
        per_page: response.per_page || current.per_page,
      }));
    } catch (err: any) {
      setError(err?.response?.data?.message || 'فشل تحميل قائمة عناوين IP المحظورة');
      setIps([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.per_page, searchQuery, statusFilter]);

  useEffect(() => {
    if (!isAuthorized) return;
    const timer = window.setTimeout(() => fetchBlockedIps(1), 350);
    return () => window.clearTimeout(timer);
  }, [fetchBlockedIps, isAuthorized]);

  const columns = useMemo(() => [
    {
      title: 'عنوان IP',
      key: 'ip_address',
      render: (_: unknown, item: BlockedIp) => (
        <div className="flex items-center gap-2 font-mono" dir="ltr">
          <ShieldX className="w-4 h-4 text-red-500" />
          <span className="font-semibold">{item.ip_address}</span>
        </div>
      ),
    },
    {
      title: 'سبب الحظر',
      key: 'reason',
      render: (_: unknown, item: BlockedIp) => (
        <div className="max-w-xs truncate text-gray-700">
          {item.reason || 'غير محدد'}
        </div>
      ),
    },
    {
      title: 'نوع الحظر',
      key: 'is_auto_block',
      render: (_: unknown, item: BlockedIp) => (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <User className="w-3 h-3" />
          <span>{item.is_auto_block ? 'تلقائي' : 'يدوي'}</span>
        </div>
      ),
    },
    {
      title: 'الحالة',
      key: 'status',
      render: (_: unknown, item: BlockedIp) => {
        const active = isIpActive(item);
        return (
          <Badge variant={active ? 'error' : 'default'}>
            {active ? 'نشط' : 'منتهي'}
          </Badge>
        );
      },
    },
    {
      title: 'ينتهي في',
      key: 'expires_at',
      render: (_: unknown, item: BlockedIp) => (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Clock className="w-4 h-4" />
          <span dir="ltr">{formatDate(item.expires_at)}</span>
        </div>
      ),
    },
    {
      title: 'تاريخ الحظر',
      key: 'created_at',
      render: (_: unknown, item: BlockedIp) => (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Calendar className="w-4 h-4" />
          <span dir="ltr">{formatDate(item.created_at)}</span>
        </div>
      ),
    },
    {
      title: 'إجراءات',
      key: 'actions',
      render: (_: unknown, item: BlockedIp) => (
        <Button
          variant="ghost"
          size="sm"
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
          onClick={() => setUnblockModal({ open: true, ip: item })}
          title="فك الحظر"
        >
          <Unlock className="w-4 h-4" />
        </Button>
      ),
    },
  ], []);

  if (isAuthorized === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (isAuthorized === false) return <AccessDenied />;

  const handleUnblock = async () => {
    if (!unblockModal.ip) return;
    try {
      setFormLoading(true);
      await securityService.deleteBlock(unblockModal.ip.ip_address || unblockModal.ip.id);
      setUnblockModal({ open: false, ip: null });
      fetchBlockedIps(pagination.current_page);
    } catch (err) {
      console.error('Failed to unblock IP:', err);
    } finally {
      setFormLoading(false);
    }
  };

  const handleBlockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    try {
      setFormLoading(true);
      await securityService.blockIp({
        ip: blockForm.ip.trim(),
        reason: blockForm.reason.trim(),
        days: blockForm.days ? Number.parseInt(blockForm.days, 10) : undefined,
      });
      setBlockModal(false);
      setBlockForm({ ip: '', reason: '', days: '' });
      fetchBlockedIps(1);
    } catch (err: any) {
      setFormError(err?.response?.data?.message || 'فشل حظر العنوان');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ShieldX className="w-8 h-8 text-red-600" />
            عناوين IP المحظورة
          </h1>
          <p className="text-gray-500 mt-1">إدارة قائمة الحظر وحماية النظام من التهديدات</p>
        </div>
        <Button onClick={() => setBlockModal(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          حظر IP جديد
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <CardTitle>قائمة الحظر</CardTitle>
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
                {(['active', 'expired', 'all'] as BlockedIpStatus[]).map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-3 py-1 text-sm rounded-md transition-colors ${
                      statusFilter === status ? 'bg-white shadow text-primary-600' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {status === 'active' ? 'نشط' : status === 'expired' ? 'منتهي' : 'الكل'}
                  </button>
                ))}
              </div>
              <div className="relative w-full md:w-72">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="بحث عن IP أو السبب..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-4 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}
          <DataTable
            data={ips}
            columns={columns}
            loading={loading}
            emptyMessage="لا توجد عناوين IP محظورة حالياً"
            pagination={pagination}
            onPageChange={fetchBlockedIps}
          />
        </CardContent>
      </Card>

      <Modal isOpen={blockModal} onClose={() => setBlockModal(false)} title="حظر عنوان IP جديد">
        <form onSubmit={handleBlockSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">عنوان IP</label>
            <Input
              value={blockForm.ip}
              onChange={(e) => setBlockForm({ ...blockForm, ip: e.target.value })}
              placeholder="Example: 192.168.1.1"
              required
              dir="ltr"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">سبب الحظر</label>
            <Input
              value={blockForm.reason}
              onChange={(e) => setBlockForm({ ...blockForm, reason: e.target.value })}
              placeholder="مثال: محاولات دخول متكررة"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">مدة الحظر بالأيام</label>
            <Input
              type="number"
              value={blockForm.days}
              onChange={(e) => setBlockForm({ ...blockForm, days: e.target.value })}
              placeholder="اتركه فارغاً للحظر الدائم"
              min="1"
            />
            <p className="text-xs text-gray-500 mt-1">اتركه فارغاً للحظر الدائم.</p>
          </div>

          {formError && <div className="text-red-500 text-sm bg-red-50 p-2 rounded">{formError}</div>}

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" type="button" onClick={() => setBlockModal(false)}>إلغاء</Button>
            <Button variant="danger" type="submit" isLoading={formLoading}>
              <Lock className="w-4 h-4 ml-2" />
              حظر العنوان
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={unblockModal.open} onClose={() => setUnblockModal({ open: false, ip: null })} title="تأكيد فك الحظر">
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-amber-600 bg-amber-50 p-3 rounded-lg">
            <AlertOctagon className="w-6 h-6 flex-shrink-0" />
            <p className="text-sm">
              هل أنت متأكد من رغبتك في فك الحظر عن العنوان{' '}
              <span className="font-mono font-bold" dir="ltr">{unblockModal.ip?.ip_address}</span>؟ سيتمكن هذا العنوان من الوصول للنظام مرة أخرى.
            </p>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setUnblockModal({ open: false, ip: null })}>إلغاء</Button>
            <Button variant="primary" onClick={handleUnblock} isLoading={formLoading}>
              <Unlock className="w-4 h-4 ml-2" />
              تأكيد فك الحظر
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
