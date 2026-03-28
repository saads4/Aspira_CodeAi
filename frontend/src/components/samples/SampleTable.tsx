'use client';
import { memo } from 'react';
import type { Sample } from '@/types';
import { getSampleUrgency, fmtTime, fmtRelative, fmtOverage } from '@/utils/helpers';
import UrgencyBadge from '@/components/ui/UrgencyBadge';
import StatusBadge from '@/components/ui/StatusBadge';

interface Props {
  samples: Sample[];
  onSelect: (s: Sample) => void;
  loading?: boolean;
}

function SampleRow({ sample, onSelect }: { sample: Sample; onSelect: (s: Sample) => void }) {
  const urgency = getSampleUrgency(sample);
  return (
    <tr
      className={`row-${urgency}`}
      onClick={() => onSelect(sample)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onSelect(sample)}
    >
      <td>
        <div className="mono" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
          {sample.sample_id}
        </div>
        {sample.test_id && (
          <div className="text-xs text-muted">{sample.test_id}</div>
        )}
      </td>
      <td>
        <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
          {sample.test_name}
        </div>
        {sample.test_code && (
          <div className="text-xs text-muted mono">{sample.test_code}</div>
        )}
      </td>
      <td><StatusBadge status={sample.status} /></td>
      <td>
        <div className="text-sm">{fmtTime(sample.eta)}</div>
        {sample.missed_batch && (
          <div className="text-xs" style={{ color: 'var(--color-delayed)', marginTop: 2 }}>
            Missed batch
          </div>
        )}
      </td>
      <td>
        <div className="text-sm">{fmtTime(sample.sla_deadline)}</div>
      </td>
      <td>
        {sample.breach_flag ? (
          <span className="text-critical text-sm font-600">
            +{fmtOverage(sample.overage_minutes)}
          </span>
        ) : (
          <span className="text-muted text-sm">—</span>
        )}
      </td>
      <td>
        <UrgencyBadge urgency={urgency} />
      </td>
      <td>
        <div className="text-xs text-muted">{fmtRelative(sample.updated_at)}</div>
      </td>
    </tr>
  );
}

const MemoSampleRow = memo(SampleRow, (prev, next) =>
  prev.sample.updated_at === next.sample.updated_at &&
  prev.sample.status === next.sample.status,
);

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <tr key={i}>
          {Array.from({ length: 8 }).map((_, j) => (
            <td key={j}>
              <div className="skeleton" style={{ height: 16, borderRadius: 4, width: j === 0 ? 120 : 80 }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export default function SampleTable({ samples, onSelect, loading }: Props) {
  return (
    <div className="data-table-wrap">
      <table className="data-table" role="grid" aria-label="Samples table">
        <thead>
          <tr>
            <th>Sample ID</th>
            <th>Test</th>
            <th>Status</th>
            <th>ETA</th>
            <th>SLA Deadline</th>
            <th>Overage</th>
            <th>Priority</th>
            <th>Updated</th>
          </tr>
        </thead>
        <tbody>
          {loading && samples.length === 0 ? (
            <SkeletonRows />
          ) : samples.length === 0 ? (
            <tr>
              <td colSpan={8}>
                <div className="empty-state">
                  <div className="empty-state-icon">🧪</div>
                  <div className="empty-state-title">No samples found</div>
                  <div className="empty-state-sub">Adjust filters or submit a new sample via SAP webhook</div>
                </div>
              </td>
            </tr>
          ) : (
            samples.map((s) => (
              <MemoSampleRow key={s.sample_id + s.test_name} sample={s} onSelect={onSelect} />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
