'use client';
import { useUIStore } from '@/store/slices/uiSlice';

const LABEL: Record<string, string> = {
  connected:    'Live',
  disconnected: 'Offline',
  reconnecting: 'Reconnecting',
  polling:      'Polling',
};

export default function ConnectionBadge() {
  const status = useUIStore((s) => s.connectionStatus);
  return (
    <div className="conn-indicator" role="status" aria-label={`Connection: ${status}`}>
      <span className={`conn-dot ${status}`} />
      <span style={{ color: 'var(--text-secondary)' }}>{LABEL[status] ?? status}</span>
    </div>
  );
}
