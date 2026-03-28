// ─── Samples Slice ───────────────────────────────────────────────────────────
import { create } from 'zustand';
import type { Sample, SampleFilters, PaginatedResponse } from '@/types';
import { samplesService } from '@/services/api';

interface SamplesState {
  items: Sample[];
  total: number;
  totalPages: number;
  loading: boolean;
  error: string | null;
  filters: SampleFilters;
  selectedSample: Sample | null;

  // Actions
  setFilters: (f: Partial<SampleFilters>) => void;
  fetch: () => Promise<void>;
  fetchById: (id: string) => Promise<void>;
  applyRealTimeUpdate: (updated: Sample) => void;
  applyRealTimeInsert: (created: Sample) => void;
  clearSelected: () => void;
}

export const useSamplesStore = create<SamplesState>((set, get) => ({
  items: [],
  total: 0,
  totalPages: 1,
  loading: false,
  error: null,
  selectedSample: null,
  filters: {
    page: 1,
    limit: 50,
    sort: '-created_at',
    status: '',
  },

  setFilters: (f) =>
    set((s) => ({
      filters: { ...s.filters, ...f, page: f.page ?? 1 },
    })),

  fetch: async () => {
    set({ loading: true, error: null });
    try {
      const res: PaginatedResponse<Sample> = await samplesService.list(get().filters);
      set({
        items: res.data,
        total: res.total,
        totalPages: res.totalPages,
        loading: false,
      });
    } catch (err: unknown) {
      set({ loading: false, error: (err as Error).message });
    }
  },

  fetchById: async (id: string) => {
    try {
      const res = await samplesService.getById(id);
      set({ selectedSample: res.data });
    } catch (err: unknown) {
      set({ error: (err as Error).message });
    }
  },

  /**
   * Version-safe real-time update.
   * Only overwrites if the incoming record is newer (updated_at comparison).
   */
  applyRealTimeUpdate: (updated: Sample) => {
    set((s) => ({
      items: s.items.map((item) => {
        if (item.sample_id !== updated.sample_id) return item;
        // Stale guard: skip if stored record is already newer
        const storedTs = new Date(item.updated_at ?? item.created_at).getTime();
        const incomingTs = new Date(updated.updated_at ?? updated.created_at).getTime();
        return incomingTs >= storedTs ? updated : item;
      }),
    }));
  },

  applyRealTimeInsert: (created: Sample) => {
    set((s) => {
      // Avoid duplicates
      if (s.items.some((i) => i.sample_id === created.sample_id)) return s;
      return {
        items: [created, ...s.items].slice(0, s.filters.limit),
        total: s.total + 1,
      };
    });
  },

  clearSelected: () => set({ selectedSample: null }),
}));
