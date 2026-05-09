'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from '@/components/common/AppImage';
import { 
  Search, 
  User, 
  ChevronDown, 
  LogOut, 
  Settings, 
  Home,
  BookOpen,
  FileText,
  Newspaper,
  Users,
  MessageSquare
} from 'lucide-react';
import { useAuthStore, useSettingsStore } from '@/store/useStore';
import { authService } from '@/lib/api/services/auth';
import NotificationsDropdown from './NotificationsDropdown';
import { getStorageUrl } from '@/lib/utils';
import { useUserRefresh } from '@/hooks/useUserRefresh';

export default function UnifiedHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout: storeLogout } = useAuthStore();
  const { siteName, siteLogo } = useSettingsStore();
  const resolvedSiteName = siteName?.trim() || '';
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const avatarSrc = getStorageUrl(user?.profile_photo_url || user?.profile_photo_path);

  useUserRefresh();

  useEffect(() => {
    setAvatarError(false);
  }, [avatarSrc]);

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout failed', error);
    } finally {
      storeLogout();
      router.push('/');
      router.refresh();
    }
  };

  const navigationItems = [
    { href: '/', label: 'الرئيسية', icon: Home },
    { href: '/articles', label: 'المقالات', icon: BookOpen },
    { href: '/posts', label: 'المنشورات', icon: FileText },
    { href: '/news', label: 'الأخبار', icon: Newspaper },
    { href: '/members', label: 'الأعضاء', icon: Users },
    { href: '/contact', label: 'اتصل بنا', icon: MessageSquare },
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-xl border-b border-gray-200 shadow-sm transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo and Mobile Menu Button */}
          <div className="flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2 rtl:space-x-reverse">
              <div className="w-8 h-8 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                {siteLogo ? (
                  <Image src={`/storage/${siteLogo}`} alt="Logo" width={24} height={24} className="w-6 h-6 object-contain" />
                ) : (
                  <span className="text-white font-bold text-sm">{resolvedSiteName ? resolvedSiteName.charAt(0).toUpperCase() : 'R'}</span>
                )}
              </div>
              <span className="text-xl font-bold text-gray-900 hidden sm:block">
                {resolvedSiteName}
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1 rtl:space-x-reverse">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    active
                      ? 'text-blue-600 bg-blue-50 border border-blue-100'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon size={18} className="ml-2" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            
            {/* Search Bar */}
            <div className="hidden lg:block">
              <div className="relative group">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 group-focus-within:text-blue-600 transition-colors" />
                <input 
                  type="text" 
                  placeholder="ابحث في الموقع..." 
                  className="w-64 h-10 pr-10 pl-4 rounded-full bg-gray-100 border-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all text-sm outline-none"
                />
              </div>
            </div>

            {/* Notifications */}
            <NotificationsDropdown />

            {/* User Profile */}
            <div className="relative">
              <button 
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-3 pl-2 pr-4 py-1.5 rounded-full hover:bg-gray-100 border border-transparent hover:border-gray-200 transition-all cursor-pointer"
              >
                <div
                  className={`w-8 h-8 rounded-full overflow-hidden flex items-center justify-center text-white font-bold text-sm shadow-md ${
                    avatarSrc && !avatarError ? 'bg-gray-200' : 'bg-gradient-to-tr from-blue-600 to-purple-600'
                  }`}
                >
                  {avatarSrc && !avatarError ? (
                    <Image
                      src={avatarSrc}
                      alt={user?.name || 'User'}
                      width={32}
                      height={32}
                      className="w-8 h-8 object-cover"
                      onError={() => setAvatarError(true)}
                      unoptimized={avatarSrc.includes('127.0.0.1') || avatarSrc.includes('localhost')}
                    />
                  ) : (
                    <span>{user?.name?.[0]?.toUpperCase() || 'U'}</span>
                  )}
                </div>
                <div className="hidden md:block text-right">
                  <p className="text-sm font-semibold text-gray-900 leading-none">{user?.name || 'مستخدم'}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{user?.roles?.[0]?.name || 'مستخدم'}</p>
                </div>
                <ChevronDown size={16} className={`text-gray-400 hidden md:block transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {isUserMenuOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsUserMenuOpen(false)}
                  />
                  <div className="absolute top-full left-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-lg py-2 z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="px-4 py-2 border-b border-gray-200 mb-2 md:hidden">
                      <p className="text-sm font-semibold text-gray-900">{user?.name || 'مستخدم'}</p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                    </div>
                    
                    <Link 
                      href="/dashboard/profile" 
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <User size={16} />
                      الملف الشخصي
                    </Link>
                    
                    <Link 
                      href="/dashboard/settings" 
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <Settings size={16} />
                      الإعدادات
                    </Link>

                    <div className="h-px bg-gray-200 my-2" />
                    
                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut size={16} />
                      تسجيل الخروج
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 mt-2 pt-4 pb-4">
            <nav className="grid grid-cols-2 gap-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      active
                        ? 'text-blue-600 bg-blue-50 border border-blue-100'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Icon size={18} className="ml-2" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            
            {/* Mobile Search */}
            <div className="mt-4 px-3">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input 
                  type="text" 
                  placeholder="ابحث في الموقع..." 
                  className="w-full h-10 pr-10 pl-4 rounded-full bg-gray-100 border-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white text-sm outline-none"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
