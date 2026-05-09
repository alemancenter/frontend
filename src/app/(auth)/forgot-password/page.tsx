'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from '@/lib/motion-lite';
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { authService } from '@/lib/api/services';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  const validate = () => {
    if (!email.trim()) {
      setEmailError('البريد الإلكتروني مطلوب');
      return false;
    }
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!isValid) {
      setEmailError('صيغة البريد الإلكتروني غير صحيحة');
      return false;
    }
    setEmailError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError('');
    setSuccessMessage('');
    if (!validate()) return;

    setIsLoading(true);
    try {
      const res = await authService.forgotPassword(email.trim());
      setSuccessMessage(res.message || 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني.');
    } catch (err: unknown) {
      const message =
        typeof err === 'object' && err && 'message' in err
          ? String((err as { message?: string }).message)
          : 'فشل إرسال رابط إعادة التعيين، يرجى المحاولة لاحقاً';
      setServerError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">نسيت كلمة المرور</h1>
        <p className="text-muted-foreground">أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة التعيين</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {serverError && <div className="p-3 rounded-lg bg-error/10 text-error text-sm">{serverError}</div>}

        {successMessage && (
          <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-sm flex items-start gap-2">
            <CheckCircle className="w-5 h-5 mt-0.5" />
            <div className="leading-6">{successMessage}</div>
          </div>
        )}

        <Input
          label="البريد الإلكتروني"
          type="email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="example@email.com"
          leftIcon={<Mail className="w-5 h-5" />}
          error={emailError}
          required
        />

        <Button type="submit" isLoading={isLoading} className="w-full" rightIcon={<ArrowLeft className="w-5 h-5" />}>
          إرسال رابط إعادة التعيين
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        تذكرت كلمة المرور؟{' '}
        <Link href="/login" className="text-primary font-medium hover:underline">
          العودة لتسجيل الدخول
        </Link>
      </p>
    </motion.div>
  );
}


