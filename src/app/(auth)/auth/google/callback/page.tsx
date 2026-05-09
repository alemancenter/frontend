'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/useStore';
import { authService } from '@/lib/api/services';
import { apiClient } from '@/lib/api/client';

function GoogleCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuthStore();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      const token = searchParams.get('token');
      const errorParam = searchParams.get('error');

      if (errorParam) {
        setError('فشل تسجيل الدخول باستخدام Google. يرجى المحاولة مرة أخرى.');
        setTimeout(() => router.push('/login'), 3000);
        return;
      }

      if (token) {
        try {
          // Store the access token and sync the HttpOnly cookie used by Next routes.
          await apiClient.persistToken(token);

          // Get user data
          const user = await authService.me();
          login(user);

          // Clear security violation flags on successful login
          localStorage.removeItem('security_violation_attempts');
          localStorage.removeItem('security_banned');

          // Redirect to home or dashboard
          router.push('/');
        } catch (err) {
          console.error('Failed to get user data:', err);
          setError('فشل في جلب بيانات المستخدم. يرجى المحاولة مرة أخرى.');
          setTimeout(() => router.push('/login'), 3000);
        }
      } else {
        setError('لم يتم العثور على رمز المصادقة.');
        setTimeout(() => router.push('/login'), 3000);
      }
    };

    handleCallback();
  }, [searchParams, login, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center p-8">
        {error ? (
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="text-red-600 dark:text-red-400">{error}</p>
            <p className="text-sm text-muted-foreground">جاري إعادة التوجيه...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
            </div>
            <p className="text-lg font-medium">جاري تسجيل الدخول...</p>
            <p className="text-sm text-muted-foreground">يرجى الانتظار</p>
          </div>
        )}
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center p-8">
        <div className="space-y-4">
          <div className="w-16 h-16 mx-auto">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
          </div>
          <p className="text-lg font-medium">جاري التحميل...</p>
        </div>
      </div>
    </div>
  );
}

export default function GoogleCallbackPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <GoogleCallbackContent />
    </Suspense>
  );
}
