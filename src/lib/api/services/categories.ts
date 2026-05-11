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
   * Upload image and/or icon_image for a category via the dedicated images endpoint.
   * Files are stored in category_images/ on the server.
   * Returns the updated category with fresh image paths.
   */
  async _uploadImages(id: number | string, files: { image?: File; icon_image?: File }, country: string): Promise<Category | null> {
    const form = new FormData();
    if (files.image instanceof File) form.append('image', files.image);
    if (files.icon_image instanceof File) form.append('icon_image', files.icon_image);
    if (!files.image && !files.icon_image) return null;

    const res = await apiClient.upload<{ data: Category } | Category>(
      API_ENDPOINTS.CATEGORIES.UPLOAD_IMAGES(id),
      form,
      { country }
    );
    return (res.data as any).data ?? (res.data as any);
  },

  /**
   * Create new category
   */
  async create(data: CategoryFormData): Promise<Category> {
    const { country, name, slug, parent_id, is_active, icon, icon_image, image } = data;

    // Step 1: create metadata (JSON)
    const response = await apiClient.post<{ data: Category } | Category>(
      API_ENDPOINTS.CATEGORIES.STORE,
      { name, slug, parent_id, is_active, icon },
      { params: { country } }
    );
    let category: Category = (response.data as any).data ?? (response.data as any);

    // Step 2: upload images if provided, using the returned category ID
    if (icon_image instanceof File || image instanceof File) {
      const updated = await this._uploadImages(category.id, { image, icon_image }, country);
      if (updated) category = updated;
    }

    return category;
  },

  /**
   * Update existing category
   */
  async update(id: number | string, data: Partial<CategoryFormData>): Promise<Category> {
    const { country = '1', name, slug, parent_id, is_active, icon, icon_image, image } = data;

    // Step 1: update metadata (JSON, no files)
    const response = await apiClient.put<{ data: Category } | Category>(
      API_ENDPOINTS.CATEGORIES.UPDATE(id),
      { name, slug, parent_id, is_active, icon },
      { params: { country } }
    );
    let category: Category = (response.data as any).data ?? (response.data as any);

    // Step 2: upload images if new files were provided
    if (icon_image instanceof File || image instanceof File) {
      const updated = await this._uploadImages(id, { image, icon_image }, country);
      if (updated) category = updated;
    }

    return category;
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
