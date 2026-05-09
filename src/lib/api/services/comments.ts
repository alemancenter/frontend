import { apiClient } from '../client';
import { API_ENDPOINTS } from '../config';
import { User } from '@/types';

export interface Commentable {
  id: number;
  title?: string;
  name?: string; // Some models might use name
}

export interface Comment {
  id: number;
  body: string;
  user_id: number;
  user?: User;
  commentable_id: number;
  commentable_type: string;
  commentable?: Commentable;
  database: string;
  status?: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface LaravelPaginationMeta {
  current_page: number;
  from: number;
  last_page: number;
  path: string;
  per_page: number;
  to: number;
  total: number;
}

export interface CommentsResponse {
  data: Comment[];
  links?: any;
  meta?: LaravelPaginationMeta;
}

export interface CommentsFilter {
  page?: number;
  per_page?: number;
  q?: string;
  status?: 'pending' | 'approved' | 'rejected' | '';
  type?: string;
  commentable_id?: number | string;
  commentable_type?: string;
  [key: string]: string | number | boolean | undefined;
}

export const commentsService = {
  getAll: async (database: string, params?: CommentsFilter) => {
    const response = await apiClient.get<CommentsResponse>(
      API_ENDPOINTS.COMMENTS.LIST_PUBLIC(database),
      params
    );
    return response.data;
  },

  getAllDashboard: async (database: string, params?: CommentsFilter) => {
    const response = await apiClient.get<CommentsResponse>(
      API_ENDPOINTS.COMMENTS.LIST_DASHBOARD(database),
      params
    );
    return response.data;
  },

  create: async (database: string, data: { body: string; commentable_id: number; commentable_type: string }) => {
    const response = await apiClient.post(
      API_ENDPOINTS.COMMENTS.STORE_PUBLIC(database),
      data
    );
    return response.data;
  },

  approve: async (database: string, id: number | string) => {
    const response = await apiClient.post(
      API_ENDPOINTS.COMMENTS.APPROVE(database, id)
    );
    return response.data;
  },

  reject: async (database: string, id: number | string) => {
    const response = await apiClient.post(
      API_ENDPOINTS.COMMENTS.REJECT(database, id)
    );
    return response.data;
  },

  react: async (commentId: number | string, type: 'like' | 'dislike', database: string = 'jo') => {
    const response = await apiClient.post(
      API_ENDPOINTS.COMMENTS.REACT,
      { comment_id: commentId, emoji: type },
      { params: { database } }
    );
    return response.data;
  },

  delete: async (database: string, id: number | string) => {
    const response = await apiClient.delete(
      API_ENDPOINTS.COMMENTS.DELETE(database, id)
    );
    return response.data;
  },

  bulkDelete: async (database: string, ids: Array<number | string>) => {
    const response = await apiClient.post(
      API_ENDPOINTS.COMMENTS.BULK_DELETE(database),
      { ids }
    );
    return response.data;
  },
};
