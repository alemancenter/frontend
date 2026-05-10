'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from '@/lib/motion-lite';
import { User, Mail, Lock, Eye, EyeOff, ArrowLeft, Check } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useAuthStore } from '@/store/useStore';
import { authService } from '@/lib/api/services';
import { API_CONFIG } from '@/lib/api/config';

const passwordRequirements = [
  { label: '8 أحرف على الأقل', check: (p: string) => p.length >= 8 },
  { label: 'حرف كبير واحد', check: (p: string) => /[A-Z]/.test(p) },
  { label: 'حرف صغير واحد', check: (p: string) => /[a-z]/.test(p) },
  { label: 'رقم واحد', check: (p: string) => /[0-9]/.test(p) },
];

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [serverError, setServerError] = useState<string>('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    terms: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Handle Google signup
  const handleGoogleSignup = () => {
    setIsGoogleLoading(true);
    setServerError('');
    // Redirect to backend Google OAuth endpoint
    const googleAuthUrl = `${API_CONFIG.BASE_URL}/auth/google/redirect`;
    window.location.href = googleAuthUrl;
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'الاسم مطلوب';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'البريد الإلكتروني مطلوب';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'البريد الإلكتروني غير صحيح';
    }

    if (!formData.password) {
      newErrors.password = 'كلمة المرور مطلوبة';
    } else if (formData.password.length < 8) {
      newErrors.password = 'كلمة المرور يجب أن تكون 8 أحرف على الأقل';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'كلمات المرور غير متطابقة';
    }

    if (!formData.terms) {
      newErrors.terms = 'يجب الموافقة على الشروط والأحكام';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    setServerError('');
    try {
      const res = await authService.register({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        password_confirmation: formData.confirmPassword,
      });

      if (!res.user) throw new Error('فشل إنشاء الحساب، يرجى المحاولة لاحقاً');
      login(res.user);

      // After registration, user needs to verify email
      router.push('/verify-email');
    } catch (err: unknown) {
      const maybeErrors =
        typeof err === 'object' && err && 'errors' in err
          ? (err as { errors?: Record<string, string[]> }).errors
          : undefined;

      if (maybeErrors) {
        const next: Record<string, string> = {};
        if (maybeErrors.name?.[0]) next.name = maybeErrors.name[0];
        if (maybeErrors.email?.[0]) next.email = maybeErrors.email[0];
        if (maybeErrors.password?.[0]) next.password = maybeErrors.password[0];
        if (maybeErrors.password_confirmation?.[0]) next.confirmPassword = maybeErrors.password_confirmation[0];
        setErrors((prev) => ({ ...prev, ...next }));
      }

      const message =
        typeof err === 'object' && err && 'message' in err
          ? String((err as { message?: string }).message)
          : 'فشل إنشاء الحساب، يرجى المحاولة لاحقاً';
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
    // مسح الخطأ عند الكتابة
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">إنشاء حساب جديد</h1>
        <p className="text-muted-foreground">
          أنشئ حسابك واستمتع بجميع الميزات
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {serverError && (
          <div className="p-3 rounded-lg bg-error/10 text-error text-sm">
            {serverError}
          </div>
        )}
        <Input
          label="الاسم الكامل"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="أدخل اسمك الكامل"
          leftIcon={<User className="w-5 h-5" />}
          error={errors.name}
          required
        />

        <Input
          label="البريد الإلكتروني"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="example@email.com"
          leftIcon={<Mail className="w-5 h-5" />}
          error={errors.email}
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
          error={errors.password}
          required
        />

        {/* Password Requirements */}
        {formData.password && (
          <div className="grid grid-cols-2 gap-2 text-sm">
            {passwordRequirements.map((req, index) => (
              <div
                key={index}
                className={`flex items-center gap-2 ${
                  req.check(formData.password)
                    ? 'text-success'
                    : 'text-muted-foreground'
                }`}
              >
                <Check className={`w-4 h-4 ${
                  req.check(formData.password) ? 'opacity-100' : 'opacity-30'
                }`} />
                {req.label}
              </div>
            ))}
          </div>
        )}

        <Input
          label="تأكيد كلمة المرور"
          type={showPassword ? 'text' : 'password'}
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          placeholder="••••••••"
          leftIcon={<Lock className="w-5 h-5" />}
          error={errors.confirmPassword}
          required
        />

        <div>
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="terms"
              checked={formData.terms}
              onChange={handleChange}
              className="w-4 h-4 mt-1 rounded border-border text-primary focus:ring-primary/20"
            />
            <span className="text-sm text-muted-foreground">
              أوافق على{' '}
              <Link href="/terms-of-service" className="text-primary hover:underline">
                الشروط والأحكام
              </Link>{' '}
              و{' '}
              <Link href="/privacy-policy" className="text-primary hover:underline">
                سياسة الخصوصية
              </Link>
            </span>
          </label>
          {errors.terms && (
            <p className="text-sm text-error mt-1">{errors.terms}</p>
          )}
        </div>

        <Button
          type="submit"
          isLoading={isLoading}
          className="w-full"
          rightIcon={<ArrowLeft className="w-5 h-5" />}
        >
          إنشاء الحساب
        </Button>
      </form>

      {/* Divider */}
      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-background text-muted-foreground">
            أو سجل باستخدام
          </span>
        </div>
      </div>

      {/* Social Login */}
      <div className="space-y-3">
        <Button
          variant="outline"
          type="button"
          className="w-full"
          onClick={handleGoogleSignup}
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
          {isGoogleLoading ? 'جاري التحويل...' : 'التسجيل باستخدام Google'}
        </Button>
      </div>

      {/* Login Link */}
      <p className="mt-8 text-center text-sm text-muted-foreground">
        لديك حساب بالفعل؟{' '}
        <Link href="/login" className="text-primary font-medium hover:underline">
          تسجيل الدخول
        </Link>
      </p>
    </motion.div>
  );
}

