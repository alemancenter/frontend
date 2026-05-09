import toast from 'react-hot-toast';
import { API_CONFIG, getApiHostname } from './config';
import { universalFetch, shouldUseInternalFetch } from './internal-fetch';

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
  timeout?: number;
  /** Override the number of retry attempts for this request (default: 3). Pass 0 to disable retries. */
  retries?: number;
  /** When true, a 401 response will NOT clear the session or redirect to login. Use for background/polling requests. */
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
  // Persistence across page refreshes is handled by HttpOnly cookies set via /api/auth/session.
  private token: string | null = null;
  private refreshTokenValue: string | null = null;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private inFlightGetRequests: Map<string, Promise<ApiResponse<any>>> = new Map();
  private cacheTimeout = 300000; // 5 minutes cache (300000ms)
  private requestTimeout = 15000; // 15 seconds timeout
  private maxRetries = 3; // Maximum retry attempts
  private retryDelay = 1000; // Base delay between retries (ms)

  // Session restoration gate — all browser requests wait until restoreFromSession() resolves.
  private sessionRestored = false;
  private sessionReadyResolve!: () => void;
  private sessionReadyPromise: Promise<void>;

  constructor() {
    this.baseUrl = API_CONFIG.BASE_URL;
    if (!/^https?:\/\//i.test(this.baseUrl)) {
      this.baseUrl = 'http://localhost:8000/api';
    }
    // Create the gate promise. On SSR it resolves immediately.
    this.sessionReadyPromise = new Promise<void>((resolve) => {
      this.sessionReadyResolve = resolve;
    });
    if (typeof window === 'undefined') {
      this.sessionRestored = true;
      this.sessionReadyResolve();
    }
  }

  private markSessionReady() {
    if (!this.sessionRestored) {
      this.sessionRestored = true;
      this.sessionReadyResolve();
    }
  }

  /**
   * Get the appropriate base URL based on current execution context
   * - Server-side (SSR): Uses internal URL (localhost) for faster connection
   * - Client-side (Browser): Uses public URL
   */
  private getCurrentBaseUrl(): string {
    if (typeof window === 'undefined') {
      // Server-side: use internal URL for faster localhost connection
      return API_CONFIG.INTERNAL_URL;
    }
    // Client-side: use public URL
    return this.baseUrl;
  }

  // Fetch with timeout
  // Uses universalFetch for localhost HTTPS with SSL bypass (SSR internal requests)
  private async fetchWithTimeout(
    url: string,
    options: RequestInit,
    timeout: number = this.requestTimeout
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      // Check if we should use internal fetch (localhost with SSL bypass)
      const useInternalFetch = shouldUseInternalFetch(url);

      if (useInternalFetch) {
        // For internal fetch, handle timeout differently (it has its own timeout)
        clearTimeout(timeoutId);
        const response = await universalFetch(url, {
          ...options,
          timeout,
        } as RequestInit & { timeout?: number });
        return response;
      }

      // Standard fetch for external URLs
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // Retry logic with exponential backoff
  private async fetchWithRetry(
    url: string,
    options: RequestInit,
    retries: number = this.maxRetries,
    timeout: number = this.requestTimeout
  ): Promise<Response> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await this.fetchWithTimeout(url, options, timeout);
        return response;
      } catch (error: any) {
        lastError = error;

        // Don't retry on abort (user cancelled) or non-network errors
        if (error.name === 'AbortError') {
          // Timeout - worth retrying
          console.warn(`Request timeout (attempt ${attempt + 1}/${retries + 1}): ${url}`);
        } else if (error.message?.includes('fetch failed') || error.message?.includes('ECONNRESET')) {
          // Network error - worth retrying
          console.warn(`Network error (attempt ${attempt + 1}/${retries + 1}): ${url}`);
        } else {
          // Other errors - don't retry
          throw error;
        }

        // Don't wait after the last attempt
        if (attempt < retries) {
          // Exponential backoff with jitter
          const delay = this.retryDelay * Math.pow(2, attempt) + Math.random() * 500;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // All retries failed
    throw lastError || new Error('Request failed after retries');
  }

  private setLocalToken(token: string | null, refreshToken?: string | null) {
    this.token = token;
    if (token === null) {
      this.refreshTokenValue = null;
    } else if (refreshToken !== undefined) {
      this.refreshTokenValue = refreshToken;
    }
  }

  setToken(token: string | null) {
    this.setLocalToken(token);
    void this.syncAuthCookie(token, null);
  }

  async persistToken(token: string | null, refreshToken?: string): Promise<void> {
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
          ? JSON.stringify({ token, ...(refreshToken ? { refresh_token: refreshToken } : {}) })
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
   * Restore the in-memory token from the HttpOnly cookie by calling the server-side session route.
   * Must be called once on app startup (page refresh) so the client can make authenticated requests.
   * Returns true if a valid session was found, false if the user is not authenticated.
   */
  async restoreFromSession(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    try {
      const res = await fetch('/api/auth/session', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      });
      if (!res.ok) { this.markSessionReady(); return false; }
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

  private buildUrl(endpoint: string, params?: Record<string, string | number | boolean | undefined>): string {
    // Handle dynamic endpoints that already contain parameters in the path
    let finalEndpoint = endpoint;
    const baseUrl = this.getCurrentBaseUrl();

    if (params) {
      // Replace path parameters first (e.g., :id, {id})
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && finalEndpoint.includes(`:${key}`)) {
          finalEndpoint = finalEndpoint.replace(`:${key}`, String(value));
        } else if (value !== undefined && finalEndpoint.includes(`{${key}}`)) {
          finalEndpoint = finalEndpoint.replace(`{${key}}`, String(value));
        }
      });

      // Then add remaining params as query parameters
      const url = new URL(`${baseUrl}${finalEndpoint}`);
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && !finalEndpoint.includes(`:${key}`) && !finalEndpoint.includes(`{${key}}`)) {
          url.searchParams.append(key, String(value));
        }
      });
      return url.toString();
    }

    return `${baseUrl}${finalEndpoint}`;
  }

  private sanitizeReturnPath(path: string): string | null {
    if (!path) return null;
    // Decode first to prevent bypass via percent-encoding (e.g. /%2F%2Fevil.com)
    let decoded: string;
    try {
      decoded = decodeURIComponent(path);
    } catch {
      return null;
    }
    // Must start with / but NOT // (to prevent protocol-relative URLs like //evil.com)
    if (!decoded.startsWith('/') || decoded.startsWith('//')) return null;
    // Reject suspicious characters
    if (/[<>'"\\]/.test(decoded)) return null;

    const blocked = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email'];
    for (const p of blocked) {
      if (decoded === p || decoded.startsWith(`${p}?`) || decoded.startsWith(`${p}/`)) {
        return null;
      }
    }

    if (decoded.length > 800) return decoded.slice(0, 800);
    return decoded;
  }

  /**
   * Automatically refresh the JWT token
   */
  private async refreshToken(): Promise<boolean> {
    try {
      const rt = this.refreshTokenValue;
      const frontendApiKey = process.env.NEXT_PUBLIC_FRONTEND_API_KEY || '';

      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'X-Country-Id': process.env.NEXT_PUBLIC_DEFAULT_COUNTRY_ID || '1',
          ...(frontendApiKey ? { 'X-Frontend-Key': frontendApiKey } : {}),
        },
        // If in-memory refresh token exists send it in the body.
        // Otherwise the backend will read it from the HttpOnly refresh_token cookie
        // (sent automatically because credentials:'include').
        body: rt ? JSON.stringify({ refresh_token: rt }) : JSON.stringify({}),
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
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

  private handleUnauthorizedRedirect() {
    this.setToken(null);
    // syncAuthCookie is called inside setToken — clears both HttpOnly cookies

    if (typeof window === 'undefined') return;

    // Clear Zustand auth store to prevent stale isAuthenticated state in the UI
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
    // Wait for session restoration before making any request on the browser.
    // This prevents 401s when the dashboard mounts before restoreFromSession() finishes.
    if (typeof window !== 'undefined' && !this.sessionRestored) {
      await this.sessionReadyPromise;
    }

    const { params, timeout, retries, suppressAuthRedirect, ...fetchOptions } = options;
    const url = this.buildUrl(endpoint, params);
    const isGetRequest = !fetchOptions.method || fetchOptions.method === 'GET';

    // Build headers - don't send Content-Type for GET requests (no body)
    const headers: HeadersInit = {
      Accept: 'application/json',
      'X-App-Locale': 'ar',
      'X-Requested-With': 'XMLHttpRequest',
      ...(options.headers || {}),
    };

    // Only add Content-Type for requests with body (POST, PUT, PATCH)
    if (!isGetRequest) {
      (headers as Record<string, string>)['Content-Type'] = 'application/json';
    }

    // Add Frontend API Key — prefer server-only var on SSR to avoid leaking the public key in SSR logs
    const frontendApiKey = typeof window === 'undefined'
      ? process.env.FRONTEND_API_KEY
      : process.env.NEXT_PUBLIC_FRONTEND_API_KEY;
    if (frontendApiKey) {
      (headers as Record<string, string>)['X-Frontend-Key'] = frontendApiKey;
    }

    // Add Country Header
    // Priority: explicit params.country_id > params.country > params.database > localStorage / SSR default
    const countryMap: Record<string, string> = { 'jo': '1', 'sa': '2', 'eg': '3', 'ps': '4' };
    const defaultCountryId = process.env.NEXT_PUBLIC_DEFAULT_COUNTRY_ID || '1';
    if (defaultCountryId) {
      (headers as Record<string, string>)['X-Country-Id'] = defaultCountryId;
    }

    if (params?.country_id) {
      // Explicit override — works on both browser and SSR (e.g. dashboard form country picker)
      (headers as Record<string, string>)['X-Country-Id'] = String(params.country_id);
    } else if (params?.country) {
      // params.country may be a code ('jo') or a numeric ID ('1') — normalise to ID
      const cv = String(params.country);
      const mappedId = countryMap[cv];
      (headers as Record<string, string>)['X-Country-Id'] = mappedId ?? cv;
      if (mappedId) (headers as Record<string, string>)['X-Country-Code'] = cv;
    } else if (params?.database) {
      (headers as Record<string, string>)['X-Country-Code'] = String(params.database);
      const countryId = countryMap[String(params.database)];
      if (countryId) {
        (headers as Record<string, string>)['X-Country-Id'] = countryId;
      }
    } else if (typeof window !== 'undefined') {
      // Browser fallback: read from localStorage
      try {
        const countryStorage = localStorage.getItem('country-storage');
        if (countryStorage) {
          const parsed: unknown = JSON.parse(countryStorage);
          const state = parsed && typeof parsed === 'object' && 'state' in parsed
            ? (parsed as { state?: { country?: { id?: string; code?: string } } }).state
            : undefined;
          if (state?.country?.id) {
            (headers as Record<string, string>)['X-Country-Id'] = state.country.id;
            (headers as Record<string, string>)['X-Country-Code'] = state.country.code ?? '';
          }
        }
      } catch {
        // ignore
      }
    }

    const token = this.getToken();
    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    // Use Next.js cache for server-side GET requests without auth
    const isServerSide = typeof window === 'undefined';

    // Add Host header for SSR internal requests (Nginx routing)
    if (isServerSide) {
      (headers as Record<string, string>)['Host'] = getApiHostname();
    }

    const fetchConfig: RequestInit & { next?: { revalidate?: number | false } } = {
      ...fetchOptions,
      headers,
      // Include credentials for CORS requests (cookies, auth headers)
      credentials: isServerSide ? 'omit' : 'include',
    };

    // Enable Next.js caching for public GET requests on server
    if (isServerSide && isGetRequest && !token) {
      // Only add default revalidate if no cache control is specified
      if (fetchConfig.cache !== 'no-store' && fetchConfig.cache !== 'no-cache' && !fetchConfig.next) {
        fetchConfig.next = { revalidate: 60 }; // Cache for 60 seconds
      }
    }

    try {
      // Use retry mechanism for better reliability
      const response = await this.fetchWithRetry(url, fetchConfig, retries ?? this.maxRetries, timeout);

      let data: any;
      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (!response.ok) {
        if (response.status === 401 && !suppressAuthRedirect) {
          // Try to refresh token
          const refreshed = await this.refreshToken();
          if (refreshed) {
            // Re-attempt original request with new token
            (headers as Record<string, string>)['Authorization'] = `Bearer ${this.token}`;
            fetchConfig.headers = headers;
            const retryResponse = await this.fetchWithRetry(url, fetchConfig, this.maxRetries, timeout);
            if (retryResponse.ok) {
              const retryData = await retryResponse.json().catch(() => null);
              return { data: retryData, status: retryResponse.status, success: true } as ApiResponse<T>;
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
      if (error && (error as any).status) {
        throw error as any;
      }
      // More descriptive error message
      const err = new Error(
        error.name === 'AbortError'
          ? 'انتهت مهلة الاتصال - يرجى المحاولة مرة أخرى'
          : 'خطأ في الاتصال بالخادم'
      );
      (err as any).status = 500;
      (err as any).errors = null;
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

    // Clear old cache entries (keep only last 100)
    if (this.cache.size > 100) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
  }

  async get<T>(endpoint: string, params?: Record<string, string | number | boolean | undefined>, options?: Omit<RequestOptions, 'method' | 'params'>) {
    const cacheMode = options?.cache;
    const shouldUseMemoryCache =
      typeof window !== 'undefined' &&
      cacheMode !== 'no-store' &&
      cacheMode !== 'no-cache' &&
      cacheMode !== 'reload';

    // Check cache for GET requests (browser only)
    const cacheKey = this.getCacheKey(endpoint, params);
    const cached = shouldUseMemoryCache ? this.getFromCache<T>(cacheKey) : null;

    // Return cached data if available and caching is allowed
    if (cached) {
      return cached;
    }

    const requestKey = `GET:${cacheKey}`;
    const existing = this.inFlightGetRequests.get(requestKey) as Promise<ApiResponse<T>> | undefined;
    if (existing) {
      return existing;
    }

    const requestPromise = this.request<T>(endpoint, { method: 'GET', params, ...options })
      .then((response) => {
        // Cache successful GET requests only when allowed (browser only)
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

  async post<T>(endpoint: string, data?: any, options?: RequestOptions) {
    const response = await this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
    // Clear cache after mutations
    this.clearCache();
    return response;
  }

  async put<T>(endpoint: string, data?: any, options?: Omit<RequestOptions, 'method'>) {
    const response = await this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
    // Clear cache after mutations
    this.clearCache();
    return response;
  }

  async patch<T>(endpoint: string, data?: any, options?: Omit<RequestOptions, 'method'>) {
    const response = await this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
    // Clear cache after mutations
    this.clearCache();
    return response;
  }

  async delete<T>(endpoint: string, params?: Record<string, string | number | boolean | undefined>) {
    const response = await this.request<T>(endpoint, { method: 'DELETE', params });
    // Clear cache after successful delete operations
    this.clearCache();
    return response;
  }

  // Clear all cached data
  clearCache() {
    this.cache.clear();
    // Do not abort in-flight GETs; just prevent stale cache reuse after mutations.
  }

  // Upload file with FormData
  async upload<T>(endpoint: string, formData: FormData, params?: Record<string, string | number | boolean | undefined>) {
    if (typeof window !== 'undefined' && !this.sessionRestored) {
      await this.sessionReadyPromise;
    }
    const url = this.buildUrl(endpoint, params);
    const baseUrl = this.getCurrentBaseUrl();
    const headers: HeadersInit = {
      Accept: 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    };

    // Add Frontend API Key — prefer server-only var on SSR
    const frontendApiKey = typeof window === 'undefined'
      ? process.env.FRONTEND_API_KEY
      : process.env.NEXT_PUBLIC_FRONTEND_API_KEY;
    if (frontendApiKey) {
      (headers as Record<string, string>)['X-Frontend-Key'] = frontendApiKey;
    }

    // Add Host header for SSR internal requests
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
    });

    let data: any = null;
    try {
      data = await response.json();
    } catch {}

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
        });
        try {
          data = await response.json();
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
        if (response.status === 401) {
          this.handleUnauthorizedRedirect();
        }
        const err = new Error((data && data.message) || 'حدث خطأ ما');
        (err as any).status = response.status;
        (err as any).isForbidden = response.status === 403;
        (err as any).errors = data ? data.errors : null;
        throw err;
      }
    }

    // Clear cache after successful upload
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
