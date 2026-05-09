'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Bell, Check, MessageSquare, FileText, Newspaper, Info } from 'lucide-react';
import { notificationService, Notification } from '@/lib/api/services/notifications';
import { apiClient } from '@/lib/api/client';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

export default function NotificationsDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    if (!apiClient.getToken()) return;
    try {
      const res = await notificationService.getLatest(10);
      // Ensure we have an array
      const notifs = Array.isArray(res.data) ? res.data : [];
      setNotifications(notifs);
      setUnreadCount(res.unread_count || 0);
    } catch (error: any) {
      if (error?.status === 401) {
        // Token is invalid or expired — clear it so future polls don't repeat the 401
        apiClient.setToken(null);
      } else if (error?.status !== 403) {
        console.error('Failed to fetch notifications', error);
      }
      setNotifications([]);
      setUnreadCount(0);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll every 30 seconds for new notifications
    const interval = setInterval(fetchNotifications, 30000);
    // Immediate refresh when content is created (dispatched by notificationService.send)
    window.addEventListener('notifications:refresh', fetchNotifications);
    return () => {
      clearInterval(interval);
      window.removeEventListener('notifications:refresh', fetchNotifications);
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }
    try {
      const res = await notificationService.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n));
      setUnreadCount(res.unread_count);
    } catch (error) {
      console.error('Failed to mark as read', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setLoading(true);
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read_at: new Date().toISOString() })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read', error);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type: string) => {
    if (type.includes('Message')) return <MessageSquare size={16} className="text-blue-500" />;
    if (type.includes('Article')) return <FileText size={16} className="text-purple-500" />;
    if (type.includes('Post')) return <Newspaper size={16} className="text-green-500" />;
    return <Info size={16} className="text-gray-500" />;
  };

  const getLink = (notification: Notification) => {
    const url = notification.data.action_url || notification.data.url;

    if (url) {
      return url;
    }

    // Fallbacks (no action_url stored)
    if (notification.type.includes('Message')) return '/dashboard/messages/inbox';
    if (notification.type.includes('Contact')) return '/dashboard/messages';
    if (notification.type.includes('Article')) return '/dashboard/articles';
    if (notification.type.includes('Post')) return '/dashboard/posts';

    return '/dashboard/notifications';
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors outline-none focus:ring-2 focus:ring-primary/20"
        aria-label="الإشعارات"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-background animate-pulse"></span>
        )}
      </button>

      {isOpen && (
        <div className="fixed left-2 right-2 top-[68px] md:absolute md:left-0 md:right-auto md:top-auto md:mt-2 md:w-96 bg-card border border-border rounded-xl shadow-xl z-[999] animate-in fade-in slide-in-from-top-2 overflow-hidden ring-1 ring-black/5">
          <div className="p-4 border-b border-border flex items-center justify-between bg-secondary/10">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-foreground">الإشعارات</h3>
              {unreadCount > 0 && (
                <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full font-medium">
                  {unreadCount} جديد
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button 
                onClick={handleMarkAllAsRead}
                disabled={loading}
                className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
              >
                <Check size={14} />
                تحديد الكل كمقروء
              </button>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground flex flex-col items-center">
                <div className="bg-secondary/50 p-4 rounded-full mb-3">
                  <Bell className="w-8 h-8 opacity-40" />
                </div>
                <p className="text-sm font-medium">لا توجد إشعارات جديدة</p>
                <p className="text-xs text-muted-foreground mt-1">سنخبرك عندما يصلك شيء جديد</p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {notifications.map((notification) => (
                  <Link 
                    href={getLink(notification)}
                    key={notification.id}
                    onClick={() => !notification.read_at && handleMarkAsRead(notification.id)}
                    className={`block p-4 hover:bg-secondary/40 transition-colors relative group ${!notification.read_at ? 'bg-primary/5' : ''}`}
                  >
                    <div className="flex gap-3 items-start">
                      <div className={`mt-1 w-8 h-8 rounded-full flex items-center justify-center bg-background border border-border shadow-sm flex-shrink-0`}>
                        {getIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 space-y-1 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                          <p className={`text-sm leading-none ${!notification.read_at ? 'font-semibold text-foreground' : 'font-medium text-muted-foreground'}`}>
                            {notification.data.title || 'إشعار جديد'}
                          </p>
                          <span className="text-[10px] text-muted-foreground whitespace-nowrap flex-shrink-0">
                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: ar })}
                          </span>
                        </div>
                        
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                          {notification.data.message || 'لا يوجد محتوى'}
                        </p>
                      </div>

                      {!notification.read_at && (
                         <div className="flex-shrink-0 self-center">
                           <button 
                             onClick={(e) => handleMarkAsRead(notification.id, e)}
                             className="w-2 h-2 rounded-full bg-primary block hover:scale-150 transition-transform"
                             title="تحديد كمقروء"
                           />
                         </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="p-2 border-t border-border bg-secondary/10">
            <Link 
              href="/dashboard/notifications" 
              className="flex items-center justify-center gap-2 w-full py-2 text-sm text-muted-foreground hover:text-primary hover:bg-background rounded-lg transition-colors"
              onClick={() => setIsOpen(false)}
            >
              عرض كل الإشعارات
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
