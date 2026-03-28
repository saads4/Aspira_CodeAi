'use client';
import type { SampleStatus } from '@/types';

const MAP: Record<SampleStatus, { label: string; cls: string }> = {
  pending:    { label: 'Pending',    cls: 'badge badge-neutral'  },
  processing: { label: 'Processing', cls: 'badge badge-info'     },
  assigned:   { label: 'Assigned',   cls: 'badge badge-normal'   },
  delayed:    { label: 'Delayed',    cls: 'badge badge-delayed'  },
  error:      { label: 'Error',      cls: 'badge badge-error'    },
};

export default function StatusBadge({ status }: { status: SampleStatus | string }) {
  const cfg = MAP[status as SampleStatus] ?? { label: status, cls: 'badge badge-neutral' };
  return <span className={cfg.cls}>{cfg.label}</span>;
}
