'use client';
import { RefreshCw } from 'lucide-react';
import ConnectionBadge from '@/components/ui/ConnectionBadge';

interface TopbarProps {
  title: string;
  onRefresh?: () => void;
  refreshing?: boolean;
}

export default function Topbar({ title, onRefresh, refreshing }: TopbarProps) {
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
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </header>
  );
}
