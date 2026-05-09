import { apiClient } from '../client';
import { API_ENDPOINTS } from '../config';
import type { Article, PaginatedResponse, SchoolClass, Subject, Semester } from '@/types';

export interface SEOArticle {
  title: string;
  slug: string;
  meta_title: string;
  meta_description: string;
  keywords: string[];
  content: string;
  content_html: string;
  faq: { question: string; answer: string }[];
  cover_alt_text: string;
  schema_type: string;
  schema_html: string;
  word_count: number;
}

const AI_GENERATION_TIMEOUT_MS = 300_000;
const AI_FIRST_POLL_DELAY_MS = 1_000;
const AI_POLL_INTERVAL_MS = 2_500;
const AI_MAX_TRANSIENT_POLL_ERRORS = 3;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function aiGenerationErrorMessage(error?: string) {
  const message = (error || '').trim();
  const lower = message.toLowerCase();

  if (lower.includes('timeout') || lower.includes('deadline') || message.includes('وقت')) {
    return 'استغرق توليد المقال وقتا أطول من المتوقع. يرجى المحاولة مرة أخرى بعد قليل.';
  }
  if (lower.includes('api key') || message.includes('مفتاح')) {
    return 'خدمة الذكاء الاصطناعي غير مهيأة. يرجى التحقق من إعدادات الخدمة.';
  }
  if (lower.includes('provider') || lower.includes('api error') || message.includes('الاتصال')) {
    return 'تعذر الاتصال بخدمة الذكاء الاصطناعي حاليا. يرجى المحاولة لاحقا.';
  }

  return message || 'تعذر توليد محتوى صالح لهذا العنوان. يرجى تعديل العنوان والمحاولة مرة أخرى.';
}

interface ArticleFilters {
  country?: string;
  page?: number;
  per_page?: number;
  q?: string;
  subject_id?: number;
  semester_id?: number;
  status?: boolean;
}

interface ArticleCreateData {
  country: string;
  classes: SchoolClass[];
  subjects: Subject[];
  semesters: Semester[];
}

export interface ArticleFormData {
  country: string;
  title: string;
  description?: string;
  meta_description?: string;
  content?: string;
  subject_id?: number;
  semester_id?: number;
  grade_level?: number;
  file?: File;
  is_published?: boolean;
  tags?: string[];
  keywords?: string;
  file_category?: string;
  file_name?: string;
  status?: boolean;
}

export interface ArticleStats {
  total: number;
  views: number;
  published: number;
  drafts: number;
}

