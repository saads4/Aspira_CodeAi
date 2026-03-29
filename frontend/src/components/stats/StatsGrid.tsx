'use client';
import type { Stats } from '@/types';
import { fmtOverage } from '@/utils/helpers';

interface Props {
  stats: Stats | null;
  loading?: boolean;
}

interface KpiDef {
  key: keyof Stats['counts'];
  label: string;
  variant: string;
  icon: string;
}

const KPI_DEFS: KpiDef[] = [
  { key: 'total',       label: 'Total Samples', variant: 'neutral',  icon: '🧪' },
  { key: 'pending',     label: 'Pending',       variant: 'neutral',  icon: '⏳' },
  { key: 'assigned',    label: 'Assigned',      variant: 'normal',   icon: '✅' },
  { key: 'delayed',     label: 'Delayed',       variant: 'delayed',  icon: '🟠' },
  { key: 'breached',    label: 'SLA Breach',    variant: 'critical', icon: '🚨' },
  { key: 'missed_batch',label: 'Missed Batch',  variant: 'warning',  icon: '⚠️'  },
  { key: 'completed',   label: 'Completed',     variant: 'normal',   icon: '✅' },
  { key: 'error',       label: 'Errors',        variant: 'neutral',  icon: '🔴' },
];

function KpiCard({ def, value, loading }: { def: KpiDef; value: number; loading?: boolean }) {
  return (
    <div className={`kpi-card ${def.variant}`}>
      <div className="kpi-icon" style={{
        background: def.variant === 'critical' ? 'rgba(239,68,68,0.12)' :
                    def.variant === 'warning'  ? 'rgba(245,158,11,0.12)' :
                    def.variant === 'delayed'  ? 'rgba(249,115,22,0.12)' :
                    def.variant === 'normal'   ? 'rgba(34,197,94,0.12)' :
                    'rgba(255,255,255,0.06)',
      }}>
        {def.icon}
      </div>
      <div className="kpi-label">{def.label}</div>
      {loading ? (
        <div className="skeleton" style={{ height: 32, width: 60, borderRadius: 6, marginTop: 4 }} />
      ) : (
        <div className={`kpi-value ${def.variant}`} style={{ animation: 'countUp 0.4s ease-out' }}>
          {value.toLocaleString()}
        </div>
      )}
    </div>
  );
}

export default function StatsGrid({ stats, loading }: Props) {
  return (
    <div className="kpi-grid">
      {KPI_DEFS.map((def) => (
        <KpiCard
          key={def.key}
          def={def}
          value={stats?.counts[def.key] ?? 0}
          loading={loading && !stats}
        />
      ))}
    </div>
  );
}
