// ─── useLiveData — Master Real-Time Sync Hook ────────────────────────────────
'use client';

import { useEffect, useRef } from 'react';
import { SmartPoller } from '@/services/poller';
import { statsService, samplesService, alertsService } from '@/services/api';
import { useStatsStore } from '@/store/slices/statsSlice';
import { useSamplesStore } from '@/store/slices/samplesSlice';
import { useAlertsStore } from '@/store/slices/alertsSlice';
import { useUIStore } from '@/store/slices/uiSlice';
import type { Stats, Sample, Alert, PaginatedResponse, SingleResponse } from '@/types';

interface Stoppable { stop(): void; }

const STATS_INTERVAL   = 4_000;  // Stats: fast — drives KPI cards
const SAMPLES_INTERVAL = 6_000;  // Samples: moderate — main list
const ALERTS_INTERVAL  = 8_000;  // Alerts: slowest — not time-critical

export function useLiveData(): void {
  const setConnectionStatus = useUIStore((s) => s.setConnectionStatus);
  const setStatsData = useStatsStore((s) => s.setData);
  const applyUpdate = useSamplesStore((s) => s.applyRealTimeUpdate);
  const applyInsert = useSamplesStore((s) => s.applyRealTimeInsert);
  const prependAlert = useAlertsStore((s) => s.prependAlert);
  const setSummary = useAlertsStore((s) => s.setSummary);
  const samplesFilters = useSamplesStore((s) => s.filters);

  // Track last known sample IDs to detect new inserts vs updates
  const knownSampleIds = useRef<Set<string>>(new Set());
  // Track current state of each sample to detect status changes
  const knownSampleStatuses = useRef<Map<string, string>>(new Map());
  // Track last alerts ID set to detect new alerts
  const knownAlertIds = useRef<Set<string>>(new Set());

  const pollers = useRef<Stoppable[]>([]);

  useEffect(() => {
    // ── Stats poller ──────────────────────────────────────────────────────
    const statsPoller = new SmartPoller<SingleResponse<Stats>>({
      interval: STATS_INTERVAL,
      fetcher: () => statsService.get(),
      onData: (res) => {
        // Add null safety check
        if (!res || !res.data) {
          console.error('STATS POLLER: Invalid stats response', res);
          return;
        }
        console.log('STATS POLLER: Received stats data:', res.data);
        setStatsData(res.data);
      },
      onStatusChange: setConnectionStatus,
    });

    // ── Samples poller ────────────────────────────────────────────────────
    const samplesPoller = new SmartPoller<PaginatedResponse<Sample>>({
      interval: SAMPLES_INTERVAL,
      fetcher: () => samplesService.list(samplesFilters),
      onData: (res) => {
        // Add null safety check
        if (!res || !res.data) {
          console.error('SAMPLES POLLER: Invalid samples response', res);
          return;
        }
        console.log('SAMPLES POLLER: Received samples:', res.data.length, 'samples');
        const isFirstRun = knownSampleIds.current.size === 0;
        
        for (const sample of res.data) {
          const sampleKey = `${sample.sample_id}:${sample.test_name}`;
          const previousStatus = knownSampleStatuses.current.get(sampleKey);
          
          if (knownSampleIds.current.has(sample.sample_id)) {
            // Known sample - check if status changed
            if (previousStatus !== sample.status) {
              console.log(`SAMPLES POLLER: Status changed for ${sample.sample_id}: ${previousStatus} → ${sample.status}`);
              // Status changed (e.g., pending → completed)
              applyUpdate(sample);
              knownSampleStatuses.current.set(sampleKey, sample.status);
            }
          } else {
            // New sample - add to tracking
            knownSampleIds.current.add(sample.sample_id);
            knownSampleStatuses.current.set(sampleKey, sample.status);
            
            // Only apply as insert on first run, otherwise it's a new sample
            if (!isFirstRun) {
              console.log(`SAMPLES POLLER: New sample: ${sample.sample_id} with status ${sample.status}`);
              applyInsert(sample);
            }
          }
        }
        
        // On first run, we don't need to apply inserts since the data is already in the store
      },
    });

    // ── Alerts poller ─────────────────────────────────────────────────────
    const alertsPoller = new SmartPoller<PaginatedResponse<Alert>>({
      interval: ALERTS_INTERVAL,
      fetcher: () => alertsService.list({ limit: 20, page: 1 }),
      onData: (res) => {
        // Add null safety check
        if (!res || !res.data) {
          console.error('ALERTS POLLER: Invalid alerts response', res);
          return;
        }
        for (const alert of res.data) {
          if (!knownAlertIds.current.has(alert._id)) {
            knownAlertIds.current.add(alert._id);
            prependAlert(alert);
          }
        }
      },
    });

    // Stagger starts to avoid thundering herd on mount
    statsPoller.start();
    setTimeout(() => samplesPoller.start(), 1_500);
    setTimeout(() => alertsPoller.start(), 3_000);

    pollers.current = [statsPoller as Stoppable, samplesPoller as Stoppable, alertsPoller as Stoppable];

    return () => {
      pollers.current.forEach((p) => p.stop());
      pollers.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally only on mount — pollers manage their own lifecycle
}
