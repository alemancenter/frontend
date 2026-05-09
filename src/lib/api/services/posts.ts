import { apiClient } from '../client';
import { API_ENDPOINTS } from '../config';
import type { Post, PaginatedResponse } from '@/types';

type PostFilters = Record<string, string | number | boolean | undefined> & {
  country?: string;
  search?: string;
  page?: number;
  per_page?: number;
  category_id?: number | string;
  is_featured?: boolean | number;
  sort_by?: string;
  sort_dir?: 'asc' | 'desc';
};

interface PostFormData {
  country: string;
  title: string;
  content: string;
  category_id: number;
  meta_description?: string;
  keywords?: string;
  is_active?: boolean;
  is_featured?: boolean;
  image?: File;
  attachments?: File[];
}

function appendPostField(formData: FormData, key: string, value: string | number | boolean | undefined) {
  if (value !== undefined) {
    formData.append(key, String(value));
  }
}

export const postsService = {
  /**
   * Get paginated posts list
   */
  async getAll(filters?: PostFilters, options?: RequestInit): Promise<PaginatedResponse<Post>> {
    const response = await apiClient.get<PaginatedResponse<Post>>(
      API_ENDPOINTS.POSTS.LIST_PUBLIC,
      filters,
      options
    );
    return response as any;
  },

  /**
   * Get single post by ID
   */
  async getById(id: number | string, country: string = '1'): Promise<Post> {
    const response = await apiClient.get<{ data: Post }>(
      API_ENDPOINTS.POSTS.SHOW_PUBLIC(id),
      { country }
    );
    // apiClient unwraps the response if it has a 'data' property
    // But we need to be careful about the type.
    return (response.data as any).data || response.data;
  },

  /**
   * Create new post
   */
  async create(data: PostFormData): Promise<Post> {
    const { country, attachments, image, ...rest } = data;
    const hasImage = image instanceof File;

    let post: Post;

    if (hasImage) {
      const formData = new FormData();
      appendPostField(formData, 'title', rest.title);
      appendPostField(formData, 'content', rest.content);
      appendPostField(formData, 'category_id', rest.category_id);
      appendPostField(formData, 'meta_description', rest.meta_description);
      appendPostField(formData, 'keywords', rest.keywords);
      appendPostField(formData, 'is_active', rest.is_active);
      appendPostField(formData, 'is_featured', rest.is_featured);

      if (image instanceof File) {
        formData.append('image', image);
      }

      const response = await apiClient.upload<{ data: Post }>(
        API_ENDPOINTS.POSTS.STORE,
        formData,
        { country }
      );

      post = ((response.data as any).data || response.data) as Post;
    } else {
      const response = await apiClient.post<{ data: Post }>(
        API_ENDPOINTS.POSTS.STORE,
        rest,
        { params: { country } }
      );

      post = ((response.data as any).data || response.data) as Post;
    }

    if (attachments && Array.isArray(attachments)) {
      for (const file of attachments) {
        if (file instanceof File) {
          const attachData = new FormData();
          attachData.append('file', file);
          attachData.append('post_id', String(post.id));
          attachData.append('file_category', 'post_attachment');
          try {
            await apiClient.upload('/dashboard/files', attachData, { country });
          } catch (err: any) {
            throw new Error(err?.message || `فشل رفع المرفق: ${file.name}`);
          }
        }
      }
    }

    return post;
  },

  /**
   * Update existing post
   */
  async update(id: number | string, data: Partial<PostFormData>): Promise<Post> {
    const { country, attachments, image, ...rest } = data;

    const response = await apiClient.put<{ data: Post }>(
      API_ENDPOINTS.POSTS.UPDATE(id),
      rest,
      { params: { country } }
    );

    const post = (response.data as any).data || response.data;

    // Handle image upload separately
    if (image instanceof File) {
      const imgData = new FormData();
      imgData.append('file', image);
      imgData.append('post_id', String(id));
      imgData.append('file_category', 'post_image');
      try {
        await apiClient.upload('/dashboard/files', imgData, { country });
      } catch (err) {
        console.error('Failed to upload post image:', err);
      }
    }

    // Handle attachments upload separately
    if (attachments && Array.isArray(attachments)) {
      for (const file of attachments) {
        if (file instanceof File) {
          const attachData = new FormData();
          attachData.append('file', file);
          attachData.append('post_id', String(id));
          attachData.append('file_category', 'post_attachment');
          try {
            await apiClient.upload('/dashboard/files', attachData, { country });
          } catch (err) {
            console.error('Failed to upload post attachment:', err);
          }
        }
      }
    }

    return post;
  },

  async isTitleUnique(title: string, country: string = '1'): Promise<boolean> {
    if (!title.trim()) return true;
    const response = await apiClient.get<PaginatedResponse<Post>>(
      API_ENDPOINTS.POSTS.LIST_PUBLIC,
      { country, search: title, per_page: 20 }
    );
    const list = response.data?.data || (Array.isArray(response.data) ? response.data : []) || [];
    const found = list.some((p: Post) => (p.title || '').trim().toLowerCase() === title.trim().toLowerCase());
    return !found;
  },

  /**
   * Toggle post status
   */
  async toggleStatus(id: number | string, country: string = '1'): Promise<boolean> {
    const response = await apiClient.post<{ success: boolean; is_active: boolean }>(
      API_ENDPOINTS.POSTS.TOGGLE_STATUS(id),
      { country }
    );
    return response.data.is_active;
  },

  /**
   * Delete post
   */
  async delete(id: number | string, country: string = '1'): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string } | { data: { message: string } }>(
      API_ENDPOINTS.POSTS.DELETE(id),
      { country }
    );
    return 'data' in response.data ? response.data.data : response.data;
  },
};

export default postsService;
