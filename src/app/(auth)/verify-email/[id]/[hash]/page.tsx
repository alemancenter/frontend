'use client';

import { Suspense, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';

export default function VerifyEmailRedirectPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[400px] flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        </div>
      }
    >
      <VerifyEmailRedirectContent />
    </Suspense>
  );
}

function VerifyEmailRedirectContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  useEffect(() => {
    const id = typeof params?.id === 'string' ? params.id : Array.isArray(params?.id) ? params.id[0] : '';
    const hash = typeof params?.hash === 'string' ? params.hash : Array.isArray(params?.hash) ? params.hash[0] : '';
    if (!id || !hash) return;
    const extra = searchParams.toString();
    const qs = `id=${encodeURIComponent(id)}&token=${encodeURIComponent(hash)}${extra ? `&${extra}` : ''}`;
    router.replace(`/verify-email?${qs}`);
  }, [params, router, searchParams]);

  return null;
}
