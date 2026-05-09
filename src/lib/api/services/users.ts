import { apiClient } from '../client';
import { API_ENDPOINTS } from '../config';
import type { User } from '@/types';

interface UserFilters {
  role?: string;
  search?: string;
  page?: number;
  per_page?: number;
  all?: boolean | number;
  status?: string;
}

interface CreateUserData {
  name: string;
  email: string;
  password: string;
  password_confirmation?: string;
  roles?: number[]; // Match backend CreateUserRequest { Roles []uint }
  role?: string; // Kept for backward compatibility
  phone?: string;
  job_title?: string;
  gender?: string;
  country?: string;
  bio?: string;
  status?: string;
  social_links?: Record<string, string>;
}

interface UpdateUserData {
  name?: string;
  email?: string;
  phone?: string;
  bio?: string;
  profile_photo?: File;
  job_title?: string;
  gender?: string;
  country?: string;
  status?: string;
  password?: string;
  password_confirmation?: string;
  social_links?: Record<string, string>;
}

export const usersService = {
  /**
   * Get all users with optional filters
   */
  async getAll(filters?: UserFilters): Promise<User[] | any> {
    try {
      const response = await apiClient.get<{ data: User[] }>(
        API_ENDPOINTS.USERS.LIST,
        filters as Record<string, string | number | boolean | undefined> | undefined
      );

      // If pagination is requested via page parameter, return the full response (including meta)
      if (filters?.page) {
        return response.data;
      }

      return (response.data as any).data ?? (response.data as any);
    } catch (e: any) {
      if (e && e.status === 404) {
        const response2 = await apiClient.get<{ data: User[] }>(
          '/dashboard/users',
          filters as Record<string, string | number | boolean | undefined> | undefined
        );
        
        if (filters?.page) {
          return response2.data;
        }

        return (response2.data as any).data ?? (response2.data as any);
      }
      throw e;
    }
  },

  /**
   * Search users (autocomplete for messaging) — requires only auth, not manage users
   */
  async search(query: string): Promise<User[]> {
    const response = await apiClient.get<{ data: User[] }>(
      API_ENDPOINTS.USERS.SEARCH_PUBLIC,
      { search: query }
    );
    return (response.data as any).data ?? (response.data as any);
  },

  /**
   * Search users (admin-only, requires manage users)
   */
  async searchAdmin(query: string): Promise<User[]> {
    const response = await apiClient.get<{ data: User[] }>(
      API_ENDPOINTS.USERS.SEARCH,
      { search: query }
    );
    return (response.data as any).data ?? (response.data as any);
  },

  /**
   * Get single user by ID
   */
  async getById(id: number | string): Promise<User> {
    try {
      const response = await apiClient.get<{ data: User }>(
        API_ENDPOINTS.USERS.SHOW(id)
      );
      return (response.data as any).data ?? (response.data as any);
    } catch (e: any) {
      if (e && e.status === 404) {
        const response2 = await apiClient.get<{ data: User }>(
          `/dashboard/users/${id}`
        );
        return (response2.data as any).data ?? (response2.data as any);
      }
      throw e;
    }
  },

  /**
   * Create new user
   */
  async create(data: CreateUserData): Promise<User> {
    const response = await apiClient.post<{ data: User }>(
      API_ENDPOINTS.USERS.STORE,
      data
    );
    return (response.data as any).data ?? (response.data as any);
  },

  /**
   * Update user (with optional profile photo upload)
   */
  async update(id: number | string, data: UpdateUserData): Promise<User> {
    const formData = new FormData();
    formData.append('_method', 'PUT');

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (value instanceof File) {
          formData.append(key, value);
        } else if (key === 'social_links' && typeof value === 'object') {
          Object.entries(value).forEach(([k, v]) => {
            formData.append(`social_links[${k}]`, String(v || ''));
          });
        } else {
          formData.append(key, String(value));
        }
      }
    });

    const response = await apiClient.upload<{ data: User }>(
      API_ENDPOINTS.USERS.UPDATE(id),
      formData
    );
    return (response.data as any).data ?? (response.data as any);
  },

  /**
   * Update user roles and permissions
   */
  async updateRolesPermissions(
    id: number | string,
    data: { roles?: number[]; permissions?: number[] } // Match backend RolesPermissionsRequest { Roles []uint, Permissions []uint }
  ): Promise<User> {
    const response = await apiClient.put<{ data: User }>(
      API_ENDPOINTS.USERS.UPDATE_ROLES(id),
      data
    );
    return (response.data as any).data ?? (response.data as any);
  },

  /**
   * Delete user
   */
  async delete(id: number | string): Promise<{ message: string }> {
    const resp = await apiClient.delete<{ message: string }>(API_ENDPOINTS.USERS.DELETE(id));
    return (resp.data as any).data ?? (resp.data as any);
  },

  /**
   * Bulk update status for multiple users
   */
  async bulkUpdateStatus(ids: number[], status: string): Promise<{ updated: number }> {
    const response = await apiClient.post<{ data: { updated: number } }>(
      API_ENDPOINTS.USERS.UPDATE_STATUS,
      { ids, status }
    );
    return (response.data as any).data ?? (response.data as any);
  },

  /**
   * Bulk delete users
   */
  async bulkDelete(userIds: number[]): Promise<{ deleted: number; errors: string[] }> {
    const response = await apiClient.post<{ data: { deleted: number; errors: string[] } }>(
      API_ENDPOINTS.USERS.BULK_DELETE,
      { ids: userIds } // Match backend: bulk-delete expects { ids: []uint } not { user_ids: []uint }
    );
    return (response.data as any).data ?? (response.data as any);
  },
};

export default usersService;
