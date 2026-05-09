import { apiClient } from '../client';
import { API_ENDPOINTS } from '../config';
import type { Role, Permission } from '@/types';

interface RoleFormData {
  name: string;
  permissions?: number[];
}

interface PermissionFormData {
  name: string;
  guard_name: string;
}

export const rolesService = {
  /**
   * Get all roles with users count
   */
  async getAll(): Promise<Role[]> {
    try {
      const response = await apiClient.get<{ data: Role[] }>(
        API_ENDPOINTS.ROLES.LIST
      );
      return (response.data as any).data ?? (response.data as any);
    } catch (e: any) {
      if (e && e.status === 404) {
        const response2 = await apiClient.get<{ data: Role[] }>(
          '/dashboard/roles'
        );
        return (response2.data as any).data ?? (response2.data as any);
      }
      throw e;
    }
  },

  /**
   * Get single role by ID with permissions
   */
  async getById(id: number | string): Promise<Role> {
    try {
      const response = await apiClient.get<{ data: Role }>(
        API_ENDPOINTS.ROLES.SHOW(id)
      );
      return (response.data as any).data ?? (response.data as any);
    } catch (e: any) {
      if (e && e.status === 404) {
        const response2 = await apiClient.get<{ data: Role }>(
          `/dashboard/roles/${id}`
        );
        return (response2.data as any).data ?? (response2.data as any);
      }
      throw e;
    }
  },

  /**
   * Create new role with permissions
   */
  async create(data: RoleFormData): Promise<Role> {
    try {
      const response = await apiClient.post<{ data: Role }>(
        API_ENDPOINTS.ROLES.STORE,
        data
      );
      return (response.data as any).data ?? (response.data as any);
    } catch (e: any) {
      if (e && e.status === 404) {
        const response2 = await apiClient.post<{ data: Role }>(
          '/dashboard/roles',
          data
        );
        return (response2.data as any).data ?? (response2.data as any);
      }
      throw e;
    }
  },

  /**
   * Update role and sync permissions
   */
  async update(id: number | string, data: RoleFormData): Promise<Role> {
    try {
      const response = await apiClient.put<{ data: Role }>(
        API_ENDPOINTS.ROLES.UPDATE(id),
        data
      );
      return (response.data as any).data ?? (response.data as any);
    } catch (e: any) {
      if (e && e.status === 404) {
        const response2 = await apiClient.put<{ data: Role }>(
          `/dashboard/roles/${id}`,
          data
        );
        return (response2.data as any).data ?? (response2.data as any);
      }
      throw e;
    }
  },

  /**
   * Delete role
   */
  async delete(id: number | string): Promise<{ message: string }> {
    try {
      const response = await apiClient.delete<{ message: string } | { data: { message: string } }>(
        API_ENDPOINTS.ROLES.DELETE(id)
      );
      return 'data' in response.data ? response.data.data : response.data;
    } catch (e: any) {
      if (e && e.status === 404) {
        const response2 = await apiClient.delete<{ message: string } | { data: { message: string } }>(
          `/dashboard/roles/${id}`
        );
        return 'data' in response2.data ? response2.data.data : response2.data;
      }
      throw e;
    }
  },

  /**
   * Get all available permissions
   */
  async getPermissions(): Promise<Permission[]> {
    try {
      const response = await apiClient.get<{ data: Permission[] }>(
        API_ENDPOINTS.PERMISSIONS.LIST
      );
      const d = response.data as any;
      const arr =
        Array.isArray(d)
          ? d
          : Array.isArray(d.data)
          ? d.data
          : Array.isArray(d.permissions)
          ? d.permissions
          : Array.isArray(d?.data?.permissions)
          ? d.data.permissions
          : [];
      return arr;
    } catch (e: any) {
      if (e && e.status === 404) {
        const response2 = await apiClient.get<{ data: Permission[] }>(
          '/dashboard/permissions'
        );
        const d2 = response2.data as any;
        const arr2 =
          Array.isArray(d2)
            ? d2
            : Array.isArray(d2.data)
            ? d2.data
            : Array.isArray(d2.permissions)
            ? d2.permissions
            : Array.isArray(d2?.data?.permissions)
            ? d2.data.permissions
            : [];
        return arr2;
      }
      throw e;
    }
  },

  /**
   * Create a permission
   */
  async createPermission(data: PermissionFormData): Promise<Permission> {
    try {
      const response = await apiClient.post<{ data: { message: string; permission: Permission } }>(
        API_ENDPOINTS.PERMISSIONS.STORE,
        data
      );
      const d = response.data as any;
      return d.permission ?? d.data ?? d;
    } catch (e: any) {
      if (e && e.status === 404) {
        const response2 = await apiClient.post<{ data: { message: string; permission: Permission } }>(
          '/dashboard/permissions',
          data
        );
        const d2 = response2.data as any;
        return d2.permission ?? d2.data ?? d2;
      }
      throw e;
    }
  },

  /**
   * Update a permission
   */
  async updatePermission(id: number | string, data: PermissionFormData): Promise<Permission> {
    try {
      const response = await apiClient.put<{ data: { message: string; permission: Permission } }>(
        API_ENDPOINTS.PERMISSIONS.UPDATE(id),
        data
      );
      const d = response.data as any;
      return d.permission ?? d.data ?? d;
    } catch (e: any) {
      if (e && e.status === 404) {
        const response2 = await apiClient.put<{ data: { message: string; permission: Permission } }>(
          `/dashboard/permissions/${id}`,
          data
        );
        const d2 = response2.data as any;
        return d2.permission ?? d2.data ?? d2;
      }
      throw e;
    }
  },

  /**
   * Delete a permission
   */
  async deletePermission(id: number | string): Promise<{ message: string }> {
    try {
      const response = await apiClient.delete<{ message: string } | { data: { message: string } }>(
        API_ENDPOINTS.PERMISSIONS.DELETE(id)
      );
      return 'data' in response.data ? response.data.data : response.data;
    } catch (e: any) {
      if (e && e.status === 404) {
        const response2 = await apiClient.delete<{ message: string } | { data: { message: string } }>(
          `/dashboard/permissions/${id}`
        );
        return 'data' in response2.data ? response2.data.data : response2.data;
      }
      throw e;
    }
  },
};

export default rolesService;
