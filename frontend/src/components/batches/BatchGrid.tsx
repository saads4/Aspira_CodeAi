'use client';
import { Package, AlertTriangle, Clock, TrendingUp } from 'lucide-react';
import type { Batch } from '@/types';
import { fmtTime } from '@/utils/helpers';

interface Props {
  batches: Batch[];
  loading?: boolean;
}

function BatchCard({ batch }: { batch: Batch }) {
  const breachPct = batch.total_samples > 0
    ? Math.round((batch.breached_count / batch.total_samples) * 100) : 0;
  const isHighBreach = breachPct > 50;

  return (
    <div className="card card-elevated" style={{ borderRadius: 'var(--radius-md)', padding: 16 }}>
      {/* Header row */}
      <div className="flex justify-between items-center" style={{ marginBottom: 10 }}>
        <div className="flex items-center gap-2">
          <Package size={14} color="var(--brand-primary)" />
          <span className="mono text-sm font-700" style={{ color: 'var(--text-primary)', fontSize: '0.75rem' }}>
            {batch.batch_id}
          </span>
        </div>
        {isHighBreach && (
          <span className="badge badge-critical">High Risk</span>
        )}
      </div>

      {/* Times */}
      <div className="grid-2" style={{ fontSize: '0.72rem', marginBottom: 10, gap: 6 }}>
        <div>
          <div className="text-muted" style={{ marginBottom: 2 }}>Run Start</div>
          <div className="text-secondary">{fmtTime(batch.batch_run_start)}</div>
        </div>
        <div>
          <div className="text-muted" style={{ marginBottom: 2 }}>Cutoff</div>
          <div className="text-secondary">{fmtTime(batch.batch_cutoff)}</div>
        </div>
      </div>

      {/* Metrics row */}
      <div className="flex gap-4" style={{ marginBottom: 10, flexWrap: 'wrap' }}>
        <div className="flex items-center gap-1">
          <TrendingUp size={12} color="var(--text-muted)" />
          <span className="text-xs text-muted">Total:</span>
          <span className="text-sm font-700 text-primary">{batch.total_samples}</span>
        </div>
        <div className="flex items-center gap-1">
          <AlertTriangle size={12} color="var(--color-critical)" />
          <span className="text-xs text-muted">Breach:</span>
          <span className="text-sm font-700 text-critical">{batch.breached_count}</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock size={12} color="var(--color-delayed)" />
          <span className="text-xs text-muted">Missed:</span>
          <span className="text-sm font-700" style={{ color: 'var(--color-delayed)' }}>{batch.missed_count}</span>
        </div>
      </div>

      {/* Breach progress bar */}
      <div>
        <div className="flex justify-between text-xs text-muted" style={{ marginBottom: 4 }}>
          <span>Breach rate</span>
          <span style={{ color: isHighBreach ? 'var(--color-critical)' : 'var(--text-muted)' }}>
            {breachPct}%
          </span>
        </div>
        <div className="progress-bar-wrap">
          <div
            className={`progress-bar-fill ${isHighBreach ? 'critical' : 'normal'}`}
            style={{ width: `${breachPct}%` }}
          />
        </div>
      </div>

      {/* Avg overage */}
      {batch.avg_overage_minutes > 0 && (
        <div className="text-xs text-muted" style={{ marginTop: 8 }}>
          Avg overage: <span className="text-warning font-600">{batch.avg_overage_minutes}m</span>
        </div>
      )}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="card card-elevated" style={{ borderRadius: 'var(--radius-md)', padding: 16 }}>
      {[80, 60, 100, 30].map((w, i) => (
        <div key={i} className="skeleton" style={{ height: 14, width: w, borderRadius: 4, marginBottom: 10 }} />
      ))}
    </div>
  );
}

export default function BatchGrid({ batches, loading }: Props) {
  return (
    <div className="grid-3" style={{ alignItems: 'start' }}>
      {loading && batches.length === 0
        ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
        : batches.length === 0
        ? (
          <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
            <div className="empty-state-icon">📦</div>
            <div className="empty-state-title">No batches found</div>
          </div>
        )
        : batches.map((b) => <BatchCard key={b.batch_id} batch={b} />)
      }
    </div>
  );
}
