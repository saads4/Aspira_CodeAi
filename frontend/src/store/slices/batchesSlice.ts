// ─── Batches Slice ───────────────────────────────────────────────────────────
import { create } from 'zustand';
import type { Batch } from '@/types';
import { batchesService } from '@/services/api';

interface BatchesState {
  items: Batch[];
  loading: boolean;
  error: string | null;
  dateFilter: string;
  fetch: (date?: string) => Promise<void>;
  setDateFilter: (date: string) => void;
}

export const useBatchesStore = create<BatchesState>((set, get) => ({
  items: [],
  loading: false,
  error: null,
  dateFilter: '',

  fetch: async (date?: string) => {
    set({ loading: true, error: null });
    try {
      const d = date ?? get().dateFilter;
      const res = await batchesService.list(d || undefined);
      set({ items: res.data, loading: false });
    } catch (err: unknown) {
      set({ loading: false, error: (err as Error).message });
    }
  },

  setDateFilter: (date: string) => set({ dateFilter: date }),
}));
