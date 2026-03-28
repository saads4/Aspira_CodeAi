'use client';
import type { UrgencyLevel } from '@/utils/helpers';

const CONFIG: Record<UrgencyLevel, { label: string; cls: string }> = {
  critical: { label: '🔴 Breach',   cls: 'badge badge-critical' },
  warning:  { label: '🟡 Warning',  cls: 'badge badge-warning'  },
  delayed:  { label: '🟠 Delayed',  cls: 'badge badge-delayed'  },
  normal:   { label: '🟢 Normal',   cls: 'badge badge-normal'   },
  error:    { label: '🔴 Error',    cls: 'badge badge-error'    },
};

export default function UrgencyBadge({ urgency }: { urgency: UrgencyLevel }) {
  const { label, cls } = CONFIG[urgency] ?? CONFIG.normal;
  return <span className={cls}>{label}</span>;
}
