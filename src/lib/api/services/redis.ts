import { apiClient } from '../client';
import { API_ENDPOINTS } from '../config';

export type RedisTTLFilter = 'all' | 'persistent' | 'volatile';

export interface RedisKey {
  key: string;
  value?: string;
  ttl: number;
  ttl_label?: string;
  is_persistent?: boolean;
  type?: string;
  memory_usage_bytes?: number;
}

interface RedisKeysPayload {
  count?: number;
  keys?: string[];
  data?: RedisKey[];
  current_page?: number;
  page?: number;
  per_page?: number;
  total?: number;
  last_page?: number;
  from?: number;
  to?: number;
  has_more?: boolean;
}

export interface RedisKeysResult {
  count: number;
  data: RedisKey[];
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  from: number;
  to: number;
  has_more: boolean;
}

export type RedisInfoSection = Record<string, string>;
export interface RedisInfo {
  [key: string]: string | RedisInfoSection;
}

function parseRedisInfo(raw: string): RedisInfo {
  const parsed: RedisInfo = {};
  let currentSection = 'General';

  raw.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    if (trimmed.startsWith('#')) {
      currentSection = trimmed.replace(/^#\s*/, '') || 'General';
      if (!parsed[currentSection] || typeof parsed[currentSection] !== 'object') {
        parsed[currentSection] = {};
      }
      return;
    }

    const separatorIndex = trimmed.indexOf(':');
    if (separatorIndex === -1) return;

    const key = trimmed.slice(0, separatorIndex);
    const value = trimmed.slice(separatorIndex + 1);
    const section = parsed[currentSection];
    if (section && typeof section === 'object') {
      section[key] = value;
    } else {
      parsed[key] = value;
    }
  });

  return parsed;
}

export const redisService = {
  async getKeys(search?: string, page = 1, perPage = 25, ttlFilter: RedisTTLFilter = 'all'): Promise<RedisKeysResult> {
    const trimmedSearch = search?.trim();
    const params: Record<string, string | number> = { page, per_page: perPage };
    if (trimmedSearch) params.pattern = `*${trimmedSearch}*`;
    if (ttlFilter !== 'all') params.ttl_filter = ttlFilter;

    const response = await apiClient.get<{ data: RedisKeysPayload }>(
      API_ENDPOINTS.REDIS.KEYS,
      params,
      { cache: 'no-store' }
    );
    const payload = response.data.data;
    const data = payload.data || (payload.keys || []).map((key) => ({ key, value: '', ttl: -1, ttl_label: 'unknown', is_persistent: false }));
    const currentPage = payload.current_page ?? payload.page ?? page;
    const effectivePerPage = payload.per_page ?? perPage;
    const total = payload.total ?? payload.count ?? data.length;
    const lastPage = payload.last_page ?? Math.max(1, Math.ceil(total / effectivePerPage));

    return {
      count: payload.count ?? data.length,
      data,
      current_page: currentPage,
      per_page: effectivePerPage,
      total,
      last_page: lastPage,
      from: payload.from ?? (data.length > 0 ? (currentPage - 1) * effectivePerPage + 1 : 0),
      to: payload.to ?? (data.length > 0 ? (currentPage - 1) * effectivePerPage + data.length : 0),
      has_more: payload.has_more ?? currentPage < lastPage,
    };
  },

  async getInfo(): Promise<RedisInfo> {
    const response = await apiClient.get<{ data: RedisInfo | { info: string } }>(API_ENDPOINTS.REDIS.INFO);
    const payload = response.data.data;
    if (payload && typeof (payload as { info?: unknown }).info === 'string') {
      return parseRedisInfo((payload as { info: string }).info);
    }
    return payload as RedisInfo;
  },

  async testConnection(): Promise<{ message: string }> {
    const response = await apiClient.get<{ data: { message: string } }>(API_ENDPOINTS.REDIS.TEST);
    return response.data.data;
  },

  async addKey(data: { key: string; value: string; ttl?: number; persist?: boolean }): Promise<void> {
    await apiClient.post(API_ENDPOINTS.REDIS.STORE, data);
  },

  async expireKey(key: string, ttl = 604800): Promise<void> {
    await apiClient.post(API_ENDPOINTS.REDIS.EXPIRE(key), { ttl });
  },

  async deleteKey(key: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.REDIS.DELETE(key));
  },

  async cleanLegacyIPLocation(): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.REDIS.CLEAN_LEGACY_IP_LOCATION);
  },

  async expireLegacyIPLocation(ttl = 604800): Promise<void> {
    await apiClient.post(API_ENDPOINTS.REDIS.EXPIRE_LEGACY_IP_LOCATION, { ttl });
  },

  async updateEnv(data: {
    REDIS_HOST?: string;
    REDIS_PORT?: string;
    REDIS_PASSWORD?: string;
    REDIS_DB?: string;
  }): Promise<void> {
    await apiClient.post(API_ENDPOINTS.REDIS.UPDATE_ENV, data);
  },
};
