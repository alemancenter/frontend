import toast from 'react-hot-toast';
import { API_CONFIG, getApiHostname } from './config';
import { universalFetch, shouldUseInternalFetch } from './internal-fetch';

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
  timeout?: number;
  /** Override the number of retry attempts for this request. Pass 0 to disable retries. */
  retries?: number;
  /** When true, a 401 response will NOT clear the session or redirect to login. */
  suppressAuthRedirect?: boolean;
}

interface ApiResponse<T> {
  data: T;
  message?: string;
  status: number;
  success: boolean;
}

class ApiClient {
  private baseUrl: string;

  // Tokens are stored in memory only — never in localStorage.
  // Persistence across refresh is handled by HttpOnly cookies through /api/auth/session.
  private token: string | null = null;
  private refreshTokenValue: string | null = null;

  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private inFlightGetRequests: Map<string, Promise<ApiResponse<any>>> = new Map();

  private cacheTimeout = 300000; // 5 minutes
  private requestTimeout = 15000; // 15 seconds
  private maxRetries = 3;
  private retryDelay = 1000;

  // Session restoration gate — protected browser requests wait until restoreFromSession() resolves.
  private sessionRestored = false;
  private sessionReadyResolve!: () => void;
  private sessionReadyPromise: Promise<void>;

  constructor() {
    this.baseUrl = API_CONFIG.BASE_URL;

    if (!/^https?:\/\//i.test(this.baseUrl)) {
      this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.alemedu.com/api';
    }

    this.sessionReadyPromise = new Promise<void>((resolve) => {
      this.sessionReadyResolve = resolve;
    });

    if (typeof window === 'undefined') {
      this.sessionRestored = true;
      this.sessionReadyResolve();
    }
  }

  private markSessionReady(): void {
    if (!this.sessionRestored) {
      this.sessionRestored = true;
      this.sessionReadyResolve();
    }
  }

  /**
   * Server-side SSR uses internal API.
   * Browser uses public API.
   */
  private getCurrentBaseUrl(): string {
    if (typeof window === 'undefined') {
      return API_CONFIG.INTERNAL_URL;
    }

    return API_CONFIG.BASE_URL;
  }

  /**
   * Public endpoints must not wait for session restoration.
   * Auth endpoints: login/register won't hang before being sent.
   * Public content endpoints: school-classes, grades, filter, etc. are read-only
   * and never need a token — waiting for session is pure latency.
   */
  private shouldBypassSessionGate(endpoint: string): boolean {
    const bypassPrefixes = [
      '/auth/login',
      '/auth/register',
      '/auth/password/forgot',
      '/auth/password/reset',
      '/auth/email/verify',
      '/auth/email/resend',
      '/auth/google/redirect',
      '/auth/google/callback',
      // Public read-only content endpoints
      '/school-classes',
      '/grades',
      '/filter',
      '/categories',
      '/posts',
      '/articles',
      '/home',
    ];

    return bypassPrefixes.some((path) => endpoint === path || endpoint.startsWith(`${path}/`) || endpoint.startsWith(`${path}?`));
  }

  /**
   * Parse API response safely.
   * If backend returns HTML or empty body where JSON is expected, throw a clear error.
   */
  private async parseResponseBody(response: Response, url: string): Promise<any> {
    const contentType = response.headers.get('content-type') || '';
    const text = await response.text().catch(() => '');

    if (!text) {
      return null;
    }

    if (contentType.includes('application/json') || text.trim().startsWith('{') || text.trim().startsWith('[')) {
      try {
        return JSON.parse(text);
      } catch {
        throw Object.assign(
          new Error(`استجابة JSON غير صالحة من الخادم: ${url}`),
          {
            status: response.status,
            contentType,
            responsePreview: text.slice(0, 500),
          }
        );
      }
    }

    if (typeof window !== 'undefined') {
      console.error('[API] Non-JSON response', {
        url,
        status: response.status,
        contentType,
        preview: text.slice(0, 500),
      });
    }

    throw Object.assign(
      new Error(`الخادم أعاد استجابة غير JSON من المسار: ${url}`),
      {
        status: response.status,
        contentType,
        responsePreview: text.slice(0, 500),
      }
    );
  }

