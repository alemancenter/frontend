import { apiClient } from '../client';
import { API_ENDPOINTS } from '../config';
import type { SecurityLog, PaginatedResponse } from '@/types';

interface SecurityLogFilters {
  page?: number;
  per_page?: number;
  severity?: string;
  event_type?: string;
  ip?: string;
  q?: string;
  resolved?: string;
  is_resolved?: string;
  date_from?: string;
  date_to?: string;
  [key: string]: string | number | boolean | undefined;
}

interface SecurityOverview {
  stats: {
    total_events: number;
    unresolved_events: number;
    high_risk_events: number;
    blocked_ips: number;
  };
  recent_logs: SecurityLog[];
}

interface SecurityAnalytics {
  security_score: number;
  event_distribution: Array<{
    event_type: string;
    count: number;
  }>;
}

interface IpDetails {
  logs: SecurityLog[];
  stats: {
    first_seen: string | null;
    last_seen: string | null;
    total_events: number;
    event_types: Record<string, number>;
    risk: {
      current: number;
      avg: number;
      max: number;
    };
  };
}

export const securityService = {
  /**
   * Get security overview (stats + recent logs)
   */
  async getOverview(): Promise<SecurityOverview> {
    const response = await apiClient.get<any>(
      API_ENDPOINTS.SECURITY.DASHBOARD
    );
    const data = (response.data as any)?.data ?? (response.data as any);
    return {
        ...data,
        recent_logs: data.recent_events || data.recent_logs || []
    };
  },

  /**
   * Get filtered security logs with pagination
   */
  async getLogs(filters?: SecurityLogFilters): Promise<PaginatedResponse<SecurityLog>> {
    const params: SecurityLogFilters = { ...filters };
    if (params.q && !params.ip) {
      params.ip = String(params.q);
    }
    delete params.q;
    if (params.is_resolved && !params.resolved) {
      params.resolved = params.is_resolved === 'true' ? '1' : params.is_resolved === 'false' ? '0' : params.is_resolved;
    }
    delete params.is_resolved;

    const response = await apiClient.get<any>(
      API_ENDPOINTS.SECURITY.LOGS,
      params,
      { cache: 'no-store' }
    );
    const envelope = response.data as any;
    const data = Array.isArray(envelope?.data) ? envelope.data : Array.isArray(envelope) ? envelope : [];
    const pagination = envelope?.pagination || envelope?.meta || {
      current_page: params.page || 1,
      last_page: 1,
      per_page: params.per_page || data.length || 500,
      total: data.length,
    };

    return {
      data,
      pagination,
      meta: envelope?.meta || pagination,
      success: envelope?.success,
    };
  },

  /**
   * Get security analytics
   */
  async getAnalytics(range: 'today' | 'week' | 'month' | 'custom' = 'week', customDates?: {
    start_date?: string;
    end_date?: string;
  }): Promise<SecurityAnalytics> {
    const params = { range, ...customDates };
    const response = await apiClient.get<{ data: SecurityAnalytics }>(
      API_ENDPOINTS.SECURITY.ANALYTICS,
      params
    );
    return response.data.data;
  },

  /**
   * Resolve a security log
   */
  async resolveLog(id: number | string, notes: string): Promise<{ message: string }> {
    const response = await apiClient.post<{ data: { message: string } }>(
      API_ENDPOINTS.SECURITY.RESOLVE(id),
      { notes }
    );
    return response.data.data;
  },

  /**
   * Delete a security log
   */
  async deleteLog(id: number | string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ data: { message: string } }>(
      API_ENDPOINTS.SECURITY.DELETE_LOG(id)
    );
    return response.data.data;
  },

  /**
   * Delete all security logs
   */
  async deleteAllLogs(): Promise<{ message: string }> {
    const response = await apiClient.delete<{ data: { message: string } }>(
      API_ENDPOINTS.SECURITY.DELETE_ALL
    );
    return response.data.data;
  },

  /**
   * Get IP details and history
   */
  async getIpDetails(ip: string): Promise<IpDetails> {
    const response = await apiClient.get<{ data: IpDetails }>(
      API_ENDPOINTS.SECURITY.IP_DETAILS(ip)
    );
    return response.data.data;
  },

  /**
   * Trust an IP address
   */
  async trustIp(ip_address: string, reason: string): Promise<{ message: string }> {
    const response = await apiClient.post<{ data: { message: string } }>(
      API_ENDPOINTS.SECURITY.TRUST_IP,
      { ip_address, reason }
    );
    return response.data.data;
  },

  /**
   * Remove IP from trusted list
   */
  async untrustIp(ip_address: string): Promise<{ message: string }> {
    const response = await apiClient.post<{ data: { message: string } }>(
      API_ENDPOINTS.SECURITY.UNTRUST_IP,
      { ip_address }
    );
    return response.data.data;
  },

  /**
   * Get blocked IPs
   */
  async getBlockedIps(params?: { page?: number; per_page?: number; search?: string; status?: 'active' | 'expired' }) {
    const cleanParams = Object.fromEntries(
      Object.entries(params || {}).filter(([, value]) => value !== undefined && value !== '')
    );
    const response = await apiClient.get<any>(API_ENDPOINTS.SECURITY.BLOCKED_IPS, cleanParams, { cache: 'no-store' });
    const envelope = response.data as any;
    const data = Array.isArray(envelope?.data) ? envelope.data : Array.isArray(envelope) ? envelope : [];
    const meta = envelope?.pagination || envelope?.meta || {};
    return {
      data,
      current_page: meta.current_page || params?.page || 1,
      last_page: meta.last_page || meta.total_pages || 1,
      total: meta.total || data.length,
      per_page: meta.per_page || params?.per_page || data.length || 15,
    };
  },

  /**
   * Manual Block IP
   */
  async blockIp(data: { ip: string; reason?: string; days?: number }) {
    const response = await apiClient.post<{ data: { message: string } }>(API_ENDPOINTS.SECURITY.BLOCK_IP, {
      ip_address: data.ip,
      reason: data.reason,
      days: data.days,
    });
    return response.data.data;
  },

  /**
   * Delete Block (Unblock by ID)
   */
  async deleteBlock(id: number | string) {
    const response = await apiClient.delete<{ data: { message: string } }>(API_ENDPOINTS.SECURITY.DELETE_BLOCK(id));
    return response.data.data;
  }
};

export default securityService;
