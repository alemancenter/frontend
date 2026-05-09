'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, Bell, Search, Sun, Moon, Settings, CheckCheck } from 'lucide-react';
import Link from 'next/link';
import { useThemeStore, useSidebarStore, useAuthStore } from '@/store/useStore';
import Button from '@/components/ui/Button';
import { notificationsService } from '@/lib/api/services';
import type { Notification } from '@/types';
import toast from 'react-hot-toast';
import AppImage from '@/components/common/AppImage';
import { getStorageUrl } from '@/lib/utils';

export default function DashboardHeader() {
  const { isDarkMode, toggleDarkMode } = useThemeStore();
  const { toggleSidebar } = useSidebarStore();
  const { user, isAuthenticated } = useAuthStore();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notificationRef = useRef<HTMLDivElement>(null);
  const [failedAvatarSrc, setFailedAvatarSrc] = useState<string | null>(null);
  const avatarSrc = getStorageUrl(user?.profile_photo_url || user?.profile_photo_path);
  const avatarError = failedAvatarSrc === avatarSrc;

  // Close notifications when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchLatestNotifications = async () => {
    try {
      const response = await notificationsService.getLatest(5);
      setNotifications(response.data || []);
      setUnreadCount(response.unread_count || 0);
    } catch {
      console.error('Failed to fetch notifications');
    }
  };

  useEffect(() => {
    // Only fetch notifications if user is authenticated
    if (!isAuthenticated || !user) return;

    const initialTimer = setTimeout(() => {
      void fetchLatestNotifications();
    }, 0);
    // Poll every minute
    const interval = setInterval(() => {
      void fetchLatestNotifications();
    }, 60000);
    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [isAuthenticated, user]);

  const markAsRead = async (id: string) => {
    try {
      await notificationsService.markAsRead(id);
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, read_at: new Date().toISOString() } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {
      console.error('Failed to mark as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationsService.markAllAsRead();
      setNotifications(notifications.map(n => ({ ...n, read_at: new Date().toISOString() })));
      setUnreadCount(0);
      toast.success('تم تعليم الكل كمقروء');
    } catch {
      toast.error('حدث خطأ');
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    const minutes = Math.floor(diff / (1000 * 60));

    if (minutes < 1) return 'الآن';
    if (minutes < 60) return `منذ ${minutes} دقيقة`;
    if (hours < 24) return `منذ ${hours} ساعة`;
    if (days < 7) return `منذ ${days} يوم`;
    return date.toLocaleDateString('ar-SA');
  };

  return (
    <header className="h-16 bg-card border-b border-border px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Left Section */}
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Search */}
        <div className="hidden md:flex items-center gap-2 bg-muted rounded-lg px-3 py-2">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="بحث..."
            className="bg-transparent border-none outline-none text-sm w-48 placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2">
        {/* Theme Toggle */}
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-lg hover:bg-muted transition-colors"
        >
          {isDarkMode ? (
            <Sun className="w-5 h-5 text-warning" />
          ) : (
            <Moon className="w-5 h-5 text-secondary" />
          )}
        </button>

        {/* Notifications */}
        <div className="relative" ref={notificationRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-lg hover:bg-muted transition-colors relative"
            aria-label="Show notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full ring-2 ring-card" />
            )}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute left-0 top-full mt-2 w-80 md:w-96 bg-card border border-border rounded-xl shadow-xl overflow-hidden z-50"
              >
                <div className="p-4 border-b border-border flex items-center justify-between">
                  <h3 className="font-semibold">الإشعارات</h3>
                  {unreadCount > 0 && (
                    <button 
                      onClick={markAllAsRead}
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                    >
                      <CheckCheck className="w-3 h-3" />
                      تحديد الكل كمقروء
                    </button>
                  )}
                </div>
                
                <div className="max-h-[400px] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      <Bell className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      <p>لا توجد إشعارات جديدة</p>
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 hover:bg-muted/50 transition-colors border-b border-border last:border-0 relative group ${
                          !notification.read_at ? 'bg-primary/5' : ''
                        }`}
                      >
                        <div className="flex gap-3">
                          <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${!notification.read_at ? 'bg-primary' : 'bg-transparent'}`} />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm truncate">{notification.data.title || 'إشعار جديد'}</h4>
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                              {notification.data.message || notification.data.description || notification.data.body || ''}
                            </p>
                            <div className="flex items-center gap-3 mt-2">
                              <span className="text-xs text-muted-foreground">
                                {formatTime(notification.created_at)}
                              </span>
                              {!notification.read_at && (
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    markAsRead(notification.id);
                                  }}
                                  className="text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  تحديد كمقروء
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                
                <div className="p-3 border-t border-border bg-muted/20">
                  <Link href="/dashboard/notifications" passHref>
                    <Button variant="ghost" size="sm" className="w-full" onClick={() => setShowNotifications(false)}>
                      عرض جميع الإشعارات
                    </Button>
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Settings */}
        <button className="p-2 rounded-lg hover:bg-muted transition-colors">
          <Settings className="w-5 h-5" />
        </button>

        {/* User Avatar */}
        <div className="flex items-center gap-3 mr-2 pr-4 border-r border-border">
          <div className="text-left hidden sm:block">
            <p className="text-sm font-medium">{user?.name || 'المستخدم'}</p>
            <p className="text-xs text-muted-foreground">{user?.roles?.[0]?.name || 'مدير'}</p>
          </div>
          <div
            className={`w-10 h-10 rounded-full overflow-hidden flex items-center justify-center text-white font-bold ${
              avatarSrc && !avatarError ? 'bg-muted' : 'gradient-bg'
            }`}
          >
            {avatarSrc && !avatarError ? (
              <AppImage
                src={avatarSrc}
                alt={user?.name || 'User'}
                width={40}
                height={40}
                className="w-10 h-10 object-cover"
                onError={() => setFailedAvatarSrc(avatarSrc)}
                unoptimized={avatarSrc.includes('127.0.0.1') || avatarSrc.includes('localhost')}
              />
            ) : (
              <span>{user?.name?.[0] || 'U'}</span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
