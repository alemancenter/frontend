'use client';

import { useState, useEffect, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogIn, UserCircle, ChevronDown, Check, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/useStore';
import { authService } from '@/lib/api/services/auth';

const COUNTRIES = [
  { value: 'الأردن', label: 'الأردن' },
  { value: 'السعودية', label: 'السعودية' },
  { value: 'مصر', label: 'مصر' },
  { value: 'فلسطين', label: 'فلسطين' },
  { value: 'الكويت', label: 'الكويت' },
  { value: 'الإمارات', label: 'الإمارات' },
  { value: 'البحرين', label: 'البحرين' },
  { value: 'قطر', label: 'قطر' },
  { value: 'سلطنة عُمان', label: 'سلطنة عُمان' },
  { value: 'العراق', label: 'العراق' },
  { value: 'سوريا', label: 'سوريا' },
  { value: 'لبنان', label: 'لبنان' },
  { value: 'اليمن', label: 'اليمن' },
  { value: 'ليبيا', label: 'ليبيا' },
  { value: 'تونس', label: 'تونس' },
  { value: 'الجزائر', label: 'الجزائر' },
  { value: 'المغرب', label: 'المغرب' },
  { value: 'موريتانيا', label: 'موريتانيا' },
  { value: 'السودان', label: 'السودان' },
];

interface ContentGateProps {
  children: ReactNode;
}

export default function ContentGate({ children }: ContentGateProps) {
  const { isAuthenticated, user, login } = useAuthStore();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  // Profile form state
  const [country, setCountry] = useState('');
  const [gender, setGender] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  const isProfileComplete = !!(user?.country && user?.gender);

  // Before hydration: render children without any gate (matches SSR output for crawlers)
  if (!mounted) {
    return <>{children}</>;
  }

  const needsLogin = !isAuthenticated;
  const needsProfile = isAuthenticated && !isProfileComplete;

  const handleSaveProfile = async () => {
    if (!country || !gender) {
      setError('يرجى اختيار الدولة والجنس');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const updated = await authService.updateProfile({ country, gender });
      login({ ...user!, ...updated });
    } catch {
      setError('حدث خطأ، يرجى المحاولة مرة أخرى');
    } finally {
      setSaving(false);
    }
  };

  const loginHref = `/login?return=${encodeURIComponent(pathname)}`;

  return (
    <div className="relative">
      {/* Content preview — always fully visible for crawlers and AdSense compliance */}
      <div className={needsLogin || needsProfile ? 'pointer-events-none select-none' : undefined}>
        {children}
      </div>

      {/* Gradient fade over the bottom of the preview */}
      {(needsLogin || needsProfile) && (
        <div
          className="absolute bottom-0 left-0 right-0 h-64 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, transparent, var(--background, #fff) 80%)' }}
        />
      )}

      {/* ── Login required overlay ── */}
      {needsLogin && (
        <div className="flex items-center justify-center py-8 z-10 relative">
          <div className="bg-card border border-border rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center">
            <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <LogIn className="w-7 h-7 text-primary" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">تسجيل الدخول مطلوب</h3>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              يجب تسجيل الدخول لعرض محتوى هذه الصفحة
            </p>
            <div className="flex flex-col gap-3">
              <Link
                href={loginHref}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors"
              >
                <LogIn className="w-4 h-4" />
                تسجيل الدخول
              </Link>
              <Link
                href={`/register?return=${encodeURIComponent(pathname)}`}
                className="w-full inline-flex items-center justify-center px-6 py-3 border border-border text-foreground rounded-xl font-medium text-sm hover:bg-secondary/50 transition-colors"
              >
                إنشاء حساب جديد
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── Profile completion overlay ── */}
      {needsProfile && (
        <div className="flex items-center justify-center py-8 z-10 relative">
          <div className="bg-card border border-border rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4">
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserCircle className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">أكمل بياناتك الشخصية</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                يرجى تحديد دولتك وجنسك للمتابعة في عرض المحتوى
              </p>
            </div>

            <div className="space-y-4">
              {/* Country select */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  الدولة <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full appearance-none bg-background border border-border rounded-xl px-4 py-3 pr-10 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                  >
                    <option value="">اختر الدولة</option>
                    {COUNTRIES.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              {/* Gender select */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  الجنس <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setGender('male')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-medium transition-colors ${
                      gender === 'male'
                        ? 'bg-primary/10 border-primary text-primary'
                        : 'bg-background border-border text-foreground hover:bg-secondary/50'
                    }`}
                  >
                    {gender === 'male' && <Check className="w-4 h-4" />}
                    ذكر
                  </button>
                  <button
                    type="button"
                    onClick={() => setGender('female')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-medium transition-colors ${
                      gender === 'female'
                        ? 'bg-primary/10 border-primary text-primary'
                        : 'bg-background border-border text-foreground hover:bg-secondary/50'
                    }`}
                  >
                    {gender === 'female' && <Check className="w-4 h-4" />}
                    أنثى
                  </button>
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-500 text-center">{error}</p>
              )}

              <button
                onClick={handleSaveProfile}
                disabled={saving || !country || !gender}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> جاري الحفظ...</>
                ) : (
                  'حفظ وعرض المحتوى'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
