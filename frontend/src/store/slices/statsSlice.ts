// ─── Stats Slice ─────────────────────────────────────────────────────────────
import { create } from 'zustand';
import type { Stats } from '@/types';
import { statsService } from '@/services/api';

interface StatsState {
  data: Stats | null;
  loading: boolean;
  error: string | null;
  lastFetchedAt: number | null;
  fetch: () => Promise<void>;
  setData: (data: Stats) => void;
}

export const useStatsStore = create<StatsState>((set) => ({
  data: null,
  loading: false,
  error: null,
  lastFetchedAt: null,

  fetch: async () => {
    set({ loading: true, error: null });
    try {
      const res = await statsService.get();
      set({ data: res.data, loading: false, lastFetchedAt: Date.now() });
    } catch (err: unknown) {
      set({ loading: false, error: (err as Error).message });
    }
  },

  setData: (data: Stats) => set({ data, lastFetchedAt: Date.now() }),
}));
