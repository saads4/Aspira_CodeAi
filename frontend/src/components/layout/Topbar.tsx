'use client';
import { RefreshCw, ScanLine } from 'lucide-react';
import { useUIStore } from '@/store/slices/uiSlice';
import ConnectionBadge from '@/components/ui/ConnectionBadge';

interface TopbarProps {
  title: string;
  onRefresh?: () => void;
  refreshing?: boolean;
}

export default function Topbar({ title, onRefresh, refreshing }: TopbarProps) {
  const setScanOpen = useUIStore((s) => s.setScanDrawerOpen);

  return (
    <header className="topbar">
      <h1 className="topbar-title">{title}</h1>

      <div className="topbar-actions">
        <ConnectionBadge />

        {onRefresh && (
          <button
            className="btn btn-ghost btn-sm"
            onClick={onRefresh}
            disabled={refreshing}
            title="Refresh data"
          >
            <RefreshCw
              size={14}
              style={{ animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }}
            />
            Refresh
          </button>
        )}

        <button
          className="btn btn-primary btn-sm"
          onClick={() => setScanOpen(true)}
          id="scan-submit-btn"
        >
          <ScanLine size={14} />
          Scan
        </button>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </header>
  );
}
