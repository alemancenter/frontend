'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Image from '@/components/common/AppImage';
import { motion, AnimatePresence } from '@/lib/motion-lite';
import {
  Menu,
  X,
  Sun,
  Moon,
  ChevronDown,
  User,
  LogOut,
  LayoutDashboard,
  Settings,
  Phone,
  Info,
  Home,
} from 'lucide-react';
import { useThemeStore, useAuthStore, useSettingsStore } from '@/store/useStore';
import { cn, getStorageUrl } from '@/lib/utils';
import Button from '@/components/ui/Button';
import CountrySelector from './CountrySelector';
import NotificationsDropdown from '@/components/layout/NotificationsDropdown';
import { authService } from '@/lib/api/services/auth';
import { useUserRefresh } from '@/hooks/useUserRefresh';

const navItems = [
  { title: 'الرئيسية', href: '/', icon: <Home className="w-4 h-4" /> },
  { title: 'من نحن', href: '/about-us', icon: <Info className="w-4 h-4" /> },
  { title: 'الخدمات', href: '/services', icon: <Settings className="w-4 h-4" /> },
  { title: 'اتصل بنا', href: '/contact', icon: <Phone className="w-4 h-4" /> },
];

type InitialSettings = Record<string, string | null> & {
  siteName?: string | null;
  siteLogo?: string | null;
};

