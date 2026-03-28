'use client';
import { useEffect, useState, useCallback } from 'react';
import Topbar from '@/components/layout/Topbar';
import BatchGrid from '@/components/batches/BatchGrid';
import { useBatchesStore } from '@/store/slices/batchesSlice';

export default function BatchesPage() {
  const items   = useBatchesStore((s) => s.items);
  const loading = useBatchesStore((s) => s.loading);
  const fetch   = useBatchesStore((s) => s.fetch);
  const setDate = useBatchesStore((s) => s.setDateFilter);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { fetch(); }, [fetch]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetch();
    setRefreshing(false);
  }, [fetch]);

  const totalSamples  = items.reduce((a, b) => a + b.total_samples, 0);
  const totalBreached = items.reduce((a, b) => a + b.breached_count, 0);
  const totalMissed   = items.reduce((a, b) => a + b.missed_count, 0);

  return (
    <div className="layout-main">
      <Topbar title="Batch Monitoring" onRefresh={handleRefresh} refreshing={refreshing} />
      <main className="page-content">
        {/* Summary row */}
        <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: 24 }}>
          <div className="kpi-card neutral">
            <div className="kpi-label">Total Batches</div>
            <div className="kpi-value">{items.length}</div>
          </div>
          <div className="kpi-card critical">
            <div className="kpi-label">Breached Samples</div>
            <div className="kpi-value critical">{totalBreached}</div>
          </div>
          <div className="kpi-card warning">
            <div className="kpi-label">Missed Batches</div>
            <div className="kpi-value warning">{totalMissed}</div>
          </div>
        </div>

        {/* Date filter */}
        <div className="filter-bar" style={{ marginBottom: 16 }}>
          <label className="form-label" htmlFor="batch-date-filter">Filter by date:</label>
          <input
            id="batch-date-filter"
            className="input"
            type="date"
            style={{ width: 180 }}
            onChange={(e) => {
              setDate(e.target.value);
              fetch(e.target.value);
            }}
          />
          <button className="btn btn-ghost btn-sm" onClick={() => { setDate(''); fetch(''); }}>
            Clear
          </button>
        </div>

        <div className="section-heading">
          <h2 className="section-title">Batch Queue</h2>
          <span className="text-xs text-muted">{items.length} batches ·&nbsp;{totalSamples.toLocaleString()} samples</span>
        </div>

        <BatchGrid batches={items} loading={loading} />
      </main>
    </div>
  );
}
