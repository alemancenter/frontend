import { apiClient } from '../client';
import { API_ENDPOINTS } from '../config';
import type { Category, PaginatedResponse } from '@/types';

interface CategoryFilters {
  country?: string;
  page?: number;
  per_page?: number;
  search?: string;
  is_active?: boolean;
  [key: string]: string | number | boolean | undefined;
}

interface CategoryFormData {
  country: string;
  name: string;
  slug?: string; // Match backend CreateCategoryRequest { Name, Slug }
  parent_id?: number;
  icon_image?: File;
  image?: File;
  is_active?: boolean;
  icon?: string;
}

export const categoriesService = {
  /**
   * Get all categories with optional filters
   */
  async getAll(filters?: CategoryFilters, options?: RequestInit, isPublic: boolean = false): Promise<unknown> {
    try {
      const endpoint = isPublic ? API_ENDPOINTS.CATEGORIES.LIST_PUBLIC : API_ENDPOINTS.CATEGORIES.LIST;
      const response = await apiClient.get<{ data: PaginatedResponse<Category> } | Category[] | PaginatedResponse<Category>>(
        endpoint,
        filters,
        options
      );
      return response.data;
    } catch (e: any) {
      if (e && e.status === 404 && !isPublic) {
        const response2 = await apiClient.get<{ data: PaginatedResponse<Category> } | Category[] | PaginatedResponse<Category>>(
          '/categories',
          filters,
          options
        );
        return response2.data;
      }
      throw e;
    }
  },

  /**
   * Get single category by ID
   */
  async getById(id: number | string, country: string = '1'): Promise<Category> {
    try {
      const response = await apiClient.get<{ data: Category } | Category>(
        API_ENDPOINTS.CATEGORIES.SHOW(id),
        { country }
      );
      return (response.data as any).data ?? (response.data as any);
    } catch (e: any) {
      if (e && e.status === 404) {
        const response2 = await apiClient.get<{ data: Category } | Category>(
          `/dashboard/categories/${id}`,
          { country }
        );
        return (response2.data as any).data ?? (response2.data as any);
      }
      throw e;
    }
  },

  /**
   * Create new category
   */
  async create(data: CategoryFormData): Promise<Category> {
    const { country, name, slug, parent_id, is_active, icon, icon_image, image } = data;

    const payload = {
      name,
      slug,
      parent_id,
      is_active,
      icon
    };

    try {
      const response = await apiClient.post<{ data: Category } | Category>(
        API_ENDPOINTS.CATEGORIES.STORE,
        payload,
        { params: { country } }
      );

      const category = (response.data as any).data ?? (response.data as any);

      // Upload files separately if provided
      if (icon_image instanceof File) {
        const iconData = new FormData();
        iconData.append('file', icon_image);
        iconData.append('category_id', String(category.id));
        iconData.append('file_category', 'category_icon');
        try {
          await apiClient.upload('/dashboard/files', iconData, { country });
        } catch (e) {
          console.error('Failed to upload category icon', e);
        }
      }

      if (image instanceof File) {
        const imgData = new FormData();
        imgData.append('file', image);
        imgData.append('category_id', String(category.id));
        imgData.append('file_category', 'category_image');
        try {
          await apiClient.upload('/dashboard/files', imgData, { country });
        } catch (e) {
          console.error('Failed to upload category image', e);
        }
      }

      return category;
    } catch (e: any) {
      throw e;
    }
  },

  /**
   * Update existing category
   */
  async update(id: number | string, data: Partial<CategoryFormData>): Promise<Category> {
    const { country, name, slug, parent_id, is_active, icon, icon_image, image } = data;

    const payload = {
      name,
      slug,
      parent_id,
      is_active,
      icon
    };

    try {
      const response = await apiClient.post<{ data: Category } | Category>(
        API_ENDPOINTS.CATEGORIES.UPDATE(id),
        payload,
        { params: { country } }
      );

      const category = (response.data as any).data ?? (response.data as any);

      // Upload files separately if provided
      if (icon_image instanceof File) {
        const iconData = new FormData();
        iconData.append('file', icon_image);
        iconData.append('category_id', String(id));
        iconData.append('file_category', 'category_icon');
        try {
          await apiClient.upload('/dashboard/files', iconData, { country });
        } catch (e) {
          console.error('Failed to upload category icon', e);
        }
      }

      if (image instanceof File) {
        const imgData = new FormData();
        imgData.append('file', image);
        imgData.append('category_id', String(id));
        imgData.append('file_category', 'category_image');
        try {
          await apiClient.upload('/dashboard/files', imgData, { country });
        } catch (e) {
          console.error('Failed to upload category image', e);
        }
      }

      return category;
    } catch (e: any) {
      throw e;
    }
  },
  
  /**
   * Delete category
   */
  async delete(id: number | string, country: string = '1'): Promise<{ message: string }> {
    try {
      const resp = await apiClient.delete<{ message: string }>(API_ENDPOINTS.CATEGORIES.DELETE(id), { country });
      return (resp.data as any).data ?? (resp.data as any) ?? { message: 'تم الحذف بنجاح' };
    } catch (e: any) {
      if (e && e.status === 404) {
        const resp2 = await apiClient.delete<{ message: string }>(`/dashboard/categories/${id}`, { country });
        return (resp2.data as any).data ?? (resp2.data as any) ?? { message: 'تم الحذف بنجاح' };
      }
      throw e;
    }
  },

  /**
   * Toggle category active status
   */
  async toggle(id: number | string, country: string = '1'): Promise<Category> {
    try {
      const response = await apiClient.post<{ data: Category } | Category>(
        API_ENDPOINTS.CATEGORIES.TOGGLE(id),
        { country }
      );
      return (response.data as any).data ?? (response.data as any);
    } catch (e: any) {
      if (e && e.status === 404) {
        const response2 = await apiClient.post<{ data: Category } | Category>(
          `/dashboard/categories/${id}/toggle`,
          { country }
        );
        return (response2.data as any).data ?? (response2.data as any);
      }
      throw e;
    }
  },
};

export default categoriesService;
