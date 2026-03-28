// ─── useSampleDetail — fetch & cache individual sample ───────────────────────
'use client';

import { useEffect, useCallback } from 'react';
import { useSamplesStore } from '@/store/slices/samplesSlice';

export function useSampleDetail(sampleId: string | null) {
  const fetchById = useSamplesStore((s) => s.fetchById);
  const selectedSample = useSamplesStore((s) => s.selectedSample);
  const clearSelected = useSamplesStore((s) => s.clearSelected);

  const fetch = useCallback(() => {
    if (sampleId) fetchById(sampleId);
  }, [sampleId, fetchById]);

  useEffect(() => {
    fetch();
    return () => clearSelected();
  }, [fetch, clearSelected]);

  return { sample: selectedSample, refresh: fetch };
}
