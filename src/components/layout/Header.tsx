'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, User, ChevronDown, LogOut, Settings } from 'lucide-react';
import { useAuthStore } from '@/store/useStore';
import { authService } from '@/lib/api/services/auth';
import NotificationsDropdown from './NotificationsDropdown';
import AppImage from '@/components/common/AppImage';
import { getStorageUrl } from '@/lib/utils';

export default function Header() {
  const router = useRouter();
  const { user, logout: storeLogout } = useAuthStore();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const avatarSrc = getStorageUrl(user?.profile_photo_url || user?.profile_photo_path);

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

  return (
    <header className="sticky top-0 z-30 w-full h-16 bg-background/80 backdrop-blur-xl border-b border-border transition-all duration-300">
      <div className="h-full px-6 flex items-center justify-between gap-4">
        
        {/* Search Bar */}
        <div className="flex-1 max-w-xl hidden md:block">
          <div className="relative group">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4 group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              name="search"
              id="dashboard-search"
              placeholder="بحث في لوحة التحكم..." 
              className="w-full h-10 pr-10 pl-4 rounded-full bg-secondary/50 border-none focus:ring-2 focus:ring-primary/20 focus:bg-background transition-all text-sm outline-none"
            />
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-4 mr-auto">
          {/* Notifications */}
          <NotificationsDropdown />

          {/* User Profile */}
          <div className="relative">
            <button 
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-3 pl-2 pr-4 py-1.5 rounded-full hover:bg-secondary/50 border border-transparent hover:border-border transition-all cursor-pointer"
            >
              <div
                className={`w-8 h-8 rounded-full overflow-hidden flex items-center justify-center text-white font-bold text-sm shadow-md ${
                  avatarSrc && !avatarError ? 'bg-muted' : 'bg-gradient-to-tr from-primary to-purple-500'
                }`}
              >
                {avatarSrc && !avatarError ? (
                  <AppImage
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
                <p className="text-sm font-semibold text-foreground leading-none">{user?.name || 'مستخدم'}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{user?.roles?.[0]?.name || 'مستخدم'}</p>
              </div>
              <ChevronDown size={16} className={`text-muted-foreground hidden md:block transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isUserMenuOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setIsUserMenuOpen(false)}
                />
                <div className="absolute top-full left-0 mt-2 w-56 bg-card border border-border rounded-xl shadow-lg py-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-4 py-2 border-b border-border mb-2 md:hidden">
                    <p className="text-sm font-semibold text-foreground">{user?.name || 'مستخدم'}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                  
                  <Link 
                    href="/dashboard/profile" 
                    className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-secondary transition-colors"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    <User size={16} />
                    الملف الشخصي
                  </Link>
                  
                  <Link 
                    href="/dashboard/settings" 
                    className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-secondary transition-colors"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    <Settings size={16} />
                    الإعدادات
                  </Link>

                  <div className="h-px bg-border my-2" />
                  
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
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
    </header>
  );
}
