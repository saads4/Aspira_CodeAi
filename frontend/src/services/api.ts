// ─── Domain-level API Services ──────────────────────────────────────────────
// Thin wrappers over apiClient that return typed responses.
// All business-logic consumers call these — never apiClient directly.
// ─────────────────────────────────────────────────────────────────────────────

import { apiClient, buildQuery } from '@/lib/api-client';
import type {
  Alert,
  AlertFilters,
  AlertSummary,
  Batch,
  CountResponse,
  PaginatedResponse,
  Sample,
  SampleFilters,
  ScanPayload,
  SingleResponse,
  Stats,
} from '@/types';

// ─── Samples ─────────────────────────────────────────────────────────────────

export const samplesService = {
  list(filters: Partial<SampleFilters>): Promise<PaginatedResponse<Sample>> {
    const qs = buildQuery({
      status: filters.status,
      breach: filters.breach != null ? String(filters.breach) : undefined,
      missed: filters.missed != null ? String(filters.missed) : undefined,
      test_name: filters.test_name,
      page: filters.page ?? 1,
      limit: filters.limit ?? 50,
      sort: filters.sort ?? '-created_at',
    });
    return apiClient.get<PaginatedResponse<Sample>>(`/api/samples${qs}`);
  },

  getById(id: string): Promise<SingleResponse<Sample>> {
    return apiClient.get<SingleResponse<Sample>>(`/api/samples/${encodeURIComponent(id)}`);
  },
};

// ─── Stats ───────────────────────────────────────────────────────────────────

export const statsService = {
  get(): Promise<SingleResponse<Stats>> {
    return apiClient.get<SingleResponse<Stats>>('/api/stats');
  },
};

// ─── Batches ─────────────────────────────────────────────────────────────────

export const batchesService = {
  list(date?: string): Promise<CountResponse> {
    const qs = date ? buildQuery({ date }) : '';
    return apiClient.get<CountResponse>(`/api/batches${qs}`);
  },
};

// ─── Alerts ──────────────────────────────────────────────────────────────────

export const alertsService = {
  list(filters: Partial<AlertFilters>): Promise<PaginatedResponse<Alert>> {
    const qs = buildQuery({
      type: filters.type,
      acknowledged:
        filters.acknowledged != null ? String(filters.acknowledged) : undefined,
      page: filters.page ?? 1,
      limit: filters.limit ?? 50,
    });
    return apiClient.get<PaginatedResponse<Alert>>(`/api/alerts${qs}`);
  },

  summary(): Promise<SingleResponse<AlertSummary>> {
    return apiClient.get<SingleResponse<AlertSummary>>('/api/alerts/summary');
  },
};

// ─── Webhook / Scan ──────────────────────────────────────────────────────────

export const webhookService = {
  submit(payload: ScanPayload | { tests: ScanPayload[] }) {
    return apiClient.post<{
      status: string;
      message: string;
      count: number;
      sample_ids: string[];
    }>('/webhook', payload);
  },
};

// ─── Result Service ───────────────────────────────────────────────────────────

export const resultService = {
  submit(payload: {
    sample_id: string;
    test_name: string;
    result_ready_at: string;
  }) {
    return apiClient.post<{
      status: string;
      message: string;
    }>('/webhook/result', payload);
  },
};

// ─── Health ───────────────────────────────────────────────────────────────────

export const healthService = {
  check(): Promise<{ status: string; uptime: number }> {
    return apiClient.get<{ status: string; uptime: number }>('/health');
  },
};
