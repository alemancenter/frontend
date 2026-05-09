/**
 * Standardized API Response Handler
 * Handles both Laravel's standard response format and edge cases
 * Provides consistent data extraction across all services
 */

/**
 * Standard API response structure from Laravel
 */
export interface ApiResponseData<T> {
  data?: T;
  message?: string;
  status?: boolean;
  success?: boolean;
  errors?: Record<string, string[]>;
  meta?: PaginationMeta;
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from?: number;
  to?: number;
  path?: string;
}

/**
 * Paginated response structure
 */
export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
  links?: {
    first?: string;
    last?: string;
    prev?: string | null;
    next?: string | null;
  };
}

/**
 * Safely unwrap API response data
 * Handles multiple response formats:
 * - { data: T }
 * - { data: { data: T } }
 * - T directly
 * - { status: true, data: T }
 *
 * @param response - The raw API response
 * @returns The unwrapped data of type T
 */
export function unwrapResponse<T>(response: unknown): T {
  if (response === null || response === undefined) {
    return response as T;
  }

  // If it's not an object, return as-is
  if (typeof response !== 'object') {
    return response as T;
  }

  const obj = response as Record<string, unknown>;

  // Handle double-nested data (Laravel resource collections)
  // { data: { data: [...] } }
  if (obj.data && typeof obj.data === 'object' && 'data' in (obj.data as object)) {
    return (obj.data as Record<string, unknown>).data as T;
  }

  // Handle standard Laravel response { data: T }
  if ('data' in obj) {
    return obj.data as T;
  }

  // Return as-is if no data wrapper
  return response as T;
}

/**
 * Unwrap response and ensure it's an array
 * Returns empty array if data is null/undefined
 *
 * @param response - The raw API response
 * @returns Array of items
 */
export function unwrapArrayResponse<T>(response: unknown): T[] {
  const data = unwrapResponse<T[] | null>(response);
  return Array.isArray(data) ? data : [];
}

/**
 * Extract pagination meta from response
 * Handles both top-level and nested meta
 *
 * @param response - The raw API response
 * @returns Pagination meta or null
 */
export function extractMeta(response: unknown): PaginationMeta | null {
  if (!response || typeof response !== 'object') {
    return null;
  }

  const obj = response as Record<string, unknown>;

  // Check for top-level meta
  if (obj.meta && typeof obj.meta === 'object') {
    return obj.meta as PaginationMeta;
  }

  // Check for nested meta in data
  if (obj.data && typeof obj.data === 'object') {
    const data = obj.data as Record<string, unknown>;
    if (data.meta && typeof data.meta === 'object') {
      return data.meta as PaginationMeta;
    }
  }

  // Try to extract pagination from Laravel's paginator format
  if ('current_page' in obj && 'last_page' in obj) {
    return {
      current_page: obj.current_page as number,
      last_page: obj.last_page as number,
      per_page: (obj.per_page as number) || 15,
      total: (obj.total as number) || 0,
      from: obj.from as number | undefined,
      to: obj.to as number | undefined,
    };
  }

  return null;
}

/**
 * Extract links from paginated response
 */
export function extractLinks(response: unknown): PaginatedResponse<unknown>['links'] | null {
  if (!response || typeof response !== 'object') {
    return null;
  }

  const obj = response as Record<string, unknown>;

  if (obj.links && typeof obj.links === 'object') {
    return obj.links as PaginatedResponse<unknown>['links'];
  }

  return null;
}

/**
 * Check if response indicates success
 * Handles multiple success indicators
 *
 * @param response - The raw API response
 * @returns true if response indicates success
 */
export function isSuccessResponse(response: unknown): boolean {
  if (!response || typeof response !== 'object') {
    return false;
  }

  const obj = response as Record<string, unknown>;

  // Check explicit success indicators
  if (obj.status === true || obj.success === true) {
    return true;
  }

  // Check for error indicators
  if (obj.error || obj.errors || obj.status === false || obj.success === false) {
    return false;
  }

  // If response has data and no error, consider it successful
  if ('data' in obj && !obj.error) {
    return true;
  }

  return false;
}

/**
 * Extract error message from response
 *
 * @param response - The raw API response
 * @returns Error message or null
 */
export function extractErrorMessage(response: unknown): string | null {
  if (!response || typeof response !== 'object') {
    return null;
  }

  const obj = response as Record<string, unknown>;

  // Check for message field
  if (typeof obj.message === 'string') {
    return obj.message;
  }

  // Check for error field
  if (typeof obj.error === 'string') {
    return obj.error;
  }

  // Check for errors object (Laravel validation)
  if (obj.errors && typeof obj.errors === 'object') {
    const errors = obj.errors as Record<string, string[]>;
    const firstError = Object.values(errors)[0];
    if (Array.isArray(firstError) && firstError.length > 0) {
      return firstError[0];
    }
  }

  return null;
}

/**
 * Extract all validation errors from response
 *
 * @param response - The raw API response
 * @returns Record of field -> error messages
 */
export function extractValidationErrors(response: unknown): Record<string, string[]> {
  if (!response || typeof response !== 'object') {
    return {};
  }

  const obj = response as Record<string, unknown>;

  if (obj.errors && typeof obj.errors === 'object') {
    return obj.errors as Record<string, string[]>;
  }

  return {};
}

/**
 * Create a standardized API response wrapper
 * Useful for services that need to transform raw responses
 */
export function createApiResponse<T>(
  data: T,
  options?: {
    success?: boolean;
    message?: string;
    meta?: PaginationMeta;
  }
): ApiResponseData<T> {
  return {
    data,
    status: options?.success ?? true,
    success: options?.success ?? true,
    message: options?.message,
    meta: options?.meta,
  };
}

/**
 * Type guard to check if response is paginated
 */
export function isPaginatedResponse<T>(response: unknown): response is PaginatedResponse<T> {
  if (!response || typeof response !== 'object') {
    return false;
  }

  const obj = response as Record<string, unknown>;

  return (
    Array.isArray(obj.data) &&
    obj.meta !== undefined &&
    typeof obj.meta === 'object'
  );
}

/**
 * Safe JSON parse with default value
 */
export function safeJsonParse<T>(json: string, defaultValue: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return defaultValue;
  }
}
