import { API_CONFIG, API_ENDPOINTS } from '@/lib/api/config';
import { apiClient } from '@/lib/api/client';

/**
 * Maps country ID (1-4) to database code (jo/sa/eg/ps).
 */
export function countryIdToDatabase(id: string | number): string {
  const map: Record<string, string> = { '1': 'jo', '2': 'sa', '3': 'eg', '4': 'ps' };
  return map[String(id)] ?? 'jo';
}

/**
 * Triggers sitemap regeneration in the background after content changes.
 * Fire-and-forget: never throws, never blocks the caller.
 */
export function triggerSitemapRegen(database: string): void {
  if (typeof window === 'undefined') return;

  const token = apiClient.getToken();

  const frontendKey = process.env.NEXT_PUBLIC_FRONTEND_API_KEY;
  fetch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.SITEMAP.GENERATE_ALL}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(frontendKey ? { 'X-Frontend-Key': frontendKey } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ database }),
  }).catch(() => {
    // Silent fail — sitemap regeneration is a background task
  });
}
