import { apiClient } from '../client';
import { API_ENDPOINTS } from '../config';
import type { User, LoginCredentials, RegisterData, AuthResponse } from '@/types';

let inFlightMe: Promise<User> | null = null;
let cachedMe: { user: User; at: number } | null = null;
const ME_CACHE_TTL_MS = 5 * 60 * 1000;


export const authService = {
  /**
   * Login user with credentials
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiClient.post(API_ENDPOINTS.AUTH.LOGIN, credentials);
    const raw = response.data as any;
    // Fiber envelope: { success, message, token, refresh_token, data: { user fields } }
    const token: string = raw.token ?? raw.data?.token ?? '';
    const refreshToken: string = raw.refresh_token ?? raw.data?.refresh_token ?? '';
    const user: User = raw.data ?? raw.user ?? raw;
    if (token) {
      await apiClient.persistToken(token, refreshToken);
    }
    cachedMe = { user, at: Date.now() };
    return { status: raw.success ?? true, message: raw.message ?? '', token, user };
  },

  /**
   * Register new user
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await apiClient.post(API_ENDPOINTS.AUTH.REGISTER, data);
    const raw = response.data as any;
    const token: string = raw.token ?? raw.data?.token ?? '';
    const refreshToken: string = raw.refresh_token ?? raw.data?.refresh_token ?? '';
    const user: User = raw.data ?? raw.user ?? raw;
    if (token) {
      await apiClient.persistToken(token, refreshToken);
    }
    cachedMe = { user, at: Date.now() };
    return { status: raw.success ?? true, message: raw.message ?? '', token, user };
  },

  /**
   * Logout current user
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT, undefined, { suppressAuthRedirect: true });
    } finally {
      cachedMe = null;
      inFlightMe = null;
      await apiClient.persistToken(null);
    }
  },

  /**
   * Get current authenticated user
   */
  async me(force = false): Promise<User> {
    const now = Date.now();
    if (!force && cachedMe && now - cachedMe.at < ME_CACHE_TTL_MS) {
      return cachedMe.user;
    }
    if (!force && inFlightMe) return inFlightMe;

    inFlightMe = apiClient.get('/auth/user', undefined, { cache: 'force-cache' })
      .then((response) => {
        const raw = response.data as any;
        let user: User | null = null;
        if (raw.data && typeof raw.data === 'object' && 'id' in raw.data) user = raw.data as User;
        else if (raw.data?.user) user = raw.data.user as User;
        else if (raw.user) user = raw.user as User;
        if (!user) throw new Error('Invalid response format');
        cachedMe = { user, at: Date.now() };
        return user;
      })
      .finally(() => { inFlightMe = null; });

    return inFlightMe;
  },

  /**
   * Update current user's profile (doesn't require admin permissions)
   */
  async updateProfile(data: {
    name?: string;
    email?: string;
    phone?: string;
    bio?: string;
    profile_photo?: File;
    job_title?: string;
    gender?: string;
    country?: string;
    password?: string;
    password_confirmation?: string;
    social_links?: Record<string, string>;
  }): Promise<User> {
    const formData = new FormData();
    formData.append('_method', 'PUT');

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (value instanceof File) {
          formData.append(key, value);
        } else if (key === 'social_links' && typeof value === 'object') {
          Object.entries(value).forEach(([k, v]) => {
            formData.append(`social_links[${k}]`, String(v || ''));
          });
        } else {
          formData.append(key, String(value));
        }
      }
    });

    const response = await apiClient.upload<{ data: User } | User>(
      '/auth/profile',
      formData
    );
    return 'data' in response.data ? response.data.data : response.data;
  },

  /**
   * Send forgot password email
   */
  async forgotPassword(email: string): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string } | { data: { message: string } }>(
      API_ENDPOINTS.AUTH.FORGOT_PASSWORD,
      { email }
    );
    return 'data' in response.data ? response.data.data : response.data;
  },

  /**
   * Reset password with token
   */
  async resetPassword(data: {
    token: string;
    email: string;
    password: string;
    password_confirmation: string;
  }): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string } | { data: { message: string } }>(
      API_ENDPOINTS.AUTH.RESET_PASSWORD,
      data
    );
    return 'data' in response.data ? response.data.data : response.data;
  },

  /**
   * Verify email with link parameters
   */
  async verifyEmail(id: string, token: string): Promise<{ message: string }> {
    const response = await apiClient.get<{ message: string } | { data: { message: string } }>(
      API_ENDPOINTS.AUTH.VERIFY_EMAIL(id, token)
    );
    return 'data' in response.data ? response.data.data : response.data;
  },

  /**
   * Resend verification email
   */
  async resendVerifyEmail(): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string } | { data: { message: string } }>(
      API_ENDPOINTS.AUTH.RESEND_VERIFY
    );
    return 'data' in response.data ? response.data.data : response.data;
  },

  /**
   * Get Google OAuth redirect URL
   */
  getGoogleRedirectUrl(): string {
    return `${API_ENDPOINTS.AUTH.GOOGLE_REDIRECT}`;
  },

  /**
   * Handle Google OAuth callback
   */
  async handleGoogleCallback(code: string): Promise<AuthResponse> {
    const response = await apiClient.get<AuthResponse | { data: AuthResponse }>(
      API_ENDPOINTS.AUTH.GOOGLE_CALLBACK,
      { code }
    );
    const raw = response.data as any;
    const payload = raw.data ?? raw;
    const refreshToken: string = raw.refresh_token ?? raw.data?.refresh_token ?? '';
    if (payload.token) {
      await apiClient.persistToken(payload.token, refreshToken);
    }
    return payload;
  },
};

export default authService;
