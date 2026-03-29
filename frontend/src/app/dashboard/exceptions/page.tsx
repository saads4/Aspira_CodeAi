'use client';
import { useEffect, useState, useCallback } from 'react';
import Topbar from '@/components/layout/Topbar';
import AlertList from '@/components/alerts/AlertList';
import { useAlertsStore } from '@/store/slices/alertsSlice';
import type { AlertType } from '@/types';

export default function ExceptionsPage() {
  const items       = useAlertsStore((s) => s.items);
  const summary     = useAlertsStore((s) => s.summary);
  const loading     = useAlertsStore((s) => s.loading);
  const fetch       = useAlertsStore((s) => s.fetch);
  const fetchSummary= useAlertsStore((s) => s.fetchSummary);
  const setFilters  = useAlertsStore((s) => s.setFilters);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetch();
    fetchSummary();
  }, [fetch, fetchSummary]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetch(), fetchSummary()]);
    setRefreshing(false);
  }, [fetch, fetchSummary]);

  const handleTypeFilter = (type: string) => {
    setFilters({ type: type as AlertType | '', page: 1 });
    fetch();
  };

  return (
    <div className="layout-main">
      <Topbar title="Exception Dashboard" onRefresh={handleRefresh} refreshing={refreshing} />
      <main className="page-content">
        {/* Alert type summary cards */}
        <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)', marginBottom: 24 }}>
          <div className="kpi-card critical">
            <div className="kpi-label">🚨 SLA Breach</div>
            <div className="kpi-value critical">{summary?.SLA_BREACH ?? 0}</div>
          </div>
          <div className="kpi-card warning">
            <div className="kpi-label">⚠️ Missed Batch</div>
            <div className="kpi-value warning">{summary?.MISSED_BATCH ?? 0}</div>
          </div>
          <div className="kpi-card delayed">
            <div className="kpi-label">🟠 Delay Escalation</div>
            <div className="kpi-value delayed">{summary?.DELAY_ESCALATION ?? 0}</div>
          </div>
          <div className="kpi-card normal">
            <div className="kpi-label">✅ Results Completed</div>
            <div className="kpi-value normal">{summary?.RESULT_COMPLETED ?? 0}</div>
          </div>
        </div>

        {/* Filter bar */}
        <div className="filter-bar" style={{ marginBottom: 16 }}>
          <label className="form-label">Filter:</label>
          {(['', 'SLA_BREACH', 'MISSED_BATCH', 'DELAY_ESCALATION', 'RESULT_COMPLETED'] as const).map((t) => (
            <button
              key={t}
              className="btn btn-ghost btn-sm"
              id={`alert-filter-${t || 'all'}`}
              onClick={() => handleTypeFilter(t)}
            >
              {t === '' ? 'All' : t.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        <div className="section-heading">
          <h2 className="section-title">Active Exceptions</h2>
          <span className="live-badge"><span className="live-dot" />Live</span>
        </div>

        <AlertList alerts={items} loading={loading} />
      </main>
    </div>
  );
}
