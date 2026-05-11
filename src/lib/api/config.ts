// API Configuration
export const API_CONFIG = {
  // Public URL for client-side requests (browser)
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',

  // Internal URL for SSR requests (server-to-server, faster)
  // Uses localhost connection when on same server, bypasses DNS/SSL overhead
  INTERNAL_URL: process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',

  TIMEOUT: 30000,
};

/**
 * Get the appropriate API URL based on execution context
 * - Server-side (SSR): Uses internal URL for faster local connection
 * - Client-side (Browser): Uses public URL
 */
export function getApiUrl(): string {
  if (typeof window === 'undefined') {
    // Server-side: use internal URL
    return API_CONFIG.INTERNAL_URL;
  }
  // Client-side: use public URL
  return API_CONFIG.BASE_URL;
}

/**
 * Get the API hostname for Host header (used in SSR internal requests)
 * Extracts hostname from NEXT_PUBLIC_API_URL or uses API_HOSTNAME env var
 * This ensures Nginx routes the request to the correct virtual host
 */
export function getApiHostname(): string {
  // First check for explicit API_HOSTNAME env var
  if (process.env.API_HOSTNAME) {
    return process.env.API_HOSTNAME;
  }

  // Extract hostname from public API URL
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (apiUrl) {
    try {
      const url = new URL(apiUrl);
      return url.hostname;
    } catch {
      // Invalid URL, fall through to default
    }
  }

  // Default for local development
  return 'localhost';
}

// Available Countries (multi-database support)
export const COUNTRIES = [
  { id: '1', code: 'jo', name: 'الأردن' },
  { id: '2', code: 'sa', name: 'السعودية' },
  { id: '3', code: 'eg', name: 'مصر' },
  { id: '4', code: 'ps', name: 'فلسطين' },
] as const;

export type CountryId = typeof COUNTRIES[number]['id'];
export type CountryCode = typeof COUNTRIES[number]['code'];

