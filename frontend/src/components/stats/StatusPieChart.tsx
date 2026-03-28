'use client';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { Stats } from '@/types';

interface Props { stats: Stats | null; }

const COLORS = {
  assigned:     '#22c55e',
  delayed:      '#f97316',
  breached:     '#ef4444',
  pending:      '#64748b',
  error:        '#a855f7',
  missed_batch: '#f59e0b',
};

export default function StatusPieChart({ stats }: Props) {
  if (!stats) return null;
  const { counts } = stats;

  const data = [
    { name: 'Assigned',   value: counts.assigned,    fill: COLORS.assigned },
    { name: 'Delayed',    value: counts.delayed,      fill: COLORS.delayed },
    { name: 'Breached',   value: counts.breached,     fill: COLORS.breached },
    { name: 'Pending',    value: counts.pending,      fill: COLORS.pending },
    { name: 'Error',      value: counts.error,        fill: COLORS.error },
  ].filter((d) => d.value > 0);

  return (
    <div className="card" style={{ height: 260 }}>
      <div className="section-heading" style={{ marginBottom: 8 }}>
        <span className="section-title">Status Distribution</span>
        <span className="live-badge"><span className="live-dot" />Live</span>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={80}
            paddingAngle={3}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: 'var(--bg-overlay)',
              border: '1px solid var(--border-default)',
              borderRadius: 8,
              color: 'var(--text-primary)',
              fontSize: 12,
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: 11, color: 'var(--text-secondary)' }}
            iconType="circle"
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
