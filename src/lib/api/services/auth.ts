import { apiClient } from '../client';
import { API_ENDPOINTS } from '../config';
import type { User, LoginCredentials, RegisterData, AuthResponse } from '@/types';

let inFlightMe: Promise<User> | null = null;
let cachedMe: { user: User; at: number } | null = null;

const ME_CACHE_TTL_MS = 5 * 60 * 1000;

type RawAuthPayload = {
  success?: boolean;
  status?: boolean;
  message?: string;
  token?: string;
  refresh_token?: string;
  user?: User;
  data?: any;
};

/**
 * Extract user object from different backend response shapes.
 *
 * Supported Fiber shapes:
 * 1) {
 *      success: true,
 *      message: "...",
 *      token: "...",
 *      refresh_token: "...",
 *      data: { id, name, email, ... }
 *    }
 *
 * 2) {
 *      success: true,
 *      message: "...",
 *      data: {
 *        token: "...",
 *        refresh_token: "...",
 *        user: { id, name, email, ... }
 *      }
 *    }
 *
 * 3) Legacy:
 *    { token, user }
 */
function extractUser(raw: RawAuthPayload): User | null {
  if (!raw || typeof raw !== 'object') return null;

  if (raw.data?.user && typeof raw.data.user === 'object') {
    return raw.data.user as User;
  }

  if (raw.user && typeof raw.user === 'object') {
    return raw.user as User;
  }

  if (raw.data && typeof raw.data === 'object' && 'id' in raw.data) {
    return raw.data as User;
  }

  if ('id' in raw) {
    return raw as unknown as User;
  }

  return null;
}

/**
 * Extract JWT access token from different backend response shapes.
 */
function extractToken(raw: RawAuthPayload): string {
  if (!raw || typeof raw !== 'object') return '';

  return String(
    raw.token ??
      raw.data?.token ??
      ''
  );
}

/**
 * Extract refresh token from different backend response shapes.
 */
function extractRefreshToken(raw: RawAuthPayload): string {
  if (!raw || typeof raw !== 'object') return '';

  return String(
    raw.refresh_token ??
      raw.data?.refresh_token ??
      ''
  );
}

/**
 * Normalize the backend auth response into the frontend AuthResponse shape.
 */
async function normalizeAndPersistAuthResponse(responseData: unknown): Promise<AuthResponse> {
  if (!responseData || typeof responseData !== 'object') {
    throw new Error('استجابة تسجيل الدخول غير صالحة من الخادم');
  }

  const raw = responseData as RawAuthPayload;

  const token = extractToken(raw);
  const refreshToken = extractRefreshToken(raw);
  const user = extractUser(raw);

  if (!token) {
    throw new Error(raw.message || 'لم يتم استلام رمز تسجيل الدخول من الخادم');
  }

  if (!user) {
    throw new Error(raw.message || 'لم يتم استلام بيانات المستخدم من الخادم');
  }

  await apiClient.persistToken(token, refreshToken || undefined);

  cachedMe = {
    user,
    at: Date.now(),
  };

  return {
    status: raw.success ?? raw.status ?? true,
    message: raw.message ?? '',
    token,
    user,
  };
}

/**
 * Normalize current-user response.
 */
function normalizeUserResponse(responseData: unknown): User {
  if (!responseData || typeof responseData !== 'object') {
    throw new Error('Invalid response format');
  }

  const raw = responseData as any;

  if (raw.data && typeof raw.data === 'object' && 'id' in raw.data) {
    return raw.data as User;
  }

  if (raw.data?.user && typeof raw.data.user === 'object') {
    return raw.data.user as User;
  }

  if (raw.user && typeof raw.user === 'object') {
    return raw.user as User;
  }

  if ('id' in raw) {
    return raw as User;
  }

  throw new Error('Invalid response format');
}

/**
 * Normalize simple message response.
 */
function normalizeMessageResponse(responseData: unknown): { message: string } {
  if (!responseData || typeof responseData !== 'object') {
    return { message: '' };
  }

  const raw = responseData as any;

  if (raw.data?.message) {
    return { message: String(raw.data.message) };
  }

  if (raw.message) {
    return { message: String(raw.message) };
  }

  return { message: '' };
}

