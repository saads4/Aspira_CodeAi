'use client';
import { AlertTriangle, Clock, Zap } from 'lucide-react';
import type { Alert } from '@/types';
import { fmtRelative, fmtTime, fmtOverage } from '@/utils/helpers';

const TYPE_CONFIG = {
  MISSED_BATCH:      { icon: '⚠️',  cls: 'badge-warning',  label: 'Missed Batch',      color: 'var(--color-warning)' },
  SLA_BREACH:        { icon: '🚨',  cls: 'badge-critical', label: 'SLA Breach',         color: 'var(--color-critical)' },
  DELAY_ESCALATION:  { icon: '🟠',  cls: 'badge-delayed',  label: 'Delay Escalation',   color: 'var(--color-delayed)' },
};

interface Props {
  alerts: Alert[];
  loading?: boolean;
}

function AlertRow({ alert }: { alert: Alert }) {
  const cfg = TYPE_CONFIG[alert.type] ?? TYPE_CONFIG.SLA_BREACH;

  return (
    <div
      className="card card-elevated"
      style={{
        padding: '14px 16px',
        borderLeft: `3px solid ${cfg.color}`,
        borderRadius: 'var(--radius-md)',
        animation: 'slideDown 0.25s ease-out',
      }}
    >
      <div className="flex justify-between items-center" style={{ marginBottom: 8 }}>
        <div className="flex items-center gap-2">
          <span>{cfg.icon}</span>
          <span className={`badge ${cfg.cls}`}>{cfg.label}</span>
          <span className="mono text-xs" style={{ color: 'var(--text-muted)' }}>
            {alert.sample_id}
          </span>
        </div>
        <span className="text-xs text-muted">{fmtRelative(alert.created_at)}</span>
      </div>

      <div className="grid-2" style={{ gap: 10 }}>
        <div>
          <div className="text-xs text-muted" style={{ marginBottom: 2 }}>Test</div>
          <div className="text-sm font-600 text-primary">{alert.test_name}</div>
        </div>
        {alert.alert_data?.overage_minutes > 0 && (
          <div>
            <div className="text-xs text-muted" style={{ marginBottom: 2 }}>Overage</div>
            <div className="text-sm font-600 text-critical">
              +{fmtOverage(alert.alert_data.overage_minutes)}
            </div>
          </div>
        )}
        {alert.alert_data?.eta && (
          <div>
            <div className="text-xs text-muted" style={{ marginBottom: 2 }}>ETA</div>
            <div className="text-sm text-secondary">{alert.alert_data.eta}</div>
          </div>
        )}
        {alert.alert_data?.reason && (
          <div style={{ gridColumn: '1/-1' }}>
            <div className="text-xs text-muted" style={{ marginBottom: 2 }}>Reason</div>
            <div className="text-sm text-secondary" style={{ fontStyle: 'italic' }}>
              {alert.alert_data.reason}
            </div>
          </div>
        )}
      </div>

      {alert.alert_data?.recommended_action && (
        <div className="flex items-center gap-2" style={{ marginTop: 10, padding: '6px 10px', background: 'rgba(59,130,246,0.06)', borderRadius: 'var(--radius-sm)' }}>
          <Zap size={12} color="var(--brand-primary)" />
          <span className="text-xs" style={{ color: 'var(--brand-primary)' }}>
            {alert.alert_data.recommended_action}
          </span>
        </div>
      )}
    </div>
  );
}

function SkeletonAlert() {
  return (
    <div className="card card-elevated" style={{ padding: '14px 16px', borderRadius: 'var(--radius-md)' }}>
      {[100, 60, 80].map((w, i) => (
        <div key={i} className="skeleton" style={{ height: 14, width: w, marginBottom: 8, borderRadius: 4 }} />
      ))}
    </div>
  );
}

export default function AlertList({ alerts, loading }: Props) {
  if (loading && alerts.length === 0) {
    return (
      <div className="flex-col gap-3" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {Array.from({ length: 4 }).map((_, i) => <SkeletonAlert key={i} />)}
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">🎉</div>
        <div className="empty-state-title">No active alerts</div>
        <div className="empty-state-sub">All samples are within SLA</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {alerts.map((a) => (
        <AlertRow key={a._id} alert={a} />
      ))}
    </div>
  );
}
