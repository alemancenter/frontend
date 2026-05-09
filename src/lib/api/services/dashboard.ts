import { apiClient } from '../client';
import { API_ENDPOINTS } from '../config';
import type { DashboardData, VisitorAnalyticsData } from '@/types';

export const dashboardService = {
  /**
   * Get main dashboard data (totals, trends, analytics, online users, recent activities)
   */
  async getIndex(): Promise<DashboardData> {
    const response = await apiClient.get<{ data: DashboardData }>(API_ENDPOINTS.DASHBOARD.INDEX);
    return response.data.data || (response.data as any);
  },

  /**
   * Get analytics data for specific days range
   */
  async getAnalytics(days: number = 7): Promise<VisitorAnalyticsData> {
    const response = await apiClient.get<{ data: VisitorAnalyticsData }>(
      API_ENDPOINTS.DASHBOARD.ANALYTICS,
      { days }
    );
    return response.data.data || (response.data as any);
  },
};

export default dashboardService;