  private async fetchWithTimeout(
    url: string,
    options: RequestInit,
    timeout: number = this.requestTimeout
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const useInternalFetch = shouldUseInternalFetch(url);

      if (useInternalFetch) {
        clearTimeout(timeoutId);

        return await universalFetch(url, {
          ...options,
          timeout,
        } as RequestInit & { timeout?: number });
      }

      return await fetch(url, {
        ...options,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private async fetchWithRetry(
    url: string,
    options: RequestInit,
    retries: number = this.maxRetries,
    timeout: number = this.requestTimeout
  ): Promise<Response> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await this.fetchWithTimeout(url, options, timeout);
      } catch (error: any) {
        lastError = error;

        if (error.name === 'AbortError') {
          console.warn(`Request timeout (attempt ${attempt + 1}/${retries + 1}): ${url}`);
        } else if (
          error.message?.includes('fetch failed') ||
          error.message?.includes('ECONNRESET') ||
          error.message?.includes('ECONNREFUSED') ||
          error.message?.includes('ETIMEDOUT')
        ) {
          console.warn(`Network error (attempt ${attempt + 1}/${retries + 1}): ${url}`);
        } else {
          throw error;
        }

        if (attempt < retries) {
          const delay = this.retryDelay * Math.pow(2, attempt) + Math.random() * 500;
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error('Request failed after retries');
  }

  private setLocalToken(token: string | null, refreshToken?: string | null): void {
    this.token = token;

    if (token === null) {
      this.refreshTokenValue = null;
    } else if (refreshToken !== undefined) {
      this.refreshTokenValue = refreshToken;
    }
  }

  setToken(token: string | null): void {
    this.setLocalToken(token);
    void this.syncAuthCookie(token, null);
  }

  async persistToken(token: string | null, refreshToken?: string | null): Promise<void> {
    this.setLocalToken(token, refreshToken ?? null);
    await this.syncAuthCookie(token, refreshToken ?? null);
  }

  async syncAuthCookie(token: string | null, refreshToken?: string | null): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
      await fetch('/api/auth/session', {
        method: token ? 'POST' : 'DELETE',
        headers: token ? { 'Content-Type': 'application/json' } : undefined,
        body: token
          ? JSON.stringify({
              token,
              ...(refreshToken ? { refresh_token: refreshToken } : {}),
            })
          : undefined,
        credentials: 'include',
        cache: 'no-store',
      });
    } catch (error) {
      console.warn('Failed to sync auth cookie', error);
    }
  }

  getToken(): string | null {
    return this.token;
  }

  /**
   * Restore in-memory token from HttpOnly cookie.
   */
  async restoreFromSession(): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    try {
      const res = await fetch('/api/auth/session', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      });

      if (!res.ok) {
        this.markSessionReady();
        return false;
      }

      const data = await res.json();

      if (data.authenticated && typeof data.token === 'string') {
        this.setLocalToken(data.token, data.refresh_token ?? null);
        this.markSessionReady();
        return true;
      }

      this.markSessionReady();
      return false;
    } catch {
      this.markSessionReady();
      return false;
    }
  }

  private buildUrl(
    endpoint: string,
    params?: Record<string, string | number | boolean | undefined>
  ): string {
    let finalEndpoint = endpoint;
    const baseUrl = this.getCurrentBaseUrl().replace(/\/+$/, '');

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && finalEndpoint.includes(`:${key}`)) {
          finalEndpoint = finalEndpoint.replace(`:${key}`, String(value));
        } else if (value !== undefined && finalEndpoint.includes(`{${key}}`)) {
          finalEndpoint = finalEndpoint.replace(`{${key}}`, String(value));
        }
      });

      const url = new URL(`${baseUrl}${finalEndpoint}`);

      Object.entries(params).forEach(([key, value]) => {
        if (
          value !== undefined &&
          !finalEndpoint.includes(`:${key}`) &&
          !finalEndpoint.includes(`{${key}}`)
        ) {
          url.searchParams.append(key, String(value));
        }
      });

      return url.toString();
    }

    return `${baseUrl}${finalEndpoint}`;
  }

  private sanitizeReturnPath(path: string): string | null {
    if (!path) return null;

    let decoded: string;

    try {
      decoded = decodeURIComponent(path);
    } catch {
      return null;
    }

    if (!decoded.startsWith('/') || decoded.startsWith('//')) return null;
    if (/[<>'"\\]/.test(decoded)) return null;

    const blocked = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email'];

    for (const p of blocked) {
      if (decoded === p || decoded.startsWith(`${p}?`) || decoded.startsWith(`${p}/`)) {
        return null;
      }
    }

    return decoded.length > 800 ? decoded.slice(0, 800) : decoded;
  }

  /**
   * Refresh JWT token.
   */
  private async refreshToken(): Promise<boolean> {
    try {
      const rt = this.refreshTokenValue;

      const frontendApiKey =
        typeof window === 'undefined'
          ? process.env.FRONTEND_API_KEY || ''
          : process.env.NEXT_PUBLIC_FRONTEND_API_KEY || '';

      const response = await fetch(`${this.getCurrentBaseUrl().replace(/\/+$/, '')}/auth/refresh`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'X-Country-Id': process.env.NEXT_PUBLIC_DEFAULT_COUNTRY_ID || '1',
          ...(frontendApiKey ? { 'X-Frontend-Key': frontendApiKey } : {}),
          ...(typeof window === 'undefined' ? { Host: getApiHostname() } : {}),
        },
        body: rt ? JSON.stringify({ refresh_token: rt }) : JSON.stringify({}),
        credentials: typeof window === 'undefined' ? 'omit' : 'include',
        cache: 'no-store',
      });

      if (response.ok) {
        const data = await this.parseResponseBody(response, `${this.getCurrentBaseUrl()}/auth/refresh`);
        const newToken = data?.token ?? data?.data?.token;
        const newRefresh = data?.refresh_token ?? data?.data?.refresh_token;

        if (newToken) {
          await this.persistToken(newToken, newRefresh ?? rt ?? undefined);
          return true;
        }
      }

      return false;
    } catch (err) {
      console.error('Failed to refresh token:', err);
      return false;
    }
  }

  private handleUnauthorizedRedirect(): void {
    this.setToken(null);

    if (typeof window === 'undefined') return;

    try {
      localStorage.removeItem('auth-storage');
    } catch {}

    const currentPath = window.location.pathname;
    if (!currentPath.startsWith('/dashboard')) return;

    const ret = this.sanitizeReturnPath(window.location.pathname + window.location.search);
    window.location.href = ret ? `/login?return=${encodeURIComponent(ret)}` : '/login';
  }

  private async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const bypassSessionGate = this.shouldBypassSessionGate(endpoint);

    if (typeof window !== 'undefined' && !this.sessionRestored && !bypassSessionGate) {
      await this.sessionReadyPromise;
    }

    const { params, timeout, retries, suppressAuthRedirect, ...fetchOptions } = options;
    const url = this.buildUrl(endpoint, params);
    const isGetRequest = !fetchOptions.method || fetchOptions.method === 'GET';
    const isServerSide = typeof window === 'undefined';

    const headers: HeadersInit = {
      Accept: 'application/json',
      'X-App-Locale': 'ar',
      'X-Requested-With': 'XMLHttpRequest',
      ...(options.headers || {}),
    };

    if (!isGetRequest) {
      (headers as Record<string, string>)['Content-Type'] = 'application/json';
    }

    const frontendApiKey = isServerSide
      ? process.env.FRONTEND_API_KEY
      : process.env.NEXT_PUBLIC_FRONTEND_API_KEY;

    if (frontendApiKey) {
      (headers as Record<string, string>)['X-Frontend-Key'] = frontendApiKey;
    }

    const countryMap: Record<string, string> = {
      jo: '1',
      sa: '2',
      eg: '3',
      ps: '4',
    };

    const defaultCountryId = process.env.NEXT_PUBLIC_DEFAULT_COUNTRY_ID || '1';

    if (defaultCountryId) {
      (headers as Record<string, string>)['X-Country-Id'] = defaultCountryId;
    }

    if (params?.country_id) {
      (headers as Record<string, string>)['X-Country-Id'] = String(params.country_id);
    } else if (params?.country) {
      const cv = String(params.country);
      const mappedId = countryMap[cv];
      (headers as Record<string, string>)['X-Country-Id'] = mappedId ?? cv;
      if (mappedId) (headers as Record<string, string>)['X-Country-Code'] = cv;
    } else if (params?.database) {
      const dbCode = String(params.database);
      (headers as Record<string, string>)['X-Country-Code'] = dbCode;
      const countryId = countryMap[dbCode];

      if (countryId) {
        (headers as Record<string, string>)['X-Country-Id'] = countryId;
      }
    } else if (typeof window !== 'undefined') {
      try {
        const countryStorage = localStorage.getItem('country-storage');

        if (countryStorage) {
          const parsed: unknown = JSON.parse(countryStorage);
          const state =
            parsed && typeof parsed === 'object' && 'state' in parsed
              ? (parsed as { state?: { country?: { id?: string; code?: string } } }).state
              : undefined;

          if (state?.country?.id) {
            (headers as Record<string, string>)['X-Country-Id'] = state.country.id;
            (headers as Record<string, string>)['X-Country-Code'] = state.country.code ?? '';
          }
        }
      } catch {
        // ignore invalid localStorage data
      }
    }

    const token = this.getToken();

    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    if (isServerSide) {
      (headers as Record<string, string>)['Host'] = getApiHostname();
    }

    const fetchConfig: RequestInit & { next?: { revalidate?: number | false } } = {
      ...fetchOptions,
      headers,
      credentials: isServerSide ? 'omit' : 'include',
    };

    if (isServerSide && isGetRequest && !token) {
      if (fetchConfig.cache !== 'no-store' && fetchConfig.cache !== 'no-cache' && !fetchConfig.next) {
        fetchConfig.next = { revalidate: 60 };
      }
    }

    try {
      const response = await this.fetchWithRetry(
        url,
        fetchConfig,
        retries ?? this.maxRetries,
        timeout
      );

      const data = await this.parseResponseBody(response, url);

      if (!response.ok) {
        if (response.status === 401 && !suppressAuthRedirect) {
          const refreshed = await this.refreshToken();

          if (refreshed) {
            (headers as Record<string, string>)['Authorization'] = `Bearer ${this.token}`;
            fetchConfig.headers = headers;

            const retryResponse = await this.fetchWithRetry(
              url,
              fetchConfig,
              this.maxRetries,
              timeout
            );

            if (retryResponse.ok) {
              const retryData = await this.parseResponseBody(retryResponse, url);

              return {
                data: retryData,
                status: retryResponse.status,
                success: true,
              } as ApiResponse<T>;
            }
          }

          this.handleUnauthorizedRedirect();
        }

        if (response.status === 403 && typeof window !== 'undefined') {
          toast(data?.message || 'ليس لديك صلاحية للوصول إلى هذا المورد', {
            icon: '🔒',
            duration: 4000,
            style: {
              background: '#fef3c7',
              color: '#92400e',
              borderRadius: '12px',
              border: '1px solid #f59e0b',
              fontFamily: 'inherit',
              fontSize: '14px',
              fontWeight: '500',
              direction: 'rtl',
            },
          });
        }

        const err = new Error((data && data.message) || 'حدث خطأ ما');
        (err as any).status = response.status;
        (err as any).isForbidden = response.status === 403;
        (err as any).errors = data ? data.errors : null;
        throw err;
      }

      return {
        data,
        status: response.status,
        success: true,
      };
    } catch (error: any) {
      if (error && error.status) {
        throw error;
      }

      const err = new Error(
        error.name === 'AbortError'
          ? 'انتهت مهلة الاتصال - يرجى المحاولة مرة أخرى'
          : error.message || 'خطأ في الاتصال بالخادم'
      );

      (err as any).status = error.status ?? 500;
      (err as any).errors = error.errors ?? null;
      (err as any).responsePreview = error.responsePreview ?? null;
      throw err;
    }
  }

  private getCacheKey(endpoint: string, params?: Record<string, any>): string {
    return `${endpoint}${params ? JSON.stringify(params) : ''}`;
  }

  private getFromCache<T>(key: string): ApiResponse<T> | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const now = Date.now();

    if (now - cached.timestamp > this.cacheTimeout) {
      this.cache.delete(key);
      return null;
    }

    return cached.data as ApiResponse<T>;
  }

  private setCache<T>(key: string, data: ApiResponse<T>): void {
    this.cache.set(key, { data, timestamp: Date.now() });

    if (this.cache.size > 100) {
      const firstKey = this.cache.keys().next().value;

      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
  }

  async get<T>(
    endpoint: string,
    params?: Record<string, string | number | boolean | undefined>,
    options?: Omit<RequestOptions, 'method' | 'params'>
  ): Promise<ApiResponse<T>> {
    const cacheMode = options?.cache;

    const shouldUseMemoryCache =
      typeof window !== 'undefined' &&
      cacheMode !== 'no-store' &&
      cacheMode !== 'no-cache' &&
      cacheMode !== 'reload';

    const cacheKey = this.getCacheKey(endpoint, params);
    const cached = shouldUseMemoryCache ? this.getFromCache<T>(cacheKey) : null;

    if (cached) {
      return cached;
    }

    const requestKey = `GET:${cacheKey}`;
    const existing = this.inFlightGetRequests.get(requestKey) as
      | Promise<ApiResponse<T>>
      | undefined;

    if (existing) {
      return existing;
    }

    const requestPromise = this.request<T>(endpoint, {
      method: 'GET',
      params,
      ...options,
    })
      .then((response) => {
        if (shouldUseMemoryCache) {
          this.setCache(cacheKey, response);
        }

        return response;
      })
      .finally(() => {
        this.inFlightGetRequests.delete(requestKey);
      });

    this.inFlightGetRequests.set(requestKey, requestPromise as Promise<ApiResponse<any>>);
    return requestPromise;
  }

  async post<T>(
    endpoint: string,
    data?: any,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    const response = await this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });

    this.clearCache();
    return response;
  }

  async put<T>(
    endpoint: string,
    data?: any,
    options?: Omit<RequestOptions, 'method'>
  ): Promise<ApiResponse<T>> {
    const response = await this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });

    this.clearCache();
    return response;
  }

  async patch<T>(
    endpoint: string,
    data?: any,
    options?: Omit<RequestOptions, 'method'>
  ): Promise<ApiResponse<T>> {
    const response = await this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });

    this.clearCache();
    return response;
  }

  async delete<T>(
    endpoint: string,
    params?: Record<string, string | number | boolean | undefined>
  ): Promise<ApiResponse<T>> {
    const response = await this.request<T>(endpoint, {
      method: 'DELETE',
      params,
    });

    this.clearCache();
    return response;
  }

  clearCache(): void {
    this.cache.clear();
  }

  async upload<T>(
    endpoint: string,
    formData: FormData,
    params?: Record<string, string | number | boolean | undefined>
  ): Promise<ApiResponse<T>> {
    if (
      typeof window !== 'undefined' &&
      !this.sessionRestored &&
      !this.shouldBypassSessionGate(endpoint)
    ) {
      await this.sessionReadyPromise;
    }

    const url = this.buildUrl(endpoint, params);
    const baseUrl = this.getCurrentBaseUrl().replace(/\/+$/, '');

    const headers: HeadersInit = {
      Accept: 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    };

    const frontendApiKey =
      typeof window === 'undefined'
        ? process.env.FRONTEND_API_KEY
        : process.env.NEXT_PUBLIC_FRONTEND_API_KEY;

    if (frontendApiKey) {
      (headers as Record<string, string>)['X-Frontend-Key'] = frontendApiKey;
    }

    if (typeof window === 'undefined') {
      (headers as Record<string, string>)['Host'] = getApiHostname();
    }

    const token = this.getToken();

    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    let response = await this.fetchWithRetry(url, {
      method: 'POST',
      headers,
      body: formData,
      credentials: typeof window === 'undefined' ? 'omit' : 'include',
    });

    let data: any = null;

    try {
      data = await this.parseResponseBody(response, url);
    } catch (error) {
      if (response.ok) throw error;
      data = null;
    }

    if (!response.ok) {
      if (response.status === 401) {
        this.handleUnauthorizedRedirect();
      }

      if (response.status === 404 && baseUrl.endsWith('/api')) {
        const altBase = baseUrl.slice(0, -4);
        const altUrl = new URL(`${altBase}${endpoint}`).toString();

        response = await fetch(altUrl, {
          method: 'POST',
          headers,
          body: formData,
          credentials: typeof window === 'undefined' ? 'omit' : 'include',
        });

        try {
          data = await this.parseResponseBody(response, altUrl);
        } catch {
          data = null;
        }

        if (!response.ok) {
          if (response.status === 401) {
            this.handleUnauthorizedRedirect();
          }

          const err = new Error((data && data.message) || 'حدث خطأ ما');
          (err as any).status = response.status;
          (err as any).isForbidden = response.status === 403;
          (err as any).errors = data ? data.errors : null;
          throw err;
        }
      } else {
        const err = new Error((data && data.message) || 'حدث خطأ ما');
        (err as any).status = response.status;
        (err as any).isForbidden = response.status === 403;
        (err as any).errors = data ? data.errors : null;
        throw err;
      }
    }

    this.clearCache();

    return {
      data,
      status: response.status,
      success: true,
    } as ApiResponse<T>;
  }
}

export const apiClient = new ApiClient();
export default apiClient;