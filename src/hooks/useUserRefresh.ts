import { useEffect } from 'react';
import { useAuthStore } from '@/store/useStore';
import { authService } from '@/lib/api/services/auth';

let lastUserRefreshAt = 0;
const USER_REFRESH_TTL_MS = 5 * 60 * 1000;

export function useUserRefresh() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const _hasHydrated = useAuthStore((s) => s._hasHydrated);

  useEffect(() => {
    if (!_hasHydrated || !isAuthenticated) return;
    const now = Date.now();
    if (now - lastUserRefreshAt < USER_REFRESH_TTL_MS) return;
    lastUserRefreshAt = now;

    authService.me()
      .then((freshUser) => useAuthStore.getState().login(freshUser))
      .catch(() => {});
  }, [isAuthenticated, _hasHydrated]);
}
