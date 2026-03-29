// ─── Core Type Definitions — Aspira TAT Monitor ─────────────────────────────
// Strictly mirrors the MongoDB schemas in node-service/src/models/
// and the API response shapes from all route handlers.

// ─── Sample ──────────────────────────────────────────────────────────────────
export type SampleStatus = 'pending' | 'processing' | 'assigned' | 'delayed' | 'completed' | 'error';

export interface Sample {
  _id: string;
  sample_id: string;
  test_id: string;
  test_name: string;
  test_code: string;
  method: string;
  specimen_type: string;
  received_at: string;           // ISO string (UTC)
  agreed_tat_hours: number;
  priority_tat: 'NORMAL' | 'HIGH' | 'URGENT';

  // Batch assignment
  batch_id: string;
  batch_run_start: string;       // ISO string
  batch_cutoff: string;          // ISO string

  // Computed
  eta: string;                   // ISO string
  sla_deadline: string;          // ISO string
  breach_flag: boolean;
  overage_minutes: number;

  // Missed-batch
  missed_batch: boolean;
  delay_reason: string;

  // Result completion
  result_ready_at: string;
  actual_tat_minutes: number;
  completed_within_sla: boolean;
  prediction_error_minutes: number;

  // Status
  status: SampleStatus;
  processed: boolean;

  // Timestamps (from { createdAt: 'created_at', updatedAt: 'updated_at' })
  created_at: string;
  updated_at: string;
}

// ─── Alert ───────────────────────────────────────────────────────────────────
export type AlertType = 'MISSED_BATCH' | 'SLA_BREACH' | 'DELAY_ESCALATION' | 'RESULT_COMPLETED';

export interface AlertData {
  sample_id: string;
  test_name: string;
  priority: string;
  received_at: string;
  batch_id: string;
  batch_run_start: string;
  eta: string;
  sla_deadline: string;
  overage_minutes: number;
  reason: string;
  recommended_action: string;
}

export interface Alert {
  _id: string;
  type: AlertType;
  sample_id: string;
  test_name: string;
  priority: 'NORMAL' | 'HIGH' | 'URGENT';
  alert_data: AlertData;
  acknowledged: boolean;
  created_at: string;
  updated_at: string;
}

// ─── Batch ───────────────────────────────────────────────────────────────────
export interface Batch {
  batch_id: string;
  batch_run_start: string;
  batch_cutoff: string;
  total_samples: number;
  breached_count: number;
  missed_count: number;
  avg_overage_minutes: number;
  test_names: string[];
}

// ─── Stats ───────────────────────────────────────────────────────────────────
export interface StatsCount {
  total: number;
  pending: number;
  assigned: number;
  delayed: number;
  breached: number;
  error: number;
  missed_batch: number;
  completed: number;
}

export interface RecentBreach {
  sample_id: string;
  test_name: string;
  eta: string;
  sla_deadline: string;
  overage_minutes: number;
  updated_at: string;
}

export interface RecentMissed {
  sample_id: string;
  test_name: string;
  batch_id: string;
  delay_reason: string;
  updated_at: string;
}

export interface ResultMetrics {
  avg_actual_tat: number | null;
  sla_compliance_rate: number | null;
  avg_prediction_error: number | null;
  total_completed: number;
}

export interface Stats {
  counts: StatsCount;
  result_metrics: ResultMetrics;
  recent_breaches: RecentBreach[];
  recent_missed: RecentMissed[];
}

export interface AlertSummary {
  MISSED_BATCH?: number;
  SLA_BREACH?: number;
  DELAY_ESCALATION?: number;
  RESULT_COMPLETED?: number;
}

// ─── API Response Wrappers ───────────────────────────────────────────────────
export interface PaginatedResponse<T> {
  status: 'ok' | 'error';
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  data: T[];
}

export interface SingleResponse<T> {
  status: 'ok' | 'error';
  data: T;
}

export interface CountResponse {
  status: 'ok' | 'error';
  count: number;
  data: Batch[];
}

// ─── Filter State ────────────────────────────────────────────────────────────
export interface SampleFilters {
  status?: SampleStatus | '';
  breach?: boolean | null;
  missed?: boolean | null;
  test_name?: string;
  page: number;
  limit: number;
  sort: string;
}

export interface AlertFilters {
  type?: AlertType | '';
  sample_id?: string;
  acknowledged?: boolean | null;
  page: number;
  limit: number;
}

// ─── WebSocket Event Types ────────────────────────────────────────────────────
// These are the SSE/polling event shapes used by the real-time sync layer.
// The backend doesn't have WS yet so we model the polling update shape.
export type UpdateEventType =
  | 'SAMPLE_UPDATED'
  | 'SAMPLE_CREATED'
  | 'ALERT_CREATED'
  | 'STATS_UPDATED'
  | 'BATCH_UPDATED';

export interface DataSyncEvent<T = unknown> {
  type: UpdateEventType;
  payload: T;
  timestamp: string;
  version: number; // monotonic, used to prevent stale overwrites
}

// ─── UI State Types ──────────────────────────────────────────────────────────
export type ConnectionStatus = 'connected' | 'disconnected' | 'reconnecting' | 'polling';

export interface ScanPayload {
  sample_id: string;
  test_name: string;
  received_at: string;
  agreed_tat_hours: number;
  priority_tat: 'NORMAL' | 'HIGH' | 'URGENT';
  method?: string;
  specimen_type?: string;
  test_id?: string;
  test_code?: string;
}
