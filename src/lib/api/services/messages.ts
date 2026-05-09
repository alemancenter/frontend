import { apiClient } from '../client';
import { API_ENDPOINTS } from '../config';
import type { Message, PaginatedResponse } from '@/types';

interface SendMessageData {
  recipient_id: number;
  subject: string;
  body: string;
}

interface SaveDraftData {
  recipient_id: number;
  subject?: string;
  body?: string;
}

export const messagesService = {
  /**
   * Get inbox messages
   */
  async getInbox(): Promise<PaginatedResponse<Message>> {
    const response = await apiClient.get<PaginatedResponse<Message>>(
      API_ENDPOINTS.MESSAGES.INBOX
    );
    return response.data;
  },

  /**
   * Get sent messages
   */
  async getSent(): Promise<PaginatedResponse<Message>> {
    const response = await apiClient.get<PaginatedResponse<Message>>(
      API_ENDPOINTS.MESSAGES.SENT
    );
    return response.data;
  },

  /**
   * Get draft messages
   */
  async getDrafts(): Promise<PaginatedResponse<Message>> {
    const response = await apiClient.get<PaginatedResponse<Message>>(
      API_ENDPOINTS.MESSAGES.DRAFTS
    );
    return response.data;
  },

  /**
   * Send a new message
   */
  async send(data: SendMessageData): Promise<Message> {
    const response = await apiClient.post<{ data: Message }>(
      API_ENDPOINTS.MESSAGES.SEND,
      data
    );
    return response.data.data;
  },

  /**
   * Save message as draft
   */
  async saveDraft(data: SaveDraftData): Promise<Message> {
    const response = await apiClient.post<{ data: Message }>(
      API_ENDPOINTS.MESSAGES.SAVE_DRAFT,
      data
    );
    return response.data.data;
  },

  /**
   * Get a single message by ID
   */
  async getById(id: number | string): Promise<Message> {
    const response = await apiClient.get<{ data: Message }>(
      API_ENDPOINTS.MESSAGES.SHOW(id)
    );
    return response.data.data;
  },

  /**
   * Mark message as read
   */
  async markAsRead(id: number | string): Promise<void> {
    await apiClient.post(API_ENDPOINTS.MESSAGES.MARK_READ(id));
  },

  /**
   * Toggle message important status
   */
  async toggleImportant(id: number | string): Promise<{ important: boolean }> {
    const response = await apiClient.post<{ data: { important: boolean } }>(
      API_ENDPOINTS.MESSAGES.TOGGLE_IMPORTANT(id)
    );
    return response.data.data;
  },

  /**
   * Delete a message
   */
  async delete(id: number | string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string } | { data: { message: string } }>(
      API_ENDPOINTS.MESSAGES.DELETE(id)
    );
    return 'data' in response.data ? response.data.data : response.data;
  },
};

export default messagesService;
