'use client';

import { Suspense, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from '@/lib/motion-lite';

export default function ResetPasswordEntryPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[400px] flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        </div>
      }
    >
      <ResetPasswordEntryContent />
    </Suspense>
  );
}

function ResetPasswordEntryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    const email = searchParams.get('email');
    if (!token) return;

    const qs = email ? `?email=${encodeURIComponent(email)}` : '';
    router.replace(`/reset-password/${encodeURIComponent(token)}${qs}`);
  }, [router, searchParams]);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">إعادة تعيين كلمة المرور</h1>
        <p className="text-muted-foreground">يرجى فتح رابط إعادة التعيين من بريدك الإلكتروني</p>
      </div>

      <p className="text-sm text-muted-foreground">
        إذا لم يصلك البريد، يمكنك طلب رابط جديد من صفحة{' '}
        <Link href="/forgot-password" className="text-primary font-medium hover:underline">
          نسيت كلمة المرور
        </Link>
        .
      </p>
    </motion.div>
  );
}


