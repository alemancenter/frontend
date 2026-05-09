import { apiClient } from '../client';
import { API_ENDPOINTS } from '../config';

export interface CpuMetrics {
  usage: number;
  cores: number;
  load: number[] | number;
}

export interface MemoryMetrics {
  total: number;
  free: number;
  used: number;
  usage_percentage: number;
}

export interface DiskMetrics {
  total: number;
  free: number;
  used: number;
  usage_percentage: number;
}

export interface SystemMetrics {
  cpu: CpuMetrics;
  memory: MemoryMetrics;
  disk: DiskMetrics;
}

export interface PerformanceSummary {
  metrics: SystemMetrics;
  timestamp: string;
}

export interface PerformanceLive {
  cpu: {
    usage: number;
    cores: number;
    load: number;
  };
  memory: MemoryMetrics;
  disk: DiskMetrics;
  timestamp: string;
}

export interface CacheStats {
  hit_ratio: number;
  cache_size: string;
}

export interface AppMetricsSnapshot {
  uptime_seconds: number;
  requests_total: number;
  errors_total: number;
  avg_latency_ms: number;
  routes: Record<string, {
    count: number;
    errors: number;
    avg_latency_ms: number;
    max_latency_ms: number;
  }>;
}

export const performanceService = {
  /**
   * Get full system metrics summary
   */
  async getSummary(): Promise<PerformanceSummary> {
    const response = await apiClient.get<{ data: PerformanceSummary }>(
      API_ENDPOINTS.PERFORMANCE.SUMMARY
    );
    return response.data.data;
  },

  /**
   * Get live metrics (cached short term)
   */
  async getLive(): Promise<PerformanceLive> {
    const response = await apiClient.get<{ data: PerformanceLive }>(
      API_ENDPOINTS.PERFORMANCE.LIVE
    );
    return response.data.data;
  },

  /**
   * Get average response time
   */
  async getResponseTime(): Promise<{ average_ms: number }> {
    const response = await apiClient.get<{ data: { average_ms: number } }>(
      API_ENDPOINTS.PERFORMANCE.RESPONSE_TIME
    );
    return response.data.data;
  },

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<CacheStats> {
    const response = await apiClient.get<{ data: CacheStats }>(
      API_ENDPOINTS.PERFORMANCE.CACHE
    );
    return response.data.data;
  },

  async getMetrics(): Promise<AppMetricsSnapshot> {
    const response = await apiClient.get<{ data: AppMetricsSnapshot }>(
      API_ENDPOINTS.PERFORMANCE.METRICS,
      undefined,
      { cache: 'no-store' }
    );
    return (response as any).data?.data || (response as any).data || response;
  },
};
