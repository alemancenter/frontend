'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from '@/lib/motion-lite';
import { CheckCircle, AlertTriangle, Mail, ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card, { CardContent } from '@/components/ui/Card';
import { authService } from '@/lib/api/services';
import { apiClient } from '@/lib/api/client';
import { useAuthStore } from '@/store/useStore';

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[400px] flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, login } = useAuthStore();
  const id = searchParams.get('id') ?? '';
  const hash = searchParams.get('token') ?? searchParams.get('hash') ?? '';

  // If has id and hash, show verification result
  const hasVerificationParams = id && hash;

  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');
  const [resendStatus, setResendStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [resendMessage, setResendMessage] = useState<string>('');
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);

  // Check if user is already verified
  useEffect(() => {
    if (user?.email_verified_at && !hasVerificationParams) {
      router.push('/');
    }
  }, [user, router, hasVerificationParams]);

  // Handle countdown
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Verify email from link (with id and time-limited token)
  useEffect(() => {
    let isMounted = true;
    const run = async () => {
      if (!hasVerificationParams) return;
      setStatus('loading');
      setMessage('');
      try {
        const res = await authService.verifyEmail(id, hash);
        if (!isMounted) return;

        // Fetch updated user data and update store
        const updatedUser = await authService.me();
        login(updatedUser);

        setStatus('success');
        setMessage(res.message || 'تم تأكيد البريد الإلكتروني بنجاح.');

        // Redirect to homepage after 2 seconds
        setTimeout(() => {
          router.push('/');
        }, 2000);
      } catch (err: unknown) {
        const msg =
          typeof err === 'object' && err && 'message' in err
            ? String((err as { message?: string }).message)
            : 'فشل تأكيد البريد الإلكتروني';
        if (!isMounted) return;
        setStatus('error');
        setMessage(msg);
      }
    };
    run();
    return () => {
      isMounted = false;
    };
  }, [hash, id, hasVerificationParams, router, login]);

  const handleResend = async () => {
    const token = apiClient.getToken();
    if (!token) {
      setResendStatus('error');
      setResendMessage('يرجى تسجيل الدخول أولاً لإعادة إرسال رابط التحقق.');
      return;
    }
    setResendStatus('loading');
    setResendMessage('');
    try {
      const res = await authService.resendVerifyEmail();
      setResendStatus('success');
      setResendMessage(res.message || 'تم إرسال رابط التحقق إلى بريدك الإلكتروني');
      setCountdown(60);
    } catch (err: unknown) {
      const msg =
        typeof err === 'object' && err && 'message' in err
          ? String((err as { message?: string }).message)
          : 'فشل إعادة إرسال رابط التحقق';
      setResendStatus('error');
      setResendMessage(msg);
    }
  };

  const handleCheckVerification = async () => {
    try {
      setLoading(true);
      const updatedUser = await authService.me();

      if (updatedUser.email_verified_at != null && updatedUser.email_verified_at !== '') {
        // Update the user in the store with verified email
        login(updatedUser);

        setResendStatus('success');
        setResendMessage('تم التحقق من بريدك الإلكتروني بنجاح!');

        // Redirect to homepage after 1 second
        setTimeout(() => {
          router.push('/');
        }, 1000);
      } else {
        setResendStatus('error');
        setResendMessage('لم يتم التحقق من بريدك الإلكتروني بعد');
      }
    } catch (error: any) {
      setResendStatus('error');
      setResendMessage(error.message || 'فشل في التحقق من الحالة');
    } finally {
      setLoading(false);
    }
  };

  // Show verification result page (when clicking link from email)
  if (hasVerificationParams) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">تأكيد البريد الإلكتروني</h1>
          <p className="text-muted-foreground">نقوم بتأكيد بريدك الإلكتروني لتفعيل حسابك</p>
        </div>

        {status === 'loading' && (
          <div className="p-3 rounded-lg bg-muted/40 text-sm text-muted-foreground">جاري تأكيد البريد الإلكتروني...</div>
        )}

        {status === 'success' && (
          <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-sm flex items-start gap-2">
            <CheckCircle className="w-5 h-5 mt-0.5" />
            <div className="leading-6">{message}</div>
          </div>
        )}

        {status === 'error' && (
          <div className="p-3 rounded-lg bg-error/10 text-error text-sm flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 mt-0.5" />
            <div className="leading-6">{message}</div>
          </div>
        )}

        <div className="mt-6 space-y-3">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            leftIcon={<Mail className="w-5 h-5" />}
            onClick={handleResend}
          >
            إعادة إرسال رابط التحقق
          </Button>

          <Button type="button" className="w-full" rightIcon={<ArrowLeft className="w-5 h-5" />} onClick={() => router.push('/login')}>
            الانتقال لتسجيل الدخول
          </Button>
        </div>
      </motion.div>
    );
  }

  // Show waiting for verification page (when redirected before accessing dashboard)
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="text-center space-y-6">
            {/* Icon */}
            <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
              <Mail className="w-10 h-10 text-primary" />
            </div>

            {/* Title */}
            <div>
              <h1 className="text-2xl font-bold mb-2">تحقق من بريدك الإلكتروني</h1>
              <p className="text-muted-foreground">
                تم إرسال رابط التحقق إلى بريدك الإلكتروني
              </p>
              {user?.email && (
                <p className="text-sm font-medium text-primary mt-2">
                  {user.email}
                </p>
              )}
            </div>

            {/* Message */}
            {(resendStatus === 'success' || resendStatus === 'error') && (
              <div className={`p-4 rounded-lg flex items-center gap-3 ${
                resendStatus === 'success'
                  ? 'bg-emerald-500/10 text-emerald-600'
                  : 'bg-red-500/10 text-red-600'
              }`}>
                {resendStatus === 'success' ? (
                  <CheckCircle className="w-5 h-5 shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 shrink-0" />
                )}
                <span className="text-sm">{resendMessage}</span>
              </div>
            )}

            {/* Instructions */}
            <div className="bg-muted/50 p-4 rounded-lg text-right space-y-2">
              <p className="text-sm font-medium">الخطوات:</p>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>افتح بريدك الإلكتروني</li>
                <li>ابحث عن رسالة التحقق</li>
                <li>انقر على رابط التحقق</li>
                <li>ارجع إلى هذه الصفحة واضغط &quot;تحقق الآن&quot;</li>
              </ol>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <Button
                onClick={handleCheckVerification}
                isLoading={loading}
                className="w-full"
                leftIcon={<RefreshCw className="w-4 h-4" />}
              >
                تحقق الآن
              </Button>

              <Button
                variant="outline"
                onClick={handleResend}
                disabled={resendStatus === 'loading' || countdown > 0}
                className="w-full"
                leftIcon={<Mail className="w-4 h-4" />}
              >
                {countdown > 0
                  ? `إعادة الإرسال بعد ${countdown} ثانية`
                  : 'إعادة إرسال البريد'
                }
              </Button>
            </div>

            {/* Help Text */}
            <p className="text-xs text-muted-foreground">
              لم تستلم البريد؟ تحقق من مجلد الرسائل غير المرغوب فيها (Spam)
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