export const articlesService = {
  /**
   * Get article statistics
   */
  async getStats(country: string = '1'): Promise<ArticleStats> {
    const response = await apiClient.get<{ data: ArticleStats }>(API_ENDPOINTS.ARTICLES.STATS, { country });
    const raw = response.data.data ?? response.data;
    return {
      total: raw.total ?? 0,
      views: raw.views ?? 0,
      published: raw.published ?? 0,
      drafts: raw.drafts ?? 0,
    };
  },

  /**
   * Get paginated list of articles
   */
  async getAll(filters?: ArticleFilters): Promise<PaginatedResponse<Article>> {
    // Cast filters to Record<string, string | number | boolean | undefined> to satisfy TS
    const params = filters as unknown as Record<string, string | number | boolean | undefined>;
    const response = await apiClient.get<PaginatedResponse<Article>>(
      API_ENDPOINTS.ARTICLES.LIST,
      params
    );
    return response.data;
  },

  /**
   * Get data needed for creating an article (classes, subjects, semesters)
   */
  async getCreateData(country: string = '1'): Promise<ArticleCreateData> {
    const response = await apiClient.get<{ data: ArticleCreateData }>(
      API_ENDPOINTS.ARTICLES.CREATE,
      { country_id: country }
    );
    return response.data.data ?? response.data;
  },

  /**
   * Get single article by ID
   */
  async getById(id: number | string, country: string = '1'): Promise<Article> {
    const response = await apiClient.get<{ data: Article }>(
      API_ENDPOINTS.ARTICLES.SHOW(id),
      { country }
    );
    return response.data.data || response.data;
  },

  /**
   * Get article edit data (article + classes, subjects, semesters)
   */
  async getEditData(id: number | string, country: string = '1'): Promise<{
    data: Article;
    classes: SchoolClass[];
    subjects: Subject[];
    semesters: Semester[];
  }> {
    const response = await apiClient.get<{
      data: { data: Article; classes: SchoolClass[]; subjects: Subject[]; semesters: Semester[] };
    }>(
      API_ENDPOINTS.ARTICLES.EDIT(id),
      { country }
    );
    const resData = response.data.data;
    return {
      data: resData.data,
      classes: resData.classes || [],
      subjects: resData.subjects || [],
      semesters: resData.semesters || [],
    };
  },

  /**
   * Create new article with file upload support
   */
  async create(data: ArticleFormData): Promise<Article> {
    const { country, file, file_name, file_category, grade_level, status, is_published: _isPublished, ...rest } = data;
    void _isPublished;
    
    // First, create the article
    const payload = {
      ...rest,
      grade_level: grade_level ? String(grade_level) : undefined,
      status: status ? 1 : 0,
    };

    const response = await apiClient.post<{ data: Article }>(
      API_ENDPOINTS.ARTICLES.STORE,
      payload,
      { params: { country } }
    );
    
    const article = response.data.data || response.data;
    
    // If there is a file, upload it and attach to the article
    if (file) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('article_id', String(article.id));
      if (file_name) formData.append('file_name', file_name);
      if (file_category) formData.append('file_category', file_category);
      
      try {
        await apiClient.upload(
          '/dashboard/files',
          formData,
          { country }
        );
      } catch (err) {
        console.error('Failed to upload article file:', err);
        // We might want to handle partial failures or rollback,
        // but returning the article is safe.
      }
    }
    
    return article;
  },

  /**
   * Update existing article
   */
  async update(id: number | string, data: Partial<ArticleFormData>): Promise<Article> {
    const { country, file, file_name, file_category, grade_level, status, is_published: _isPublished, ...rest } = data;
    void _isPublished;
    
    const payload = {
      ...rest,
      grade_level: grade_level ? String(grade_level) : undefined,
      ...(status !== undefined && { status: status ? 1 : 0 }),
    };

    const response = await apiClient.put<{ data: Article }>(
      API_ENDPOINTS.ARTICLES.UPDATE(id),
      payload,
      { params: { country } }
    );
    
    const article = response.data.data || response.data;
    
    if (file) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('article_id', String(id));
      if (file_name) formData.append('file_name', file_name);
      if (file_category) formData.append('file_category', file_category);
      
      try {
        await apiClient.upload(
          '/dashboard/files',
          formData,
          { country }
        );
      } catch (err) {
        console.error('Failed to update article file:', err);
      }
    }
    
    return article;
  },

  /**
   * Delete article
   */
  async delete(id: number | string, country: string = '1'): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(API_ENDPOINTS.ARTICLES.DELETE(id), { country });
    return response.data;
  },

  /**
   * Toggle article status (publish/unpublish)
   */
  async toggleStatus(id: number | string, status: boolean, country: string = '1'): Promise<Article> {
    // Use dedicated publish/unpublish endpoints
    const endpoint = status
      ? API_ENDPOINTS.ARTICLES.PUBLISH(id)
      : API_ENDPOINTS.ARTICLES.UNPUBLISH(id);

    const response = await apiClient.post<{ data: Article }>(
      endpoint,
      { database: country }
    );
    return response.data.data || response.data;
  },

  /**
   * Get articles by class/grade level
   */
  async getByClass(gradeLevel: number | string, country: string = '1'): Promise<Article[]> {
    const response = await apiClient.get<{ data: Article[] }>(
      API_ENDPOINTS.ARTICLES.BY_CLASS(gradeLevel),
      { country }
    );
    // Unwrap the 'data' property
    return response.data.data || response.data;
  },

  /**
   * Get articles by keyword
   */
  async getByKeyword(keyword: string, country: string = '1'): Promise<Article[]> {
    const response = await apiClient.get<{ data: Article[] }>(
      API_ENDPOINTS.ARTICLES.BY_KEYWORD(keyword),
      { country }
    );
    // Unwrap the 'data' property
    return response.data.data || response.data;
  },

  /**
   * Publish article
   */
  async publish(id: number | string, country: string = '1'): Promise<Article> {
    const response = await apiClient.post<{ data: Article }>(
      API_ENDPOINTS.ARTICLES.PUBLISH(id),
      { country }
    );
    // Unwrap the 'data' property
    return response.data.data || response.data;
  },

  /**
   * Unpublish article
   */
  async unpublish(id: number | string, country: string = '1'): Promise<Article> {
    const response = await apiClient.post<{ data: Article }>(
      API_ENDPOINTS.ARTICLES.UNPUBLISH(id),
      { country }
    );
    // Unwrap the 'data' property
    return response.data.data || response.data;
  },
 
  async isTitleUnique(title: string, country: string = '1'): Promise<boolean> {
    if (!title.trim()) return true;
    const response = await apiClient.get<PaginatedResponse<Article>>(
      API_ENDPOINTS.ARTICLES.LIST,
      { country, q: title, per_page: 1 }
    );
    const list = response.data?.data || [];
    const found = list.some((a) => (a.title || '').trim().toLowerCase() === title.trim().toLowerCase());
    return !found;
  },

  /**
   * Generate content using AI — returns only the HTML content string.
   * Used by posts pages and any caller that needs just the content.
   */
  async generateAiContent(title: string): Promise<string> {
    const article = await articlesService.generateSEOArticle(title);
    return article.content_html || article.content || '';
  },

  /**
   * Generate a full structured SEO article using AI.
   * POST /ai/generate returns a job_id immediately; polls /ai/status/:id
   * until done/failed or the generation deadline is reached.
   * contentType: 'article' (default) produces educational links; 'post' produces general post links.
   */
  async generateSEOArticle(title: string, contentType: 'article' | 'post' = 'article'): Promise<SEOArticle> {
    // 1. Submit job — returns within milliseconds
    const submit = await apiClient.post<{ job_id: string }>(
      API_ENDPOINTS.ARTICLES.AI_GENERATE,
      { title, content_type: contentType },
      { timeout: 15000, retries: 0 }
    );
    const jobId = (submit.data as any).job_id as string;
    if (!jobId) throw new Error('فشل إنشاء مهمة الذكاء الاصطناعي');

    // 2. Poll until done, failed, or the shared AI generation deadline.
    const deadline = Date.now() + AI_GENERATION_TIMEOUT_MS;
    let pollCount = 0;
    let transientPollErrors = 0;

    while (Date.now() < deadline) {
      await sleep(pollCount === 0 ? AI_FIRST_POLL_DELAY_MS : AI_POLL_INTERVAL_MS);
      pollCount++;

      let result: { status?: string; article?: SEOArticle; error?: string };
      try {
        const poll = await apiClient.get<{ status: string; article?: SEOArticle; error?: string }>(
          API_ENDPOINTS.ARTICLES.AI_STATUS(jobId),
          undefined,
          { timeout: 12000, retries: 1, cache: 'no-store' }
        );
        result = poll.data as any;
        transientPollErrors = 0;
      } catch (error) {
        transientPollErrors++;
        if (transientPollErrors <= AI_MAX_TRANSIENT_POLL_ERRORS && Date.now() < deadline) {
          continue;
        }
        throw new Error(aiGenerationErrorMessage(error instanceof Error ? error.message : undefined));
      }

      if (result.status === 'done' && result.article) {
        return result.article as SEOArticle;
      }
      if (result.status === 'failed') {
        throw new Error(aiGenerationErrorMessage(result.error));
      }
    }

    throw new Error(aiGenerationErrorMessage('timeout'));
  },
};

export default articlesService;
