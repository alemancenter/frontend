import 'server-only';

import { cookies } from 'next/headers';
import { API_CONFIG, getApiHostname } from '@/lib/api/config';

export async function getServerToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get('token')?.value;
}

export function getInternalApiEndpoint(endpoint: string): string {
  const baseUrl = API_CONFIG.INTERNAL_URL.replace(/\/+$/, '');
  return `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
}

export function getServerApiHeaders(options: {
  token?: string;
  countryId?: string;
  contentType?: string | false;
} = {}): HeadersInit {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.FRONTEND_URL || 'http://localhost:3000';
  const frontendKey = process.env.FRONTEND_API_KEY || process.env.NEXT_PUBLIC_FRONTEND_API_KEY || '';
  const countryId = options.countryId || process.env.NEXT_PUBLIC_DEFAULT_COUNTRY_ID || '1';

  const headers: Record<string, string> = {
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    'X-Country-Id': countryId,
    Origin: appUrl,
    Referer: `${appUrl.replace(/\/+$/, '')}/`,
    Host: getApiHostname(),
  };

  if (frontendKey) headers['X-Frontend-Key'] = frontendKey;
  if (options.token) headers.Authorization = `Bearer ${options.token}`;
  if (options.contentType !== false) headers['Content-Type'] = options.contentType || 'application/json';

  return headers;
}

export async function readJsonSafe(response: Response): Promise<any | null> {
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) return null;
  return response.json().catch(() => null);
}

export async function forwardToBackend(endpoint: string, init: RequestInit = {}): Promise<Response> {
  return fetch(getInternalApiEndpoint(endpoint), {
    ...init,
    cache: 'no-store',
  });
}
