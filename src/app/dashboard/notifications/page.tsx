'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Bell,
  BellRing,
  Check,
  CheckCheck,
  Trash2,
  Mail,
  AlertCircle,
  Loader2,
  User,
  ShieldAlert,
  FileText,
} from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import type { Notification } from '@/types';
import { notificationsService } from '@/lib/api/services';
import toast from 'react-hot-toast';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';

export default function NotificationsPage() {
  const { user } = usePermissionGuard('manage notifications');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [deleteConfig, setDeleteConfig] = useState<{ type: 'single' | 'bulk'; id?: string } | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const response = await notificationsService.getAll({ per_page: 50 });
      setNotifications(response.data || []);
      setUnreadCount(response.unread_count || 0);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      toast.error('فشل في تحميل الإشعارات');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchNotifications();
  }, [user]);

  const getNotificationContent = (notification: Notification) => {
    const { type, data } = notification;
    let title = data.title || '';
    let message = data.message || data.description || data.body || '';
    let icon = <Bell className="w-5 h-5" />;
    let color = 'bg-gray-500';

    // Helper to check type strings
    const isType = (t: string) => type.toLowerCase().includes(t.toLowerCase());

    if (isType('ArticleNotification')) {
      icon = <FileText className="w-5 h-5" />;
      color = 'bg-purple-500';
      if (!title) title = 'مقال جديد';
      if (!message && data.article_id) message = `تم نشر مقال جديد`;
    } 
    else if (isType('Security') || isType('Alert')) {
      const isCritical = isType('Critical') || data.severity === 'critical' || data.severity === 'danger';
      icon = isCritical ? <ShieldAlert className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />;
      color = isCritical ? 'bg-red-600' : 'bg-orange-500';
      
      if (!title) {
        if (data.event_type) title = `تنبيه أمني: ${data.event_type}`;
        else title = 'تنبيه أمني';
      }
      
      if (!message && data.ip_address) {
        message = `IP: ${data.ip_address}`;
      }
    } 
    else if (isType('Message') || isType('Chat')) {
      icon = <Mail className="w-5 h-5" />;
      color = 'bg-blue-500';
      if (!title) title = 'رسالة جديدة';
    } 
    else if (isType('Role') || isType('User') || isType('Verify')) {
      icon = <User className="w-5 h-5" />;
      color = 'bg-green-500';
      if (!title) title = 'تحديث الحساب';
      if (isType('Role') && !message) message = 'تم تحديث الصلاحيات';
    }

    return { title, message, icon, color };
  };

  const filteredNotifications = filter === 'unread'
    ? notifications.filter((n) => !n.read_at)
    : notifications;

  const markAsRead = async (id: string) => {
    try {
      const response = await notificationsService.markAsRead(id);
      setNotifications(notifications.map((n) =>
        n.id === id ? { ...n, read_at: new Date().toISOString() } : n
      ));
      setUnreadCount(response.unread_count);
      toast.success('تم تعليم الإشعار كمقروء');
    } catch (error) {
      console.error(error);
      toast.error('حدث خطأ أثناء تحديث الإشعار');
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationsService.markAllAsRead();
      setNotifications(notifications.map((n) => ({
        ...n,
        read_at: n.read_at || new Date().toISOString(),
      })));
      setUnreadCount(0);
      toast.success('تم تعليم الكل كمقروء');
    } catch (error) {
      console.error(error);
      toast.error('حدث خطأ أثناء تحديث الإشعارات');
    }
  };

  const initiateDelete = (id?: string) => {
    if (id) {
      setDeleteConfig({ type: 'single', id });
    } else {
      if (selectedIds.length === 0) return;
      setDeleteConfig({ type: 'bulk' });
    }
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteConfig) return;
    
    setIsDeleteModalOpen(false);

    if (deleteConfig.type === 'single' && deleteConfig.id) {
      const id = deleteConfig.id;
      try {
        await notificationsService.delete(id);
        setNotifications(notifications.filter((n) => n.id !== id));
        setSelectedIds(selectedIds.filter((i) => i !== id));
        
        const deletedWasUnread = !notifications.find(n => n.id === id)?.read_at;
        if (deletedWasUnread) {
           setUnreadCount(prev => Math.max(0, prev - 1));
        }
        toast.success('تم حذف الإشعار');
      } catch (error) {
        console.error(error);
        toast.error('فشل في حذف الإشعار');
      }
    } else if (deleteConfig.type === 'bulk') {
      try {
        await notificationsService.bulkAction(selectedIds, 'delete');
        setNotifications(notifications.filter((n) => !selectedIds.includes(n.id)));
        
        const deletedUnreadCount = notifications.filter(n => selectedIds.includes(n.id) && !n.read_at).length;
        setUnreadCount(prev => Math.max(0, prev - deletedUnreadCount));
        
        setSelectedIds([]);
        toast.success('تم حذف الإشعارات المحددة');
      } catch (error) {
        console.error(error);
        toast.error('فشل في حذف الإشعارات');
      }
    }
    setDeleteConfig(null);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedIds.length === filteredNotifications.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredNotifications.map((n) => n.id));
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return 'منذ قليل';
    if (hours < 24) return `منذ ${hours} ساعة`;
    if (days < 7) return `منذ ${days} يوم`;
    return date.toLocaleDateString('ar-SA');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Bell className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">الإشعارات</h1>
            <p className="text-muted-foreground">
              {unreadCount > 0 ? `لديك ${unreadCount} إشعارات غير مقروءة` : 'جميع الإشعارات مقروءة'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && (
            <Button variant="danger" size="sm" onClick={() => initiateDelete()}>
              <Trash2 className="w-4 h-4 ml-2" />
              حذف المحدد ({selectedIds.length})
            </Button>
          )}
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllAsRead}>
              <CheckCheck className="w-4 h-4 ml-2" />
              قراءة الكل
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="py-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Bell className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">إجمالي الإشعارات</p>
              <p className="text-xl font-bold">{notifications.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
              <BellRing className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">غير مقروء</p>
              <p className="text-xl font-bold text-warning">{unreadCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
              <Check className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">مقروء</p>
              <p className="text-xl font-bold text-success">{notifications.filter(n => n.read_at).length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>قائمة الإشعارات</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant={filter === 'all' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              الكل
            </Button>
            <Button
              variant={filter === 'unread' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setFilter('unread')}
            >
              غير مقروء
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Select All */}
          <div className="flex items-center gap-3 pb-4 border-b border-border mb-4">
            <input
              type="checkbox"
              checked={selectedIds.length === filteredNotifications.length && filteredNotifications.length > 0}
              onChange={selectAll}
              className="w-4 h-4 rounded border-border"
            />
            <span className="text-sm text-muted-foreground">تحديد الكل</span>
          </div>

          {/* Notifications List */}
          <div className="space-y-3">
            {filteredNotifications.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>لا توجد إشعارات</p>
              </div>
            ) : (
              filteredNotifications.map((notification, index) => {
                const { title, message, icon, color } = getNotificationContent(notification);
                return (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`flex items-start gap-4 p-4 rounded-xl transition-colors ${
                      !notification.read_at ? 'bg-primary/5' : 'hover:bg-muted'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(notification.id)}
                      onChange={() => toggleSelect(notification.id)}
                      className="w-4 h-4 rounded border-border mt-1"
                    />
                    <div className={`w-10 h-10 rounded-full ${color} flex items-center justify-center text-white shrink-0`}>
                      {icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium">{title}</p>
                          <p className="text-sm text-muted-foreground">{message}</p>
                        </div>
                        {!notification.read_at && (
                          <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-xs text-muted-foreground">
                          {formatTime(notification.created_at)}
                        </span>
                        {!notification.read_at && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="text-xs text-primary hover:underline"
                          >
                            تعليم كمقروء
                          </button>
                        )}
                        <button
                          onClick={() => initiateDelete(notification.id)}
                          className="text-xs text-error hover:underline"
                        >
                          حذف
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="تأكيد الحذف"
        description={
          deleteConfig?.type === 'bulk'
            ? `هل أنت متأكد من حذف ${selectedIds.length} إشعار؟ لا يمكن التراجع عن هذا الإجراء.`
            : 'هل أنت متأكد من حذف هذا الإشعار؟ لا يمكن التراجع عن هذا الإجراء.'
        }
      >
        <div className="flex justify-end gap-3 mt-6">
          <Button
            variant="outline"
            onClick={() => setIsDeleteModalOpen(false)}
          >
            إلغاء
          </Button>
          <Button
            variant="danger"
            onClick={confirmDelete}
          >
            حذف
          </Button>
        </div>
      </Modal>
    </div>
  );
}
