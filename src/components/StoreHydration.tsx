'use client';

import { useEffect } from 'react';
import { useThemeStore, useAuthStore, useCountryStore, useSettingsStore } from '@/store/useStore';
import { apiClient } from '@/lib/api/client';

/**
 * Rehydrates all Zustand persist stores after the first client render,
 * then restores the in-memory API token from the HttpOnly session cookie.
 *
 * Flow on page refresh:
 *  1. Stores rehydrate from localStorage (UI shows correct auth state instantly)
 *  2. apiClient.restoreFromSession() calls GET /api/auth/session (server reads
 *     the HttpOnly cookie and returns the token safely to the same origin)
 *  3. Token is set in memory → all subsequent API calls include Authorization header
 *  4. If no valid cookie exists, the auth store is cleared (stale state cleanup)
 */
export default function StoreHydration() {
  useEffect(() => {
    useThemeStore.persist.rehydrate();
    useAuthStore.persist.rehydrate();
    useCountryStore.persist.rehydrate();
    useSettingsStore.persist.rehydrate();

    apiClient.restoreFromSession().then((restored) => {
      if (!restored && useAuthStore.getState().isAuthenticated) {
        // Cookie is gone (expired/cleared) but localStorage still says logged in — sync them
        useAuthStore.getState().logout();
        try { localStorage.removeItem('auth-storage'); } catch {}
      }
    });

    // Suppress console.error for 403 forbidden errors — toast is already shown by the API client.
    const orig = console.error.bind(console);
    console.error = (...args: any[]) => {
      if (args.some((a: any) => a?.isForbidden === true || a?.status === 403)) return;
      orig(...args);
    };
  }, []);

  return null;
}