export default function Navbar({ initialSettings }: { initialSettings?: InitialSettings }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const { isDarkMode, toggleDarkMode } = useThemeStore();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { siteName, siteLogo } = useSettingsStore();
  const userMenuRef = useRef<HTMLDivElement>(null);
  const [avatarError, setAvatarError] = useState(false);
  const avatarSrc = getStorageUrl(user?.profile_photo_url || user?.profile_photo_path);

  useUserRefresh();

  const initialSiteName = (initialSettings?.site_name || initialSettings?.siteName || '').toString().trim();
  const displaySiteName = initialSiteName || (siteName || '').toString().trim();
  const initialSiteLogo = initialSettings?.site_logo ?? initialSettings?.siteLogo ?? null;
  const displaySiteLogo = initialSiteLogo ?? siteLogo;

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
 
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
    setIsUserMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setIsOpen(false);
      setIsUserMenuOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (!isUserMenuOpen) return;
      const target = event.target as Node | null;
      if (!target) return;
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, [isUserMenuOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    setAvatarError(false);
  }, [avatarSrc]);

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch {
    } finally {
      logout();
      router.push('/');
      router.refresh();
      setIsUserMenuOpen(false);
    }
  };

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        isScrolled
          ? 'bg-background/90 backdrop-blur-xl shadow-lg border-b border-border'
          : 'bg-background/60 backdrop-blur-xl border-b border-transparent'
      )}
    >
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="التنقل الرئيسي">
        <div className="flex h-16 items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-4 group">
            {displaySiteLogo ? (
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative h-14 w-auto flex items-center"
              >
                <Image
                  src={`/storage/${displaySiteLogo}`}
                  alt={displaySiteName || 'Logo'}
                  width={56}
                  height={56}
                  sizes="56px"
                  className="h-full w-auto object-contain drop-shadow-sm"
                  style={{ width: 'auto', height: '100%' }}
                />
              </motion.div>
            ) : (
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary via-purple-600 to-indigo-600 shadow-lg flex items-center justify-center relative overflow-hidden group-hover:shadow-xl transition-all"
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  animate={{ x: [-100, 100] }}
                  transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                />
                <span className="text-white font-bold text-2xl relative z-10">
                  {displaySiteName ? displaySiteName.charAt(0).toUpperCase() : 'R'}
                </span>
              </motion.div>
            )}
            
            <div className="flex flex-col justify-center">
              <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight leading-none group-hover:text-primary transition-colors duration-300">
                {displaySiteName}
              </h1>
              <span className="text-xs sm:text-sm text-muted-foreground font-medium mt-1">
                بوابة المستقبل التعليمية
              </span>
            </div>
          </Link>

          <div className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'relative flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-xl transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary/30',
                  isActive(item.href)
                    ? 'text-primary bg-primary/10'
                    : 'text-foreground/90 hover:text-foreground hover:bg-muted/60'
                )}
              >
                <span className={cn('transition-colors', isActive(item.href) ? 'text-primary' : 'text-muted-foreground')}>
                  {item.icon}
                </span>
                {item.title}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-2">
            <CountrySelector />

            {mounted && isAuthenticated && (
              <NotificationsDropdown />
            )}

            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-xl hover:bg-muted/60 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              aria-label="Toggle dark mode"
            >
              <AnimatePresence mode="wait">
                {isDarkMode ? (
                  <motion.div
                    key="sun"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                  >
                    <Sun className="w-5 h-5 text-warning" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="moon"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                  >
                    <Moon className="w-5 h-5 text-secondary" />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
            
            {mounted && isAuthenticated && user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 p-1 pr-3 rounded-full border border-border/60 hover:bg-muted/60 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                  aria-haspopup="menu"
                  aria-expanded={isUserMenuOpen}
                >
                  <div
                    className={`w-8 h-8 rounded-full overflow-hidden flex items-center justify-center text-white font-medium ${
                      avatarSrc && !avatarError ? 'bg-muted' : 'bg-gradient-to-tr from-primary to-secondary'
                    }`}
                  >
                    {avatarSrc && !avatarError ? (
                      <Image
                        src={avatarSrc}
                        alt={user.name}
                        width={32}
                        height={32}
                        className="w-8 h-8 object-cover"
                        onError={() => setAvatarError(true)}
                        unoptimized={avatarSrc.includes('127.0.0.1') || avatarSrc.includes('localhost')}
                      />
                    ) : (
                      <span>{user.name.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <span className="text-sm font-medium max-w-[100px] truncate hidden lg:block">
                    {user.name}
                  </span>
                  <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", isUserMenuOpen && "rotate-180")} />
                </button>

                <AnimatePresence>
                  {isUserMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute left-0 mt-2 w-64 bg-card rounded-2xl shadow-xl border border-border/60 py-2 overflow-hidden"
                      role="menu"
                    >
                      <div className="px-4 py-3 border-b border-border">
                        <p className="text-sm font-medium">{user.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                      
                      <div className="p-1">
                        <Link 
                          href="/dashboard" 
                          className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors"
                          onClick={() => setIsUserMenuOpen(false)}
                          role="menuitem"
                        >
                          <LayoutDashboard className="w-4 h-4" />
                          لوحة التحكم
                        </Link>
                        <Link 
                          href="/dashboard/profile" 
                          className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors"
                          onClick={() => setIsUserMenuOpen(false)}
                          role="menuitem"
                        >
                          <User className="w-4 h-4" />
                          الملف الشخصي
                        </Link>
                      </div>
                      
                      <div className="border-t border-border p-1 mt-1">
                        <button
                          onClick={handleLogout}
                          className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-500 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors"
                          role="menuitem"
                        >
                          <LogOut className="w-4 h-4" />
                          تسجيل الخروج
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button size="sm" className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all">
                    دخول / تسجيل
                  </Button>
                </Link>
              </div>
            )}
          </div>

          <div className="flex md:hidden items-center gap-1.5">
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-xl hover:bg-muted/60 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? (
                <Sun className="w-5 h-5 text-warning" />
              ) : (
                <Moon className="w-5 h-5 text-secondary" />
              )}
            </button>

            {mounted && isAuthenticated && (
              <NotificationsDropdown />
            )}

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-xl hover:bg-muted/60 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              aria-label={isOpen ? 'إغلاق القائمة' : 'فتح القائمة'}
              aria-expanded={isOpen}
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {isOpen && (
            <>
              <motion.button
                type="button"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsOpen(false)}
                className="fixed inset-0 z-40 bg-black/40 md:hidden"
                aria-label="إغلاق القائمة"
              />
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="fixed top-16 left-0 right-0 z-50 md:hidden"
              >
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-5">
                  <div className="rounded-2xl border border-border/60 bg-card/95 backdrop-blur-xl shadow-xl overflow-hidden">
                    <div className="p-3">
                      <CountrySelector />
                    </div>

                    <div className="h-px bg-border/60" />

                    <div className="p-2">
                      <div className="flex flex-col gap-1">
                        {navItems.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setIsOpen(false)}
                            className={cn(
                              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary/30',
                              isActive(item.href)
                                ? 'bg-primary/10 text-primary'
                                : 'hover:bg-muted/60 text-foreground'
                            )}
                          >
                            <span className={cn(isActive(item.href) ? 'text-primary' : 'text-muted-foreground')}>{item.icon}</span>
                            {item.title}
                          </Link>
                        ))}
                      </div>
                    </div>

                    <div className="h-px bg-border/60" />

                    <div className="p-3">
                      {mounted && isAuthenticated && user ? (
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-3 px-1 py-1">
                            <div
                              className={`w-10 h-10 rounded-full overflow-hidden flex items-center justify-center text-white font-medium ${
                                avatarSrc && !avatarError ? 'bg-muted' : 'bg-gradient-to-tr from-primary to-secondary'
                              }`}
                            >
                              {avatarSrc && !avatarError ? (
                                <Image
                                  src={avatarSrc}
                                  alt={user.name}
                                  width={40}
                                  height={40}
                                  className="w-10 h-10 object-cover"
                                  onError={() => setAvatarError(true)}
                                  unoptimized={avatarSrc.includes('127.0.0.1') || avatarSrc.includes('localhost')}
                                />
                              ) : (
                                <span>{user.name.charAt(0).toUpperCase()}</span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="font-medium truncate">{user.name}</div>
                              <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                            </div>
                          </div>

                          <Link href="/dashboard" onClick={() => setIsOpen(false)}>
                            <Button variant="outline" className="w-full justify-start gap-2">
                              <LayoutDashboard className="w-4 h-4" />
                              لوحة التحكم
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            className="w-full justify-start gap-2 text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={handleLogout}
                          >
                            <LogOut className="w-4 h-4" />
                            تسجيل الخروج
                          </Button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <Link href="/login" className="flex-1" onClick={() => setIsOpen(false)}>
                            <Button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white">
                              دخول / تسجيل
                            </Button>
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </nav>
    </motion.header>
  );
}

