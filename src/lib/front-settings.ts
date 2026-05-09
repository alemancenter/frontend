import 'server-only';

import { cache } from 'react';
import { ssrFetch, getSSRHeaders } from '@/lib/api/ssr-fetch';
import { API_CONFIG, API_ENDPOINTS } from '@/lib/api/config';

export type FrontSettings = Record<string, string | null>;

const parseSettings = (json: any): FrontSettings => {
  const body = json?.data ?? json;
  const settings = body?.settings ?? body?.data ?? body;
  if (settings && typeof settings === 'object') return settings as FrontSettings;
  return {};
};

/**
 * Public settings (logo, site config, ads flags...).
 * Uses the internal API URL for SSR and a longer revalidation window because
 * settings are far less volatile than homepage content.
 */
export const getFrontSettings = cache(async (countryId = '1'): Promise<FrontSettings> => {
  const baseUrl = API_CONFIG.INTERNAL_URL.replace(/\/+$/, '');

  try {
    const res = await ssrFetch(`${baseUrl}${API_ENDPOINTS.FRONT.SETTINGS}`, {
      next: { revalidate: 3600 },
      headers: getSSRHeaders(countryId),
    });

    if (!res.ok) return {};

    const json = await res.json().catch(() => null);
    return parseSettings(json);
  } catch {
    return {};
  }
});