export const authService = {
  /**
   * Login user with credentials.
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiClient.post<any>(
      API_ENDPOINTS.AUTH.LOGIN,
      credentials,
      {
        cache: 'no-store',
      }
    );

    return normalizeAndPersistAuthResponse(response.data);
  },

  /**
   * Register new user.
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await apiClient.post<any>(
      API_ENDPOINTS.AUTH.REGISTER,
      data,
      {
        cache: 'no-store',
      }
    );

    return normalizeAndPersistAuthResponse(response.data);
  },

  /**
   * Logout current user.
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post(
        API_ENDPOINTS.AUTH.LOGOUT,
        undefined,
        {
          suppressAuthRedirect: true,
          cache: 'no-store',
        }
      );
    } finally {
      cachedMe = null;
      inFlightMe = null;
      await apiClient.persistToken(null);
    }
  },

  /**
   * Get current authenticated user.
   */
  async me(force = false): Promise<User> {
    const now = Date.now();

    if (!force && cachedMe && now - cachedMe.at < ME_CACHE_TTL_MS) {
      return cachedMe.user;
    }

    if (!force && inFlightMe) {
      return inFlightMe;
    }

    inFlightMe = apiClient
      .get<any>(
        '/auth/user',
        undefined,
        {
          cache: 'no-store',
          suppressAuthRedirect: true,
        }
      )
      .then((response) => {
        const user = normalizeUserResponse(response.data);

        cachedMe = {
          user,
          at: Date.now(),
        };

        return user;
      })
      .finally(() => {
        inFlightMe = null;
      });

    return inFlightMe;
  },

  /**
   * Update current user's profile.
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
      if (value === undefined || value === null) return;

      if (value instanceof File) {
        formData.append(key, value);
        return;
      }

      if (key === 'social_links' && typeof value === 'object') {
        Object.entries(value).forEach(([k, v]) => {
          formData.append(`social_links[${k}]`, String(v || ''));
        });
        return;
      }

      formData.append(key, String(value));
    });

    const response = await apiClient.upload<any>(
      '/auth/profile',
      formData
    );

    const user = normalizeUserResponse(response.data);

    cachedMe = {
      user,
      at: Date.now(),
    };

    return user;
  },

  /**
   * Send forgot password email.
   */
  async forgotPassword(email: string): Promise<{ message: string }> {
    const response = await apiClient.post<any>(
      API_ENDPOINTS.AUTH.FORGOT_PASSWORD,
      { email },
      {
        cache: 'no-store',
      }
    );

    return normalizeMessageResponse(response.data);
  },

  /**
   * Reset password with token.
   */
  async resetPassword(data: {
    token: string;
    email: string;
    password: string;
    password_confirmation: string;
  }): Promise<{ message: string }> {
    const response = await apiClient.post<any>(
      API_ENDPOINTS.AUTH.RESET_PASSWORD,
      data,
      {
        cache: 'no-store',
      }
    );

    return normalizeMessageResponse(response.data);
  },

  /**
   * Verify email with link parameters.
   */
  async verifyEmail(id: string, token: string): Promise<{ message: string }> {
    const response = await apiClient.get<any>(
      API_ENDPOINTS.AUTH.VERIFY_EMAIL(id, token),
      undefined,
      {
        cache: 'no-store',
      }
    );

    return normalizeMessageResponse(response.data);
  },

  /**
   * Resend verification email.
   */
  async resendVerifyEmail(): Promise<{ message: string }> {
    const response = await apiClient.post<any>(
      API_ENDPOINTS.AUTH.RESEND_VERIFY,
      undefined,
      {
        cache: 'no-store',
      }
    );

    return normalizeMessageResponse(response.data);
  },

  /**
   * Get Google OAuth redirect endpoint.
   */
  getGoogleRedirectUrl(): string {
    return API_ENDPOINTS.AUTH.GOOGLE_REDIRECT;
  },

  /**
   * Handle Google OAuth callback.
   */
  async handleGoogleCallback(code: string): Promise<AuthResponse> {
    const response = await apiClient.get<any>(
      API_ENDPOINTS.AUTH.GOOGLE_CALLBACK,
      { code },
      {
        cache: 'no-store',
      }
    );

    return normalizeAndPersistAuthResponse(response.data);
  },

  /**
   * Clear local auth cache only.
   */
  clearCache(): void {
    cachedMe = null;
    inFlightMe = null;
  },
};

export default authService;