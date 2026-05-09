import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useStore';

/**
 * Hook to check if user's email is verified
 * Redirects to /verify-email if not verified
 *
 * @param requireVerification - Whether to enforce email verification (default: true)
 */
export function useEmailVerification(requireVerification: boolean = true) {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!requireVerification) return;
    if (!isAuthenticated) return;

    // Check if user is authenticated but email is not verified
    if (user && (user.email_verified_at == null || user.email_verified_at === '')) {
      router.push('/verify-email');
    }
  }, [user, isAuthenticated, requireVerification, router]);

  return {
    isVerified: user?.email_verified_at != null && user.email_verified_at !== '' ? true : false,
    user,
  };
}
