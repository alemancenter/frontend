'use client';

import { Suspense, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { motion } from '@/lib/motion-lite';
import { ArrowLeft, Lock, Mail, CheckCircle } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { authService } from '@/lib/api/services';

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[400px] flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}

function ResetPasswordContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const token = useMemo(() => {
    const t = params?.token;
    if (typeof t === 'string') return t;
    if (Array.isArray(t)) return t[0] ?? '';
    return '';
  }, [params]);

  const [email, setEmail] = useState(searchParams.get('email') ?? '');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    const nextErrors: Record<string, string> = {};

    if (!token) {
      nextErrors.token = 'رابط إعادة التعيين غير صالح أو منتهي';
    }

    if (!email.trim()) {
      nextErrors.email = 'البريد الإلكتروني مطلوب';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextErrors.email = 'صيغة البريد الإلكتروني غير صحيحة';
    }

    if (!password) {
      nextErrors.password = 'كلمة المرور الجديدة مطلوبة';
    } else if (password.length < 8) {
      nextErrors.password = 'كلمة المرور يجب أن تكون 8 أحرف على الأقل';
    }

    if (password !== passwordConfirmation) {
      nextErrors.passwordConfirmation = 'كلمتا المرور غير متطابقتين';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError('');
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await authService.resetPassword({
        token,
        email: email.trim(),
        password,
        password_confirmation: passwordConfirmation,
      });
      router.push('/login?reset=1');
    } catch (err: unknown) {
      const message =
        typeof err === 'object' && err && 'message' in err
          ? String((err as { message?: string }).message)
          : 'فشل إعادة تعيين كلمة المرور، يرجى المحاولة لاحقاً';
      setServerError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">إعادة تعيين كلمة المرور</h1>
        <p className="text-muted-foreground">اختر كلمة مرور قوية وجديدة لحسابك</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.token && (
          <div className="p-3 rounded-lg bg-error/10 text-error text-sm">{errors.token}</div>
        )}
        {serverError && <div className="p-3 rounded-lg bg-error/10 text-error text-sm">{serverError}</div>}

        <Input
          label="البريد الإلكتروني"
          type="email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="example@email.com"
          leftIcon={<Mail className="w-5 h-5" />}
          error={errors.email}
          required
        />

        <Input
          label="كلمة المرور الجديدة"
          type="password"
          name="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          leftIcon={<Lock className="w-5 h-5" />}
          error={errors.password}
          required
        />

        <Input
          label="تأكيد كلمة المرور"
          type="password"
          name="passwordConfirmation"
          value={passwordConfirmation}
          onChange={(e) => setPasswordConfirmation(e.target.value)}
          placeholder="••••••••"
          leftIcon={<Lock className="w-5 h-5" />}
          error={errors.passwordConfirmation}
          required
        />

        <Button type="submit" isLoading={isLoading} className="w-full" rightIcon={<ArrowLeft className="w-5 h-5" />}>
          تحديث كلمة المرور
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        <Link href="/login" className="text-primary font-medium hover:underline">
          العودة لتسجيل الدخول
        </Link>
      </p>

      {token && (
        <div className="mt-4 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
          <CheckCircle className="w-4 h-4 opacity-70" />
          تم فتح رابط إعادة التعيين
        </div>
      )}
    </motion.div>
  );
}