// API endpoints mirrored from Go Fiber routes.
// Naming rule: public content uses LIST_PUBLIC/SHOW_PUBLIC; dashboard content uses LIST/SHOW.
export const API_ENDPOINTS = {
  // ========== AUTH ==========
  AUTH: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    ME: '/auth/user',
    FORGOT_PASSWORD: '/auth/password/forgot',
    RESET_PASSWORD: '/auth/password/reset',
    VERIFY_EMAIL: (id: string, token: string) => `/auth/email/verify/${id}/${token}`,
    RESEND_VERIFY: '/auth/email/resend',
    GOOGLE_REDIRECT: '/auth/google/redirect',
    GOOGLE_CALLBACK: '/auth/google/callback',
  },

  // ========== DASHBOARD ==========
  DASHBOARD: {
    INDEX: '/dashboard',
    ANALYTICS: '/dashboard/visitor-analytics',
  },

  // ========== PERFORMANCE ==========
  PERFORMANCE: {
    SUMMARY: '/dashboard/performance/summary',
    LIVE: '/dashboard/performance/live',
    RAW: '/dashboard/performance/raw',
    RESPONSE_TIME: '/dashboard/performance/response-time',
    CACHE: '/dashboard/performance/cache',
    METRICS: '/dashboard/performance/metrics',
  },

  // ========== HOME (Frontend) ==========
  HOME: {
    INDEX: '/home',
    CALENDAR: '/home/calendar',
    EVENT: (id: number | string) => `/home/event/${id}`,
  },

  // ========== FRONTEND ==========
  FRONTEND: {
    CLASSES: '/school-classes',
    CLASS_DETAILS: (id: number | string) => `/school-classes/${id}`,
  },

  // ========== FRONT (Public) ==========
  FRONT: {
    SETTINGS: '/front/settings',
    CONTACT: '/front/contact',
  },

  // ========== FILTER ==========
  FILTER: {
    INDEX: '/filter',
    SUBJECTS_BY_CLASS: (classId: number | string) => `/filter/subjects/${classId}`,
    SEMESTERS_BY_SUBJECT: (subjectId: number | string) => `/filter/semesters/${subjectId}`,
  },

  // ========== SCHOOL CLASSES ==========
  SCHOOL_CLASSES: {
    LIST: '/dashboard/school-classes',
    SHOW: (id: number | string) => `/dashboard/school-classes/${id}`,
    STORE: '/dashboard/school-classes',
    UPDATE: (id: number | string) => `/dashboard/school-classes/${id}`,
    DELETE: (id: number | string) => `/dashboard/school-classes/${id}`,
  },

  // ========== SUBJECTS ==========
  SUBJECTS: {
    LIST: '/dashboard/subjects',
    SHOW: (id: number | string) => `/dashboard/subjects/${id}`,
    STORE: '/dashboard/subjects',
    UPDATE: (id: number | string) => `/dashboard/subjects/${id}`,
    DELETE: (id: number | string) => `/dashboard/subjects/${id}`,
  },

  // ========== SEMESTERS ==========
  SEMESTERS: {
    LIST: '/dashboard/semesters',
    SHOW: (id: number | string) => `/dashboard/semesters/${id}`,
    STORE: '/dashboard/semesters',
    UPDATE: (id: number | string) => `/dashboard/semesters/${id}`,
    DELETE: (id: number | string) => `/dashboard/semesters/${id}`,
  },

  // ========== USERS ==========
  USERS: {
    LIST: '/dashboard/users',
    SEARCH: '/dashboard/users/search',
    SEARCH_PUBLIC: '/user/search',
    SHOW: (id: number | string) => `/dashboard/users/${id}`,
    STORE: '/dashboard/users',
    UPDATE: (id: number | string) => `/dashboard/users/${id}`,
    DELETE: (id: number | string) => `/dashboard/users/${id}`,
    BULK_DELETE: '/dashboard/users/bulk-delete',
    UPDATE_STATUS: '/dashboard/users/update-status',
    UPDATE_ROLES: (id: number | string) => `/dashboard/users/${id}/roles-permissions`,
  },

  // ========== ROLES & PERMISSIONS ==========
  ROLES: {
    LIST: '/dashboard/roles',
    SHOW: (id: number | string) => `/dashboard/roles/${id}`,
    STORE: '/dashboard/roles',
    UPDATE: (id: number | string) => `/dashboard/roles/${id}`,
    DELETE: (id: number | string) => `/dashboard/roles/${id}`,
  },

  PERMISSIONS: {
    LIST: '/dashboard/permissions',
    STORE: '/dashboard/permissions',
    UPDATE: (id: number | string) => `/dashboard/permissions/${id}`,
    DELETE: (id: number | string) => `/dashboard/permissions/${id}`,
  },

  // ========== ARTICLES ==========
  ARTICLES: {
    LIST_PUBLIC: '/articles',
    SHOW_PUBLIC: (id: number | string) => `/articles/${id}`,
    DOWNLOAD: (id: number | string) => `/articles/file/${id}/download`,
    STATS: '/dashboard/articles/stats',
    LIST: '/dashboard/articles',
    CREATE: '/dashboard/articles/create',
    SHOW: (id: number | string) => `/dashboard/articles/${id}`,
    EDIT: (id: number | string) => `/dashboard/articles/${id}/edit`,
    STORE: '/dashboard/articles',
    UPDATE: (id: number | string) => `/dashboard/articles/${id}`,
    DELETE: (id: number | string) => `/dashboard/articles/${id}`,
    PUBLISH: (id: number | string) => `/dashboard/articles/${id}/publish`,
    UNPUBLISH: (id: number | string) => `/dashboard/articles/${id}/unpublish`,
    BY_KEYWORD: (keyword: string) => `/articles/by-keyword/${keyword}`,
    BY_CLASS: (gradeLevel: number | string) => `/articles/by-class/${gradeLevel}`,
    AI_GENERATE: '/ai/generate',
    AI_STATUS: (jobId: string) => `/ai/status/${jobId}`,
  },

  // ========== POSTS ==========
  POSTS: {
    LIST_PUBLIC: '/posts',
    SHOW_PUBLIC: (id: number | string) => `/posts/${id}`,
    INCREMENT_VIEW: (id: number | string) => `/posts/${id}/increment-view`,
    LIST: '/dashboard/posts',
    TOGGLE_STATUS: (id: number | string) => `/dashboard/posts/${id}/toggle-status`,
    STORE: '/dashboard/posts',
    UPDATE: (id: number | string) => `/dashboard/posts/${id}`,
    DELETE: (id: number | string) => `/dashboard/posts/${id}`,
  },

  // ========== KEYWORDS ==========
  KEYWORDS: {
    INDEX: '/keywords',
    SHOW: (keyword: string) => `/keywords/${keyword}`,
  },

  // ========== MESSAGES ==========
  MESSAGES: {
    INBOX: '/dashboard/messages/inbox',
    SENT: '/dashboard/messages/sent',
    DRAFTS: '/dashboard/messages/drafts',
    SEND: '/dashboard/messages/send',
    SAVE_DRAFT: '/dashboard/messages/draft',
    SHOW: (id: number | string) => `/dashboard/messages/${id}`,
    MARK_READ: (id: number | string) => `/dashboard/messages/${id}/read`,
    TOGGLE_IMPORTANT: (id: number | string) => `/dashboard/messages/${id}/important`,
    DELETE: (id: number | string) => `/dashboard/messages/${id}`,
  },

  // ========== CATEGORIES ==========
  CATEGORIES: {
    INDEX: '/categories',
    LIST_PUBLIC: '/categories',
    LIST: '/dashboard/categories',
    SHOW: (id: number | string) => `/dashboard/categories/${id}`,
    SHOW_PUBLIC: (id: number | string) => `/categories/${id}`,
    STORE: '/dashboard/categories',
    UPDATE: (id: number | string) => `/dashboard/categories/${id}`,
    DELETE: (id: number | string) => `/dashboard/categories/${id}`,
    TOGGLE: (id: number | string) => `/dashboard/categories/${id}/toggle`,
    UPLOAD_IMAGES: (id: number | string) => `/dashboard/categories/${id}/images`,
  },
  
  // ========== FILES ==========
  FILES: {
    LIST: '/dashboard/files',
    SHOW: (id: number | string) => `/dashboard/files/${id}`,
    INFO: (id: number | string) => `/files/${id}/info`,
    STORE: '/dashboard/files',
    UPDATE: (id: number | string) => `/dashboard/files/${id}`,
    DELETE: (id: number | string) => `/dashboard/files/${id}`,
    DOWNLOAD: (id: number | string) => `/dashboard/files/${id}/download`,
    INCREMENT_VIEW: (id: number | string) => `/files/${id}/increment-view`,
    UPLOAD: '/upload/image',
    UPLOAD_FILE: '/upload/file',
  },

  // ========== NOTIFICATIONS ==========
  // Updated endpoints to match backend routes
  NOTIFICATIONS: {
    LIST: '/dashboard/notifications',
    LATEST: '/dashboard/notifications/latest',
    SEND: '/dashboard/notifications',
    MARK_READ: (id: number | string) => `/dashboard/notifications/${id}/read`,
    MARK_ALL_READ: '/dashboard/notifications/read-all',
    BULK_ACTION: '/dashboard/notifications/bulk',
    DELETE: (id: number | string) => `/dashboard/notifications/${id}`,
  },

  // ========== SETTINGS ==========
  SETTINGS: {
    GET_ALL: '/dashboard/settings',
    UPDATE: '/dashboard/settings',
    TEST_SMTP: '/dashboard/settings/smtp/test',
    SEND_TEST_EMAIL: '/dashboard/settings/smtp/send-test',
    UPDATE_ROBOTS: '/dashboard/settings/robots',
  },

  // ========== SITEMAP ==========
  SITEMAP: {
    STATUS: '/dashboard/sitemap/status',
    GENERATE_ALL: '/dashboard/sitemap/generate',
    DELETE: (type: string, database: string) => `/dashboard/sitemap/delete/${type}/${database}`,
  },

  // ========== CONTENT AUDIT ==========
  CONTENT_AUDIT: {
    RUN: '/dashboard/content-audit/run',
    RUNS: '/dashboard/content-audit/runs',
    SHOW: (id: number | string) => `/dashboard/content-audit/runs/${id}`,
    FINDINGS: (id: number | string) => `/dashboard/content-audit/runs/${id}/findings`,
    EXPORT: (id: number | string) => `/dashboard/content-audit/runs/${id}/export`,
    AI_ANALYZE: '/dashboard/content-audit/ai/analyze',
    AI_DECISION: (id: number | string) => `/dashboard/content-audit/ai/decisions/${id}`,
    AI_LATEST_DECISION: (type: string, contentId: number | string) => `/dashboard/content-audit/ai/decision/${encodeURIComponent(type)}/${encodeURIComponent(String(contentId))}`,
    AI_FIX_PREVIEW: '/dashboard/content-audit/ai/fix-preview',
    AI_FIX_PREVIEW_SHOW: (id: number | string) => `/dashboard/content-audit/ai/fix-preview/${id}`,
    AI_APPLY_FIX: '/dashboard/content-audit/ai/apply-fix',
    AI_REJECT_FIX: '/dashboard/content-audit/ai/reject-fix',
  },

  // ========== COMMENTS ==========
  COMMENTS: {
    LIST_PUBLIC: (database: string) => `/comments/${database}`,
    LIST_DASHBOARD: (database: string) => `/dashboard/comments/${database}`,
    STORE: (database: string) => `/dashboard/comments/${database}`,
    STORE_PUBLIC: (database: string) => `/comments/${database}`,
    APPROVE: (database: string, id: number | string) => `/dashboard/comments/${database}/${id}/approve`,
    REJECT: (database: string, id: number | string) => `/dashboard/comments/${database}/${id}/reject`,
    DELETE: (database: string, id: number | string) => `/dashboard/comments/${database}/${id}`,
    BULK_DELETE: (database: string) => `/dashboard/comments/${database}/bulk-delete`,
    REACT: '/reactions', // Added reactions endpoint
  },

  // ========== SECURITY ==========
  SECURITY: {
    DASHBOARD: '/dashboard/security/monitor/dashboard',
    LOGS: '/dashboard/security/logs',
    ANALYTICS: '/dashboard/security/analytics',
    RESOLVE: (id: number | string) => `/dashboard/security/logs/${id}/resolve`,
    DELETE_LOG: (id: number | string) => `/dashboard/security/logs/${id}`,
    DELETE_ALL: '/dashboard/security/logs',
    IP_DETAILS: (ip: string) => `/dashboard/security/ip/${encodeURIComponent(ip)}`,
    BLOCKED_IPS: '/dashboard/security/blocked-ips',
    BLOCK_IP: '/dashboard/security/ip/block',
    UNBLOCK_IP: '/dashboard/security/ip/unblock',
    DELETE_BLOCK: (id: number | string) => `/dashboard/security/blocked-ips/${encodeURIComponent(String(id))}`,
    TRUSTED_IPS: '/dashboard/security/trusted-ips',
    TRUST_IP: '/dashboard/security/ip/trust',
    UNTRUST_IP: '/dashboard/security/ip/untrust',
  },

  // ========== REDIS ==========
  REDIS: {
    KEYS: '/dashboard/redis/keys',
    INFO: '/dashboard/redis/info',
    TEST: '/dashboard/redis/test',
    STORE: '/dashboard/redis',
    DELETE: (key: string) => `/dashboard/redis/${encodeURIComponent(key)}`,
    EXPIRE: (key: string) => `/dashboard/redis/${encodeURIComponent(key)}/expire`,
    CLEAN_LEGACY_IP_LOCATION: '/dashboard/redis/legacy-ip-location/clean',
    EXPIRE_LEGACY_IP_LOCATION: '/dashboard/redis/legacy-ip-location/expire',
    UPDATE_ENV: '/dashboard/redis/env',
  },

  // ========== CALENDAR ==========
  CALENDAR: {
    DATABASES: '/dashboard/calendar/databases',
    EVENTS: '/dashboard/calendar/events',
    STORE: '/dashboard/calendar/events',
    UPDATE: (id: number | string) => `/dashboard/calendar/events/${id}`,
    DELETE: (id: number | string) => `/dashboard/calendar/events/${id}`,
  },
};
