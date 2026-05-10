'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from '@/lib/motion-lite';
import { Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useAuthStore } from '@/store/useStore';
import { authService } from '@/lib/api/services';
import { API_CONFIG } from '@/lib/api/config';

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[400px] flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [serverError, setServerError] = useState<string>('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    remember: false,
  });
  const justReset = searchParams.get('reset') === '1';
  const googleError = searchParams.get('error') === 'google_auth_failed';

  useEffect(() => {
    const ret = searchParams.get('return');
    if (!ret) return;
    if (ret === '/login' || ret.startsWith('/login?') || ret.startsWith('/login/')) {
      router.replace('/login');
    }
  }, [router, searchParams]);

  // Handle Google login
  const handleGoogleLogin = () => {
    setIsGoogleLoading(true);
    setServerError('');
    // Redirect to backend Google OAuth endpoint
    const googleAuthUrl = `${API_CONFIG.BASE_URL}/auth/google/redirect`;
    window.location.href = googleAuthUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setServerError('');
    try {
      const res = await authService.login({
        email: formData.email,
        password: formData.password,
      });
      const resolvedUser = await authService.me().catch(() => res.user);
      if (!resolvedUser) throw new Error('فشل تحميل بيانات المستخدم');
      login(resolvedUser);

      // Clear security violation flags on successful login
      localStorage.removeItem('security_violation_attempts');
      localStorage.removeItem('security_banned');

      // Check if email is verified
      if (!resolvedUser.email_verified_at) {
        router.push('/verify-email');
        return;
      }

      let ret = searchParams.get('return');
      if (ret) {
        try { ret = decodeURIComponent(ret); } catch { ret = null; }
      }
      if (ret && ret.startsWith('/') && !ret.startsWith('//') && !/[<>'"\\]/.test(ret) && ret !== '/login' && !ret.startsWith('/login?') && !ret.startsWith('/login/')) {
        router.push(ret);
      } else {
        router.push('/');
      }
    } catch (err: unknown) {
      const message =
        typeof err === 'object' && err && 'message' in err
          ? String((err as { message?: string }).message)
          : 'فشل تسجيل الدخول، يرجى المحاولة لاحقاً';
      setServerError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">تسجيل الدخول</h1>
        <p className="text-muted-foreground">
          أدخل بياناتك للوصول إلى حسابك
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {justReset && (
          <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-sm">
            تم تحديث كلمة المرور بنجاح. يرجى تسجيل الدخول بكلمتك الجديدة.
          </div>
        )}
        {googleError && (
          <div className="p-3 rounded-lg bg-error/10 text-error text-sm">
            فشل تسجيل الدخول باستخدام Google. يرجى المحاولة مرة أخرى.
          </div>
        )}
        {serverError && (
          <div className="p-3 rounded-lg bg-error/10 text-error text-sm">
            {serverError}
          </div>
        )}
        <Input
          label="البريد الإلكتروني"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="example@email.com"
          leftIcon={<Mail className="w-5 h-5" />}
          required
        />

        <Input
          label="كلمة المرور"
          type={showPassword ? 'text' : 'password'}
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="••••••••"
          leftIcon={<Lock className="w-5 h-5" />}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="focus:outline-none"
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          }
          required
        />

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="remember"
              checked={formData.remember}
              onChange={handleChange}
              className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20"
            />
            <span className="text-sm text-muted-foreground">تذكرني</span>
          </label>
          <Link
            href="/forgot-password"
            className="text-sm text-primary hover:underline"
          >
            نسيت كلمة المرور؟
          </Link>
        </div>

        <Button
          type="submit"
          isLoading={isLoading}
          className="w-full"
          rightIcon={<ArrowLeft className="w-5 h-5" />}
        >
          تسجيل الدخول
        </Button>
      </form>

      {/* Divider */}
      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-background text-muted-foreground">
            أو تابع باستخدام
          </span>
        </div>
      </div>

      {/* Social Login */}
      <div className="space-y-3">
        <Button
          variant="outline"
          type="button"
          className="w-full"
          onClick={handleGoogleLogin}
          disabled={isGoogleLoading}
        >
          {isGoogleLoading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current ml-2"></div>
          ) : (
            <svg className="w-5 h-5 ml-2" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
          )}
          {isGoogleLoading ? 'جاري التحويل...' : 'تسجيل الدخول باستخدام Google'}
        </Button>
      </div>

      {/* Sign Up Link */}
      <p className="mt-8 text-center text-sm text-muted-foreground">
        ليس لديك حساب؟{' '}
        <Link href="/register" className="text-primary font-medium hover:underline">
          إنشاء حساب جديد
        </Link>
      </p>
    </motion.div>
  );
}

