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
    console.log('STATS STORE: Fetching stats...');
    set({ loading: true, error: null });
    try {
      const res = await statsService.get();
      
      // Add null safety before accessing res.data
      if (!res || !res.data) {
        console.error('STATS STORE: Invalid stats response', res);
        set({ loading: false, error: 'Invalid stats response: missing data' });
        return;
      }
      
      console.log('STATS STORE: Received stats data:', res.data);
      set({ data: res.data, loading: false, lastFetchedAt: Date.now() });
    } catch (err: unknown) {
      console.error('STATS STORE: Error fetching stats:', err);
      set({ loading: false, error: (err as Error).message });
    }
  },

  setData: (data: Stats) => {
    // Add null safety check
    if (!data) {
      console.error('STATS STORE: Attempted to set null data');
      return;
    }
    console.log('STATS STORE: Setting data:', data);
    set({ data, lastFetchedAt: Date.now() });
  },
}));
