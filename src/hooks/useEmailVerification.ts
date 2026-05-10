import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useStore';

export function useEmailVerification(requireVerification: boolean = true) {
  const { user, isAuthenticated, _hasHydrated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!requireVerification) return;

    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (user && (user.email_verified_at == null || user.email_verified_at === '')) {
      router.push('/verify-email');
    }
  }, [user, isAuthenticated, _hasHydrated, requireVerification, router]);

  if (!_hasHydrated) {
    return { isVerified: null as null, user };
  }

  if (!isAuthenticated) {
    return { isVerified: false as false, user };
  }

  const verified = user?.email_verified_at != null && user.email_verified_at !== '';
  return { isVerified: verified, user };
}
