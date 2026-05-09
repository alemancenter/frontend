import { apiClient } from '../client';
import { API_ENDPOINTS } from '../config';

// Types
export interface SystemMetrics {
  cpu: {
    usage: number;
    cores: number;
    load?: number;
  };
  memory: {
    total: number;
    free: number;
    used: number;
    percentage: number;
  };
  disk: {
    total: number;
    free: number;
    used: number;
    percentage: number;
  };
  timestamp?: string;
}

export interface SecurityStats {
  alerts_count: number;
  blocked_ips_count: number;
  total_requests: number;
  attack_attempts: number;
  blocked_attacks?: number; // Added this based on usage in page.tsx
}

export interface ActiveVisitor {
  ip: string;
  country: string;
  city: string;
  browser: string;
  os: string;
  user_agent: string;
  current_page: string;
  current_page_full: string;
  is_member: boolean;
  user_id?: number;
  user_name?: string;
  user_email?: string;
  user_role?: string;
  is_bot?: boolean;
  last_active: string;
  session_start: string;
  history: {
    url: string;
    time: string;
    device: string;
    location: string;
  }[];
}

export interface VisitorStats {
  current: number;
  current_members: number;
  current_guests: number;
  total_today: number;
  active_visitors: ActiveVisitor[];
  country_stats: { country: string; count: number }[];
}

export interface SecurityLog {
  id: number;
  event_type: string;
  event_type_color?: string;
  ip_address: string;
  user_agent: string;
  url: string;
  severity: string;
  description: string;
  user?: {
    id: number;
    name: string;
    email: string;
  };
  created_at: string;
}

export interface MonitorOverview {
  performance: SystemMetrics;
  security: {
    stats: SecurityStats;
    recent_events: SecurityLog[];
  };
  visitors: VisitorStats;
}

export const monitorService = {
  // Get all monitor data in one go (or separate if preferred)
  getPerformance: async () => {
    const response = await apiClient.get<SystemMetrics>(API_ENDPOINTS.PERFORMANCE.LIVE, undefined, { cache: 'no-store' });
    // Ensure we handle the response structure correctly.
    // BaseResource wraps in data, so we unwrap it.
    return (response as any).data?.data || (response as any).data || response; 
  },

  getSecurityOverview: async () => {
    const response = await apiClient.get<any>(API_ENDPOINTS.SECURITY.DASHBOARD, undefined, { cache: 'no-store' });
    return (response as any).data?.data || (response as any).data || response;
  },

  getVisitors: async (options?: { perPage?: number | 'all'; includeBots?: boolean; withHistory?: boolean }) => {
    const params: Record<string, string | number | boolean | undefined> = {};
    if (options?.perPage !== undefined) params.per_page = options.perPage;
    if (options?.includeBots !== undefined) params.include_bots = options.includeBots;
    if (options?.withHistory !== undefined) params.with_history = options.withHistory;
    const response = await apiClient.get<any>(API_ENDPOINTS.DASHBOARD.ANALYTICS, params, { cache: 'no-store' });
    return (response as any).data?.data || (response as any).data || response; // contains visitor_stats, user_stats, country_stats
  },

  pruneVisitors: async (options?: { minutes?: number; onlyBots?: boolean }) => {
    const payload: Record<string, number | boolean> = {};
    if (options?.minutes !== undefined) payload.minutes = options.minutes;
    if (options?.onlyBots !== undefined) payload.only_bots = options.onlyBots;
    const response = await apiClient.post<any>('/dashboard/visitor-analytics/prune', payload);
    return (response as any).data?.data || (response as any).data || response;
  },

  getRecentLogs: async () => {
    const response = await apiClient.get<{ data: SecurityLog[] }>(API_ENDPOINTS.SECURITY.LOGS, { per_page: 10 }, { cache: 'no-store' });
    return (response as any).data?.data || (response as any).data || response;
  },

  getBlockedIps: async () => {
    const response = await apiClient.get<{ data: any[] }>(API_ENDPOINTS.SECURITY.BLOCKED_IPS, undefined, { cache: 'no-store' });
    return (response as any).data?.data || (response as any).data || response;
  }
};
