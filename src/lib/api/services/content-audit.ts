import { apiClient } from '../client';
import { API_CONFIG, API_ENDPOINTS } from '../config';

export type PolicyAuditStatus = 'running' | 'completed' | 'failed';
export type PolicyAuditTrigger = 'manual' | 'scheduled';

export interface PolicyAuditRun {
  id: number;
  status: PolicyAuditStatus;
  triggered_by: PolicyAuditTrigger;
  triggered_by_user_id?: number | null;
  started_at: string;
  finished_at?: string | null;
  findings_count: number;
  error_message?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PolicyAuditFinding {
  finding_id: number;
  run_id: number;
  type: 'article' | 'post' | 'comment' | 'file' | 'category' | string;
  id: string;
  title: string;
  risk: string;
  reason: string;
  url: string;
  recommended_action: string;
  created_at: string;
}

export interface PaginationMeta {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  from: number;
  to: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta?: PaginationMeta;
}


export type AIDecisionStatus = 'approved' | 'needs_fix' | 'restricted_ads' | 'rejected' | string;
export type AIRiskLevel = 'low' | 'medium' | 'high' | 'critical' | string;
export type AIFixStatus = 'pending' | 'previewed' | 'failed' | 'applied' | 'rejected' | string;

export interface ContentAIIssue {
  id?: number;
  decision_id?: number;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical' | string;
  message: string;
  action?: string;
  evidence?: string;
  created_at?: string;
}

export interface ContentAISuggestion {
  id?: number;
  decision_id?: number;
  type: string;
  priority: 'low' | 'medium' | 'high' | string;
  message: string;
  created_at?: string;
}

export interface ContentAIDecision {
  id: number;
  run_id?: number | null;
  finding_id?: number | null;
  content_type: string;
  content_id: string;
  country_code?: string;
  title?: string;
  decision: AIDecisionStatus;
  adsense_risk: AIRiskLevel;
  score: number;
  policy_score: number;
  seo_score: number;
  language_score: number;
  safety_links_score: number;
  structure_score: number;
  can_auto_fix: boolean;
  provider?: string;
  model?: string;
  prompt_version?: string;
  ai_tokens?: number;
  processing_time_ms?: number;
  summary?: string;
  report_json?: string;
  created_by_user_id?: number | null;
  created_at?: string;
  updated_at?: string;
  issues?: ContentAIIssue[];
  suggestions?: ContentAISuggestion[];
}

export interface ContentAIFixPreview {
  id: number;
  decision_id: number;
  content_type: string;
  content_id: string;
  country_code?: string;
  original_title: string;
  original_content: string;
  fixed_title: string;
  fixed_content: string;
  fix_summary?: string;
  status: AIFixStatus;
  applied_by_user_id?: number | null;
  applied_at?: string | null;
  rejected_by_user_id?: number | null;
  rejected_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface AIAnalyzePayload {
  run_id?: number;
  finding_id?: number;
  content_type: string;
  content_id: string;
  country_code?: string;
  title?: string;
  content?: string;
  url?: string;
}

export interface ContentAuditFilters {
  page?: number;
  per_page?: number;
  risk?: string;
  type?: string;
  q?: string;
  [key: string]: string | number | boolean | undefined;
}

function unwrapData<T>(response: any): T {
  return (response?.data?.data ?? response?.data) as T;
}

function unwrapPaginated<T>(response: any): PaginatedResult<T> {
  const envelope = response?.data ?? {};
  return {
    data: Array.isArray(envelope.data) ? envelope.data : [],
    meta: envelope.meta ?? envelope.pagination,
  };
}


const inFlightAIAnalyze = new Map<string, Promise<ContentAIDecision>>();
const inFlightFixPreview = new Map<string, Promise<ContentAIFixPreview>>();

function stablePayloadKey(payload: AIAnalyzePayload): string {
  return [payload.run_id ?? '', payload.finding_id ?? '', payload.content_type, payload.content_id, payload.country_code ?? '', payload.title ?? ''].join('|');
}

async function pollFixPreviewUntilReady(previewId: number, maxAttempts = 60, delayMs = 3000): Promise<ContentAIFixPreview> {
  let latest = await contentAuditService.getFixPreview(previewId);
  for (let attempt = 0; attempt < maxAttempts && latest.status === 'pending'; attempt += 1) {
    await new Promise((resolve) => window.setTimeout(resolve, delayMs));
    latest = await contentAuditService.getFixPreview(previewId);
  }
  return latest;
}

export const contentAuditService = {
  async startRun(): Promise<PolicyAuditRun> {
    const response = await apiClient.post(API_ENDPOINTS.CONTENT_AUDIT.RUN);
    return unwrapData<PolicyAuditRun>(response);
  },

  async listRuns(params?: { page?: number; per_page?: number }): Promise<PaginatedResult<PolicyAuditRun>> {
    const response = await apiClient.get(API_ENDPOINTS.CONTENT_AUDIT.RUNS, params, { cache: 'no-store' });
    return unwrapPaginated<PolicyAuditRun>(response);
  },

  async getRun(id: number | string): Promise<PolicyAuditRun> {
    const response = await apiClient.get(API_ENDPOINTS.CONTENT_AUDIT.SHOW(id), undefined, { cache: 'no-store' });
    return unwrapData<PolicyAuditRun>(response);
  },

  async listFindings(runId: number | string, params?: ContentAuditFilters): Promise<PaginatedResult<PolicyAuditFinding>> {
    const response = await apiClient.get(API_ENDPOINTS.CONTENT_AUDIT.FINDINGS(runId), params, { cache: 'no-store' });
    return unwrapPaginated<PolicyAuditFinding>(response);
  },


  async analyzeWithAI(payload: AIAnalyzePayload): Promise<ContentAIDecision> {
    const key = stablePayloadKey(payload);
    const existing = inFlightAIAnalyze.get(key);
    if (existing) return existing;
    const promise = apiClient
      .post(API_ENDPOINTS.CONTENT_AUDIT.AI_ANALYZE, payload, { retries: 0, timeout: 60000 })
      .then((response) => unwrapData<ContentAIDecision>(response))
      .finally(() => inFlightAIAnalyze.delete(key));
    inFlightAIAnalyze.set(key, promise);
    return promise;
  },

  async getDecision(id: number | string): Promise<ContentAIDecision> {
    const response = await apiClient.get(API_ENDPOINTS.CONTENT_AUDIT.AI_DECISION(id), undefined, { cache: 'no-store' });
    return unwrapData<ContentAIDecision>(response);
  },

  async getLatestDecision(type: string, contentId: number | string, countryCode?: string): Promise<ContentAIDecision | null> {
    const response = await apiClient.get(
      API_ENDPOINTS.CONTENT_AUDIT.AI_LATEST_DECISION(type, contentId),
      countryCode ? { country: countryCode } : undefined,
      { cache: 'no-store' }
    );
    const payload = unwrapData<any>(response);
    if (payload?.exists === false) return null;
    return (payload?.decision ?? payload) as ContentAIDecision;
  },

  async createFixPreview(decisionId: number | string): Promise<ContentAIFixPreview> {
    const key = String(decisionId);
    const existing = inFlightFixPreview.get(key);
    if (existing) return existing;
    const promise = apiClient
      .post(API_ENDPOINTS.CONTENT_AUDIT.AI_FIX_PREVIEW, { decision_id: Number(decisionId) }, { retries: 0, timeout: 155000 })
      .then((response) => unwrapData<ContentAIFixPreview>(response))
      .finally(() => inFlightFixPreview.delete(key));
    inFlightFixPreview.set(key, promise);
    return promise;
  },

  async createAndWaitForFixPreview(decisionId: number | string): Promise<ContentAIFixPreview> {
    const preview = await this.createFixPreview(decisionId);
    if (typeof window === 'undefined' || preview.status !== 'pending') return preview;
    return pollFixPreviewUntilReady(preview.id);
  },

  async getFixPreview(id: number | string): Promise<ContentAIFixPreview> {
    const response = await apiClient.get(API_ENDPOINTS.CONTENT_AUDIT.AI_FIX_PREVIEW_SHOW(id), undefined, { cache: 'no-store' });
    return unwrapData<ContentAIFixPreview>(response);
  },

  async applyFix(fixPreviewId: number | string, note?: string): Promise<ContentAIFixPreview> {
    const response = await apiClient.post(API_ENDPOINTS.CONTENT_AUDIT.AI_APPLY_FIX, {
      fix_preview_id: Number(fixPreviewId),
      note: note || '',
    });
    return unwrapData<ContentAIFixPreview>(response);
  },

  async rejectFix(fixPreviewId: number | string, note?: string): Promise<ContentAIFixPreview> {
    const response = await apiClient.post(API_ENDPOINTS.CONTENT_AUDIT.AI_REJECT_FIX, {
      fix_preview_id: Number(fixPreviewId),
      note: note || '',
    });
    return unwrapData<ContentAIFixPreview>(response);
  },

  async downloadCsv(runId: number | string): Promise<void> {
    const token = apiClient.getToken();
    const frontendKey = process.env.NEXT_PUBLIC_FRONTEND_API_KEY;
    const response = await fetch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.CONTENT_AUDIT.EXPORT(runId)}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        Accept: 'text/csv',
        'X-Requested-With': 'XMLHttpRequest',
        ...(frontendKey ? { 'X-Frontend-Key': frontendKey } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      throw new Error(data?.message || 'Failed to export content audit report');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `policy_audit_report_run_${runId}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};

export default contentAuditService;
