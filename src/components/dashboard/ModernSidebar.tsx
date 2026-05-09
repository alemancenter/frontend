'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  Settings,
  HelpCircle,
  LogOut,
  User,
  MessageSquare,
  Calendar,
  BarChart3,
  FileText,
  Home,
  Users,
  Package,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
} from 'lucide-react';
import { useThemeStore, useAuthStore } from '@/store/useStore';
import Button from '@/components/ui/Button';

interface SidebarItem {
  icon: React.ComponentType<any>;
  label: string;
  href: string;
  badge?: number;
  children?: SidebarItem[];
}

interface ModernSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  currentPath: string;
}

const mainItems: SidebarItem[] = [
  { icon: Home, label: 'الرئيسية', href: '/dashboard' },
  { icon: BarChart3, label: 'الإحصائيات', href: '/dashboard/analytics' },
  { icon: Users, label: 'المستخدمين', href: '/dashboard/users', badge: 3 },
  { icon: Package, label: 'المنتجات', href: '/dashboard/products' },
  { icon: FileText, label: 'الطلبات', href: '/dashboard/orders', badge: 12 },
  { icon: CreditCard, label: 'المدفوعات', href: '/dashboard/payments' },
  { icon: Calendar, label: 'التقويم', href: '/dashboard/calendar' },
];

const secondaryItems: SidebarItem[] = [
  { icon: MessageSquare, label: 'الرسائل', href: '/dashboard/messages', badge: 5 },
  { icon: Bell, label: 'الإشعارات', href: '/dashboard/notifications', badge: 8 },
  { icon: Settings, label: 'الإعدادات', href: '/dashboard/settings' },
  { icon: HelpCircle, label: 'المساعدة', href: '/dashboard/help' },
];

export default function ModernSidebar({ isOpen, onToggle, currentPath }: ModernSidebarProps) {
  const { isDarkMode, toggleDarkMode } = useThemeStore();
  const { user, logout } = useAuthStore();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleItem = (label: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(label)) {
      newExpanded.delete(label);
    } else {
      newExpanded.add(label);
    }
    setExpandedItems(newExpanded);
  };

  const renderSidebarItem = (item: SidebarItem, level = 0) => {
    const isActive = currentPath === item.href;
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.has(item.label);

    return (
      <div key={item.href}>
        <motion.div
          whileHover={{ x: 4 }}
          transition={{ duration: 0.2 }}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer group ${
            isActive
              ? 'bg-primary text-white shadow-lg'
              : 'text-foreground/80 hover:bg-muted hover:text-foreground'
          }`}
          style={{ paddingLeft: `${level * 20 + 16}px` }}
          onClick={() => hasChildren ? toggleItem(item.label) : null}
        >
          <item.icon className="w-5 h-5 flex-shrink-0" />
          
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-center justify-between flex-1 min-w-0"
              >
                <span className="text-sm font-medium truncate">{item.label}</span>
                
                <div className="flex items-center gap-2">
                  {item.badge && (
                    <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                      isActive 
                        ? 'bg-white/20 text-white' 
                        : 'bg-primary/10 text-primary'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                  
                  {hasChildren && (
                    <motion.div
                      animate={{ rotate: isExpanded ? 90 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Children */}
        <AnimatePresence>
          {hasChildren && isExpanded && isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              {item.children!.map((child) => renderSidebarItem(child, level + 1))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ width: isOpen ? 280 : 80 }}
      animate={{ width: isOpen ? 280 : 80 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="dashboard-sidebar-modern relative"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-3"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-lg">لوحة التحكم</h2>
                <p className="text-sm text-muted-foreground">الإصدار 2.0</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="p-2 rounded-lg hover:bg-muted"
        >
          {isOpen ? (
            <ChevronLeft className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="space-y-1 mb-8">
        {mainItems.map((item) => renderSidebarItem(item))}
      </nav>

      <div className="mb-8">
        <div className="px-4 mb-3">
          <AnimatePresence>
            {isOpen && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-xs font-medium text-muted-foreground uppercase tracking-wide"
              >
                أخرى
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        
        <nav className="space-y-1">
          {secondaryItems.map((item) => renderSidebarItem(item))}
        </nav>
      </div>

      {/* User Section */}
      <div className="mt-auto pt-6 border-t border-border/20">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-secondary to-warning rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex-1 min-w-0"
              >
                <p className="font-medium text-sm truncate">{user?.name || 'مستخدم'}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.email || 'user@example.com'}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleDarkMode}
            className="flex-1"
          >
            {isDarkMode ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
            <AnimatePresence>
              {isOpen && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-xs"
                >
                  {isDarkMode ? 'فاتح' : 'مظلم'}
                </motion.span>
              )}
            </AnimatePresence>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="flex-1 text-error hover:bg-error/10"
          >
            <LogOut className="w-4 h-4" />
            <AnimatePresence>
              {isOpen && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-xs"
                >
                  خروج
                </motion.span>
              )}
            </AnimatePresence>
          </Button>
        </div>
      </div>

      {/* Toggle Handle */}
      <div
        className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-12 bg-card border border-border rounded-lg cursor-pointer flex items-center justify-center hover:bg-muted transition-colors"
        onClick={onToggle}
      >
        {isOpen ? (
          <ChevronLeft className="w-4 h-4" />
        ) : (
          <ChevronRight className="w-4 h-4" />
        )}
      </div>
    </motion.div>
  );
}