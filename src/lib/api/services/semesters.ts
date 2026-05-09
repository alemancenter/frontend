import { apiClient } from '../client';
import { API_ENDPOINTS } from '../config';
import type { Semester } from '@/types';

interface SemesterFormData {
  country_id: string;
  semester_name: string;
  grade_level: number;
}

export const semestersService = {
  async getAll(country_id: string = '1'): Promise<Semester[]> {
    const response = await apiClient.get<{ data: Semester[] }>(
      API_ENDPOINTS.SEMESTERS.LIST,
      { country_id, per_page: 500 }
    );
    return (response.data as any).data ?? (response.data as any);
  },

  async getById(id: number | string, country_id: string = '1'): Promise<Semester> {
    const response = await apiClient.get<{ data: Semester }>(
      API_ENDPOINTS.SEMESTERS.SHOW(id),
      { country_id }
    );
    return (response.data as any).data ?? (response.data as any);
  },

  async create(data: SemesterFormData): Promise<Semester> {
    const { country_id, ...body } = data;
    const response = await apiClient.post<{ data: Semester }>(
      API_ENDPOINTS.SEMESTERS.STORE,
      body,
      { params: { country_id } }
    );
    return (response.data as any).data ?? (response.data as any);
  },

  async update(id: number | string, data: SemesterFormData): Promise<Semester> {
    const { country_id, ...body } = data;
    const response = await apiClient.put<{ data: Semester }>(
      API_ENDPOINTS.SEMESTERS.UPDATE(id),
      body,
      { params: { country_id } }
    );
    return (response.data as any).data ?? (response.data as any);
  },

  async delete(id: number | string, country_id: string = '1'): Promise<{ message: string }> {
    const response = await apiClient.delete(API_ENDPOINTS.SEMESTERS.DELETE(id), { country_id });
    return { message: response.message || 'Deleted successfully' };
  },
};

export default semestersService;
