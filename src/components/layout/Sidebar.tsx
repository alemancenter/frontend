'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from '@/components/common/AppImage';
import { usePathname, useRouter } from 'next/navigation';
import { authService } from '@/lib/api/services/auth';
import { 
  LayoutDashboard, 
  BarChart3, 
  Users, 
  Settings, 
  Menu, 
  X, 
  LogOut,
  ChevronRight,
  ChevronDown,
  Newspaper,
  GraduationCap,
  Shield,
  Mail,
  Bell,
  Calendar,
  FileText,
  Map,
  FolderOpen,
  MessageSquare,
  Database
} from 'lucide-react';

interface MenuItem {
  title: string;
  icon: any;
  href?: string;
  permission?: string;
  children?: { title: string; href: string; permission?: string }[];
}

import { useSidebarStore, useSettingsStore, useAuthStore } from '@/store/useStore';

type SettingsBag = Record<string, string | null>;

export interface SidebarProps {
  initialSettings?: SettingsBag;
}

export default function Sidebar({ initialSettings }: SidebarProps) {
  const router = useRouter();
  const { isOpen, toggleSidebar, setSidebar } = useSidebarStore();
  const { user, logout } = useAuthStore();
  const { siteName, siteLogo } = useSettingsStore();
  const initialSiteName = (initialSettings?.site_name || (initialSettings as any)?.siteName || '').toString().trim();
  const displaySiteName = initialSiteName || (siteName || '').toString().trim();
  const initialSiteLogo = initialSettings?.site_logo ?? (initialSettings as any)?.siteLogo ?? null;
  const displaySiteLogo = initialSiteLogo ?? siteLogo;
  const [isMobile, setIsMobile] = useState(false);
  const [openSubmenus, setOpenSubmenus] = useState<string[]>([]);
  const pathname = usePathname();

  // Handle responsive check
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      // Only auto-close on mobile, keep desktop state persisted or default
      if (mobile) {
        setSidebar(false);
      }
    };

    // Initial check
    checkMobile();
    
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [setSidebar]);

  const handleToggle = () => toggleSidebar();

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      logout();
      router.push('/');
      router.refresh();
    }
  };

  const toggleSubmenu = (title: string) => {
    if (!isOpen && !isMobile) {
      setSidebar(true);
      setOpenSubmenus([title]);
    } else {
      setOpenSubmenus(prev => 
        prev.includes(title) 
          ? prev.filter(t => t !== title) 
          : [...prev, title]
      );
    }
  };

  const menuItems = useMemo(() => {
    const hasPermission = (permission?: string): boolean => {
      if (!permission) return true; // No permission required
      if (!user) return false;

      // Check for admin/super_admin role (case insensitive)
      const adminRoles = ['admin', 'super_admin', 'super-admin', 'manager', 'administrator', 'root'];
      const isAdmin = user.roles?.some(r => adminRoles.includes(r.name?.toLowerCase() || '')) ?? false;
      const isSuperAdmin = user.id === 1;

      if (isAdmin || isSuperAdmin) return true;

      // Permission aliases for backward compatibility
      const permissionAliases: Record<string, string[]> = {
        'manage users': ['users.view', 'admin users'],
      };

      // Check direct permission
      const hasDirectPermission = user.permissions?.some(p => p.name === permission) ?? false;
      if (hasDirectPermission) return true;

      // Check role-based permissions
      const hasRolePermission = user.roles?.some(role =>
        role.permissions?.some(p => p.name === permission)
      ) ?? false;
      if (hasRolePermission) return true;

      // Check aliases (direct and role-based)
      const aliases = permissionAliases[permission] || [];
      if (aliases.length === 0) return false;
      const hasAliasPermission = user.permissions?.some(p => aliases.includes(p.name)) ?? false;
      if (hasAliasPermission) return true;
      return user.roles?.some(role =>
        role.permissions?.some(p => aliases.includes(p.name))
      ) ?? false;
    };

    const items = [
      {
        title: 'لوحة التحكم',
        icon: LayoutDashboard,
        href: '/dashboard',
      },
      {
        title: 'المحتوى',
        icon: FileText,
        children: [
          { title: 'المقالات', href: '/dashboard/articles', permission: 'manage articles' },
        ],
      },
      {
        title: 'المنشورات العامة',
        icon: Newspaper,
        children: [
          { title: 'المنشورات', href: '/dashboard/posts', permission: 'manage posts' },
          { title: 'الفئات', href: '/dashboard/categories', permission: 'manage categories' },
        ],
      },
      {
        title: 'إدارة الملفات',
        icon: FolderOpen,
        children: [
          { title: 'الملفات', href: '/dashboard/files', permission: 'manage files' },
        ],
      },
      {
        title: 'التعليقات والتفاعلات',
        icon: MessageSquare,
        children: [
          { title: 'التعليقات', href: '/dashboard/comments', permission: 'manage comments' },
        ],
      },
      {
        title: 'التعليم',
        icon: GraduationCap,
        children: [
          { title: 'الصفوف الدراسية', href: '/dashboard/school-classes', permission: 'manage school classes' },
          { title: 'المواد', href: '/dashboard/subjects', permission: 'manage subjects' },
          { title: 'الفصول', href: '/dashboard/semesters', permission: 'manage semesters' },
        ],
      },
      {
        title: 'إدارة المستخدمين',
        icon: Users,
        children: [
          { title: 'المستخدمين', href: '/dashboard/users', permission: 'manage users' },
          { title: 'الأدوار', href: '/dashboard/roles', permission: 'manage roles' },
          { title: 'الصلاحيات', href: '/dashboard/permissions', permission: 'manage permissions' },
        ],
      },
      {
        title: 'الأمان والمراقبة',
        icon: Shield,
        children: [
          { title: 'نظام المراقبة', href: '/dashboard/monitor', permission: 'manage monitoring' },
          { title: 'سجلات الأمان', href: '/dashboard/security/logs', permission: 'manage security' },
          { title: 'عناوين IP المحظورة', href: '/dashboard/security/blocked-ips', permission: 'manage security' },
          { title: 'فحص المحتوى', href: '/dashboard/content-audit', permission: 'manage content audit' },
        ],
      },
      {
        title: 'التحليلات',
        icon: BarChart3,
        href: '/dashboard/analytics',
        permission: 'manage monitoring',
      },
      {
        title: 'الرسائل',
        icon: Mail,
        href: '/dashboard/messages',
        permission: 'manage messages',
      },
      {
        title: 'الإشعارات',
        icon: Bell,
        href: '/dashboard/notifications',
        permission: 'manage notifications',
      },
      {
        title: 'التقويم',
        icon: Calendar,
        href: '/dashboard/calendar',
        permission: 'manage calendar',
      },
      {
        title: 'خريطة الموقع',
        icon: Map,
        href: '/dashboard/sitemap',
        permission: 'manage sitemap',
      },
      {
        title: 'إدارة النظام',
        icon: Database,
        children: [
          { title: 'Redis Cache', href: '/dashboard/redis', permission: 'manage settings' },
          { title: 'أداء النظام', href: '/dashboard/performance', permission: 'manage settings' },
        ],
      },
      {
        title: 'الإعدادات',
        icon: Settings,
        href: '/dashboard/settings',
        permission: 'manage settings',
      },
    ];

    return items.reduce<MenuItem[]>((acc, item) => {
      // Check item permission
      if (item.permission && !hasPermission(item.permission)) {
        return acc;
      }

      // Check children permissions
      if (item.children) {
        const filteredChildren = item.children.filter(child => 
          !child.permission || hasPermission(child.permission)
        );
        
        if (filteredChildren.length > 0) {
          acc.push({ 
            title: item.title,
            icon: item.icon,
            href: item.href,
            children: filteredChildren 
          });
        }
      } else {
        acc.push({
            title: item.title,
            icon: item.icon,
            href: item.href,
        });
      }
      return acc;
    }, []);
  }, [user]);

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setSidebar(false)}
        />
      )}

      {/* Mobile Toggle Button */}
      <button
        onClick={handleToggle}
        className="lg:hidden fixed top-4 right-4 z-50 p-2 bg-primary text-primary-foreground rounded-lg shadow-lg hover:bg-primary/90 transition-colors"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 right-0 h-screen bg-card border-l border-border transition-all duration-300 ease-in-out z-50 flex flex-col
          ${isOpen ? 'w-72 translate-x-0' : 'w-72 translate-x-full lg:translate-x-0 lg:w-20'}
        `}
      >
        {/* Logo Section */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-border shrink-0">
          <div className={`flex items-center gap-3 transition-opacity duration-200 ${!isOpen && !isMobile ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}`}>
            {displaySiteLogo ? (
              <div className="relative h-10 w-auto min-w-[2.5rem] flex items-center">
                <Image
                  src={`/storage/${displaySiteLogo}`}
                  alt={displaySiteName || 'Logo'}
                  width={40}
                  height={40}
                  sizes="40px"
                  className="h-full w-auto object-contain"
                  style={{ width: 'auto', height: '100%' }}
                />
              </div>
            ) : (
              <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold text-xl shadow-sm">
                {displaySiteName ? displaySiteName.charAt(0).toUpperCase() : 'R'}
              </div>
            )}
            <Link href="/" className="text-lg font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent whitespace-nowrap hover:opacity-80 transition-opacity">
              {displaySiteName}
            </Link>
          </div>
          
          {/* Desktop Toggle Button */}
          {!isMobile && (
            <button 
              onClick={handleToggle}
              className={`p-1.5 hover:bg-secondary rounded-lg text-muted-foreground transition-all duration-200 ${!isOpen ? 'mx-auto' : ''}`}
            >
              {isOpen ? <ChevronRight size={20} /> : <Menu size={24} />}
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1 overflow-y-auto flex-1 custom-scrollbar">
          {menuItems.map((item, index) => {
            const isActive = item.href ? pathname === item.href : false;
            const isSubmenuOpen = openSubmenus.includes(item.title);
            const hasChildren = item.children && item.children.length > 0;
            const isChildActive = item.children?.some(child => pathname === child.href);
            const Icon = item.icon;

            return (
              <div key={index} className="space-y-1">
                {hasChildren ? (
                  // Parent Item with Submenu
                  <button
                    onClick={() => toggleSubmenu(item.title)}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative
                      ${(isActive || isChildActive)
                        ? 'bg-primary/10 text-primary' 
                        : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                      }
                      ${!isOpen && !isMobile ? 'justify-center' : ''}
                    `}
                  >
                    <Icon size={22} className={`flex-shrink-0 ${(isActive || isChildActive) ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'}`} />
                    
                    <span className={`whitespace-nowrap flex-1 text-right transition-all duration-300 ${(!isOpen && !isMobile) ? 'opacity-0 w-0 hidden' : 'opacity-100'}`}>
                      {item.title}
                    </span>

                    {isOpen && (
                      <ChevronDown 
                        size={16} 
                        className={`transition-transform duration-200 ${isSubmenuOpen ? 'rotate-180' : ''}`}
                      />
                    )}

                    {/* Tooltip for collapsed state */}
                    {!isOpen && !isMobile && (
                      <div className="absolute right-full mr-2 px-2 py-1 bg-popover text-popover-foreground text-sm rounded-md shadow-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                        {item.title}
                      </div>
                    )}
                  </button>
                ) : (
                  // Standard Link Item
                  <Link
                    href={item.href!}
                    className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative
                      ${isActive 
                        ? 'bg-primary text-primary-foreground shadow-md' 
                        : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                      }
                      ${!isOpen && !isMobile ? 'justify-center' : ''}
                    `}
                  >
                    <Icon size={22} className={`flex-shrink-0 ${isActive ? 'text-white' : 'text-muted-foreground group-hover:text-primary'}`} />
                    
                    <span className={`whitespace-nowrap transition-all duration-300 ${(!isOpen && !isMobile) ? 'opacity-0 w-0 hidden' : 'opacity-100'}`}>
                      {item.title}
                    </span>

                    {/* Tooltip for collapsed state */}
                    {!isOpen && !isMobile && (
                      <div className="absolute right-full mr-2 px-2 py-1 bg-popover text-popover-foreground text-sm rounded-md shadow-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                        {item.title}
                      </div>
                    )}
                  </Link>
                )}

                {/* Submenu Items */}
                {hasChildren && isSubmenuOpen && isOpen && (
                  <div className="pr-9 space-y-1 animate-accordion-down overflow-hidden">
                    {item.children!.map((child, childIndex) => {
                      const isChildItemActive = pathname === child.href;
                      return (
                        <Link
                          key={childIndex}
                          href={child.href}
                          className={`block py-2 px-3 text-sm rounded-lg transition-colors
                            ${isChildItemActive 
                              ? 'text-primary bg-primary/5 font-medium' 
                              : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                            }
                          `}
                        >
                          {child.title}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer Section */}
        <div className="p-4 border-t border-border bg-card/50 backdrop-blur-sm shrink-0">
          <button 
            onClick={handleLogout}
            className={`flex items-center gap-3 w-full px-3 py-3 rounded-xl text-destructive hover:bg-destructive/10 transition-colors
            ${(!isOpen && !isMobile) ? 'justify-center' : ''}
          `}>
            <LogOut size={22} />
            <span className={`whitespace-nowrap transition-all duration-300 ${(!isOpen && !isMobile) ? 'opacity-0 w-0 hidden' : 'opacity-100'}`}>
              تسجيل خروج
            </span>
            
            {!isOpen && !isMobile && (
              <div className="absolute right-full mr-2 px-2 py-1 bg-popover text-popover-foreground text-sm rounded-md shadow-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                تسجيل خروج
              </div>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
