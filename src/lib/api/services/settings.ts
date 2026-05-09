import { apiClient } from '../client';
import { API_ENDPOINTS } from '../config';

interface Settings {
  [key: string]: string | null;
}

interface SmtpTestResult {
  success: boolean;
  message?: string;
  error?: string;
}

export const settingsService = {
  /**
   * Get all settings
   */
  async getAll(): Promise<Settings> {
    const response = await apiClient.get<
      | Settings
      | { data: Settings }
      | { data: { data: Settings } }
      | { data: { settings: Settings } }
      | { settings: Settings }
    >(API_ENDPOINTS.FRONT.SETTINGS);
    const body: any = response.data;
    if (body && typeof body === 'object') {
      if (body.data && typeof body.data === 'object' && 'data' in body.data && typeof (body.data as any).data === 'object') {
        return (body.data as any).data ?? {};
      }
      if (body.data && typeof body.data === 'object' && 'settings' in body.data && typeof (body.data as any).settings === 'object') {
        return (body.data as any).settings ?? {};
      }
      if ('settings' in body && typeof (body as any).settings === 'object') {
        return (body as any).settings ?? {};
      }
      if ('data' in body) {
        return (body as any).data ?? {};
      }
      return body;
    }
    return {};
  },

  /**
   * Update settings (supports file uploads for logo/favicon)
   */
  async update(data: Record<string, string | File>): Promise<{ message: string }> {
    const hasFiles = Object.values(data).some(v => v instanceof File);

    if (hasFiles) {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value instanceof File) {
          formData.append(key, value);
        } else if (value !== undefined && value !== null) {
          formData.append(key, String(value));
        }
      });

      const response = await apiClient.upload<{ data: { message: string } }>(
        API_ENDPOINTS.SETTINGS.UPDATE,
        formData
      );
      return response.data.data;
    }

    const response = await apiClient.post<{ data: { message: string } }>(
      API_ENDPOINTS.SETTINGS.UPDATE,
      data
    );
    return response.data.data;
  },

  /**
   * Test SMTP connection
   */
  async testSmtp(data?: any): Promise<SmtpTestResult> {
    const response = await apiClient.post<any>(
      API_ENDPOINTS.SETTINGS.TEST_SMTP,
      data,
      { timeout: 60000 }
    );
    const body = response.data;
    return {
      success: body?.success ?? false,
      message: body?.message || body?.error || '',
    };
  },

  /**
   * Send test email via SMTP
   */
  async sendTestEmail(email: string, smtpSettings?: any): Promise<{ message: string }> {
    const payload = { email, ...smtpSettings };
    const response = await apiClient.post<any>(
      API_ENDPOINTS.SETTINGS.SEND_TEST_EMAIL,
      payload,
      { timeout: 60000 }
    );
    const body = response.data;
    return { message: body?.message || body?.data?.message || '' };
  },

  /**
   * Update robots.txt content
   */
  async updateRobots(content: string): Promise<{ message: string }> {
    const response = await apiClient.post<{ data: { message: string } }>(
      API_ENDPOINTS.SETTINGS.UPDATE_ROBOTS,
      { content }
    );
    return response.data.data;
  },
};

export default settingsService;
