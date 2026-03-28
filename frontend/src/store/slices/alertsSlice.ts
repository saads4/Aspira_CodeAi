// ─── Alerts Slice ────────────────────────────────────────────────────────────
import { create } from 'zustand';
import type { Alert, AlertFilters, AlertSummary } from '@/types';
import { alertsService } from '@/services/api';

interface AlertsState {
  items: Alert[];
  summary: AlertSummary | null;
  total: number;
  totalPages: number;
  loading: boolean;
  error: string | null;
  filters: AlertFilters;

  fetch: () => Promise<void>;
  fetchSummary: () => Promise<void>;
  setFilters: (f: Partial<AlertFilters>) => void;
  prependAlert: (alert: Alert) => void;
  setSummary: (s: AlertSummary) => void;
}

export const useAlertsStore = create<AlertsState>((set, get) => ({
  items: [],
  summary: null,
  total: 0,
  totalPages: 1,
  loading: false,
  error: null,
  filters: {
    page: 1,
    limit: 50,
  },

  fetch: async () => {
    set({ loading: true, error: null });
    try {
      const res = await alertsService.list(get().filters);
      set({ items: res.data, total: res.total, totalPages: res.totalPages, loading: false });
    } catch (err: unknown) {
      set({ loading: false, error: (err as Error).message });
    }
  },

  fetchSummary: async () => {
    try {
      const res = await alertsService.summary();
      set({ summary: res.data });
    } catch {
      // summary is bonus data — non-critical
    }
  },

  setFilters: (f) =>
    set((s) => ({ filters: { ...s.filters, ...f, page: f.page ?? 1 } })),

  prependAlert: (alert: Alert) =>
    set((s) => ({
      items: [alert, ...s.items].slice(0, s.filters.limit),
      total: s.total + 1,
    })),

  setSummary: (summary: AlertSummary) => set({ summary }),
}));
