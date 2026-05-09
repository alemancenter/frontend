import { apiClient } from '../client';
import { API_ENDPOINTS } from '../config';
import { normalizeArray, normalizeObject } from '../normalize';
import type { SchoolClass } from '@/types';

interface SchoolClassFormData {
  country_id: string;
  grade_name: string;
  grade_level: number;
}

export const schoolClassesService = {
  /**
   * Get all school classes for dashboard/admin
   */
  async getAll(country_id: string = '1'): Promise<SchoolClass[]> {
    const response = await apiClient.get<any>(
      API_ENDPOINTS.SCHOOL_CLASSES.LIST,
      { country_id, per_page: 500 },
      { cache: 'no-store' }
    );

    return normalizeArray<SchoolClass>(response);
  },

  /**
   * Get all public school classes for frontend
   */
  async getPublicAll(country_id: string = '1'): Promise<SchoolClass[]> {
    const response = await apiClient.get<any>(
      API_ENDPOINTS.FRONTEND.CLASSES,
      { country_id },
      { cache: 'no-store' }
    );

    return normalizeArray<SchoolClass>(response);
  },

  /**
   * Get single school class by ID for dashboard/admin
   */
  async getById(id: number | string, country_id: string = '1'): Promise<SchoolClass> {
    const response = await apiClient.get<any>(
      API_ENDPOINTS.SCHOOL_CLASSES.SHOW(id),
      { country_id },
      { cache: 'no-store' }
    );

    return normalizeObject<SchoolClass>(response) ?? ({} as SchoolClass);
  },

  /**
   * Get public school class details
   */
  async getPublicById(id: number | string, country_id: string = '1'): Promise<SchoolClass> {
    const response = await apiClient.get<any>(
      API_ENDPOINTS.FRONTEND.CLASS_DETAILS(id),
      { country_id },
      { cache: 'no-store' }
    );

    return normalizeObject<SchoolClass>(response) ?? ({} as SchoolClass);
  },

  /**
   * Create new school class
   */
  async create(data: SchoolClassFormData): Promise<SchoolClass> {
    const response = await apiClient.post<any>(
      API_ENDPOINTS.SCHOOL_CLASSES.STORE,
      data
    );

    return normalizeObject<SchoolClass>(response) ?? ({} as SchoolClass);
  },

  /**
   * Update school class
   */
  async update(id: number | string, data: SchoolClassFormData): Promise<SchoolClass> {
    const response = await apiClient.put<any>(
      API_ENDPOINTS.SCHOOL_CLASSES.UPDATE(id),
      data
    );

    return normalizeObject<SchoolClass>(response) ?? ({} as SchoolClass);
  },

    /**
   * Delete school class
   */
  async delete(id: number | string, country_id: string = '1'): Promise<{ message: string }> {
    const response = await apiClient.delete<any>(
      API_ENDPOINTS.SCHOOL_CLASSES.DELETE(id),
      { country_id }
    );

    return {
      message:
        response?.message ||
        response?.data?.message ||
        'Deleted successfully',
    };
  },
};

export default schoolClassesService;