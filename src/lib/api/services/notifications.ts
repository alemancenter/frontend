import { apiClient } from '../client';
import { API_ENDPOINTS } from '../config';

export interface NotificationData {
  title?: string;
  message?: string;
  url?: string;
  type?: string;
  action_url?: string;
  [key: string]: any;
}

export interface Notification {
  id: string;
  type: string;
  notifiable_type: string;
  notifiable_id: number;
  data: NotificationData;
  read_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface NotificationResponse {
  data: Notification[];
  unread_count: number;
  success: boolean;
}

/**
 * Dispatches a browser custom event to trigger an immediate notifications refresh
 * in the NotificationsDropdown (which listens for this event).
 * Fire-and-forget — safe to call anywhere.
 */
export function emitNotificationsRefresh(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('notifications:refresh'));
  }
}

export const notificationService = {
  /**
   * Create a new notification (called after article/post creation).
   * Fire-and-forget — never throws, never blocks.
   */
  send: async (data: {
    type: string;
    title: string;
    message: string;
    action_url?: string;
  }): Promise<void> => {
    try {
      await apiClient.post(API_ENDPOINTS.NOTIFICATIONS.SEND, data);
      emitNotificationsRefresh();
    } catch {
      // Silent fail — notification creation is non-critical
    }
  },

  /**
   * Get latest notifications for the dropdown.
   * Uses suppressAuthRedirect so background polling doesn't kill the session on transient 401s.
   */
  getLatest: async (limit = 10): Promise<NotificationResponse> => {
    const response = await apiClient.get<any>(
      API_ENDPOINTS.NOTIFICATIONS.LATEST,
      { limit },
      { suppressAuthRedirect: true }
    );
    // Backend wraps response as: { success, message, data: { notifications: [...], unread_count: N } }
    const inner = response.data?.data ?? response.data;
    return {
      data: Array.isArray(inner?.notifications) ? inner.notifications : [],
      unread_count: inner?.unread_count ?? 0,
      success: true,
    };
  },

  /**
   * Get all notifications (paginated)
   */
  getAll: async (params?: { page?: number; per_page?: number; type?: string }): Promise<NotificationResponse> => {
    const response = await apiClient.get<NotificationResponse>(API_ENDPOINTS.NOTIFICATIONS.LIST, params as any);
    return response.data;
  },
  
  /**
   * Mark a single notification as read
   */
  markAsRead: async (id: string): Promise<{ unread_count: number; message: string }> => {
    const response = await apiClient.post<any>(
      API_ENDPOINTS.NOTIFICATIONS.MARK_READ(id)
    );
    const inner = response.data?.data ?? response.data ?? {};
    return { unread_count: inner.unread_count ?? 0, message: inner.message ?? '' };
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead: async (): Promise<{ unread_count: number; message: string }> => {
    const response = await apiClient.post<any>(
      API_ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ
    );
    const inner = response.data?.data ?? response.data ?? {};
    return { unread_count: inner.unread_count ?? 0, message: inner.message ?? '' };
  },

  /**
   * Delete a notification
   */
  delete: async (id: string): Promise<any> => {
    const response = await apiClient.delete(API_ENDPOINTS.NOTIFICATIONS.DELETE(id));
    return response.data;
  },

  /**
   * Bulk action on notifications
   */
  bulkAction: async (ids: string[], action: string): Promise<any> => {
    const response = await apiClient.post(API_ENDPOINTS.NOTIFICATIONS.BULK_ACTION, {
      ids,
      action
    });
    return response.data;
  }
};
