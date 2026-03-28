'use client';
import { useState, useEffect, useCallback } from 'react';
import Topbar from '@/components/layout/Topbar';
import StatsGrid from '@/components/stats/StatsGrid';
import StatusPieChart from '@/components/stats/StatusPieChart';
import SampleTable from '@/components/samples/SampleTable';
import SampleDetailDrawer from '@/components/samples/SampleDetailDrawer';
import { useStatsStore } from '@/store/slices/statsSlice';
import { useSamplesStore } from '@/store/slices/samplesSlice';
import type { Sample, SampleStatus } from '@/types';

export default function DashboardPage() {
  const stats        = useStatsStore((s) => s.data);
  const statsLoading = useStatsStore((s) => s.loading);
  const fetchStats   = useStatsStore((s) => s.fetch);

  const samples        = useSamplesStore((s) => s.items);
  const samplesLoading = useSamplesStore((s) => s.loading);
  const fetchSamples   = useSamplesStore((s) => s.fetch);
  const setFilters     = useSamplesStore((s) => s.setFilters);
  const filters        = useSamplesStore((s) => s.filters);
  const total          = useSamplesStore((s) => s.total);

  const [selected, setSelected] = useState<Sample | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Initial load
  useEffect(() => {
    fetchStats();
    fetchSamples();
  }, [fetchStats, fetchSamples]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchStats(), fetchSamples()]);
    setRefreshing(false);
  }, [fetchStats, fetchSamples]);

  const handleFilterChange = (key: string, value: string) => {
    if (key === 'status') setFilters({ status: value as SampleStatus | '' });
    if (key === 'breach') setFilters({ breach: value === 'true' ? true : value === 'false' ? false : null });
    if (key === 'missed') setFilters({ missed: value === 'true' ? true : null });
    if (key === 'test_name') setFilters({ test_name: value });
    fetchSamples();
  };

  return (
    <div className="layout-main">
      <Topbar
        title="Live Pipeline"
        onRefresh={handleRefresh}
        refreshing={refreshing}
      />
      <main className="page-content">
        {/* KPI Grid */}
        <section aria-label="Key metrics" style={{ marginBottom: 24 }}>
          <StatsGrid stats={stats} loading={statsLoading} />
        </section>

        {/* Charts + Recent Alerts row */}
        <section style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16, marginBottom: 24 }}>
          <StatusPieChart stats={stats} />

          {/* Recent Breaches */}
          <div className="card" style={{ padding: 16 }}>
            <div className="section-heading" style={{ marginBottom: 10 }}>
              <span className="section-title">Recent Breaches</span>
              <span className="badge badge-critical">{stats?.counts.breached ?? 0}</span>
            </div>
            {(stats?.recent_breaches ?? []).length === 0 ? (
              <div className="empty-state" style={{ padding: '20px 0' }}>
                <div className="text-xs text-muted">No active breaches 🎉</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(stats?.recent_breaches ?? []).map((b) => (
                  <div key={b.sample_id + b.updated_at}
                    className="flex justify-between items-center"
                    style={{ padding: '6px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                    <div>
                      <div className="mono text-xs font-700 text-primary">{b.sample_id}</div>
                      <div className="text-xs text-muted">{b.test_name}</div>
                    </div>
                    <span className="text-sm font-700 text-critical">
                      +{b.overage_minutes}m
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Sample Table */}
        <section aria-label="Sample pipeline">
          <div className="section-heading">
            <div>
              <h2 className="section-title">Sample Pipeline</h2>
              <div className="section-subtitle">{total.toLocaleString()} samples · click row for details</div>
            </div>
            <div className="live-badge"><span className="live-dot" />Live</div>
          </div>

          {/* Filter Bar */}
          <div className="filter-bar">
            <input
              className="input"
              placeholder="Search test name…"
              style={{ maxWidth: 200 }}
              onChange={(e) => handleFilterChange('test_name', e.target.value)}
              id="filter-test-name"
            />
            <select
              className="select"
              defaultValue=""
              onChange={(e) => handleFilterChange('status', e.target.value)}
              id="filter-status"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="assigned">Assigned</option>
              <option value="delayed">Delayed</option>
              <option value="error">Error</option>
            </select>
            <select
              className="select"
              defaultValue=""
              onChange={(e) => handleFilterChange('breach', e.target.value)}
              id="filter-breach"
            >
              <option value="">All Breach</option>
              <option value="true">Breached</option>
              <option value="false">Not Breached</option>
            </select>
            <select
              className="select"
              defaultValue=""
              onChange={(e) => handleFilterChange('missed', e.target.value)}
              id="filter-missed"
            >
              <option value="">All Batches</option>
              <option value="true">Missed Batch</option>
            </select>
          </div>

          <SampleTable
            samples={samples}
            onSelect={setSelected}
            loading={samplesLoading}
          />
        </section>
      </main>

      {selected && (
        <SampleDetailDrawer
          sample={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
