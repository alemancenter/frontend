import { apiClient } from '../client';
import { API_ENDPOINTS } from '../config';
import type { Subject } from '@/types';

interface SubjectFormData {
  country_id: string;
  subject_name: string;
  grade_level: number;
}

export const subjectsService = {
  async getAll(country_id: string = '1'): Promise<Subject[]> {
    const response = await apiClient.get<{ data: Subject[] }>(
      API_ENDPOINTS.SUBJECTS.LIST,
      { country_id, per_page: 500 }
    );
    return (response.data as any).data ?? (response.data as any);
  },

  async getById(id: number | string, country_id: string = '1'): Promise<Subject> {
    const response = await apiClient.get<{ data: Subject }>(
      API_ENDPOINTS.SUBJECTS.SHOW(id),
      { country_id }
    );
    return (response.data as any).data ?? (response.data as any);
  },

  async create(data: SubjectFormData): Promise<Subject> {
    const { country_id, ...body } = data;
    const response = await apiClient.post<{ data: Subject }>(
      API_ENDPOINTS.SUBJECTS.STORE,
      body,
      { params: { country_id } }
    );
    return (response.data as any).data ?? (response.data as any);
  },

  async update(id: number | string, data: SubjectFormData): Promise<Subject> {
    const { country_id, ...body } = data;
    const response = await apiClient.put<{ data: Subject }>(
      API_ENDPOINTS.SUBJECTS.UPDATE(id),
      body,
      { params: { country_id } }
    );
    return (response.data as any).data ?? (response.data as any);
  },

  async delete(id: number | string, country_id: string = '1'): Promise<{ message: string }> {
    const response = await apiClient.delete(API_ENDPOINTS.SUBJECTS.DELETE(id), { country_id });
    return { message: response.message || 'Deleted successfully' };
  },
};

export default subjectsService;
