'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Activity, LayoutDashboard, AlertTriangle, Package,
  ScanLine, ChevronLeft, ChevronRight, CheckCircle,
} from 'lucide-react';
import { useUIStore } from '@/store/slices/uiSlice';
import { useAlertsStore } from '@/store/slices/alertsSlice';

const NAV = [
  { href: '/dashboard',            icon: LayoutDashboard, label: 'Live Pipeline' },
  { href: '/dashboard/batches',    icon: Package,         label: 'Batches' },
  { href: '/dashboard/exceptions', icon: AlertTriangle,   label: 'Exceptions', badge: true },
  { href: '/dashboard/scan',       icon: ScanLine,        label: 'Scan / Submit' },
  { href: '/dashboard/result',     icon: CheckCircle,     label: 'Complete / Result Entry' },
];

export default function Sidebar() {
  const pathname    = usePathname();
  const open        = useUIStore((s) => s.sidebarOpen);
  const toggle      = useUIStore((s) => s.toggleSidebar);
  const alertItems  = useAlertsStore((s) => s.items);
  const unacked     = alertItems.filter((a) => !a.acknowledged).length;

  return (
    <aside className={`sidebar ${open ? '' : 'collapsed'}`}>
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">A</div>
        {open && (
          <div>
            <div className="sidebar-logo-text">Aspira TAT</div>
            <div className="sidebar-logo-sub">Monitor v3.0</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {NAV.map(({ href, icon: Icon, label, badge }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
          return (
            <Link key={href} href={href} className={`nav-item ${active ? 'active' : ''}`}>
              <Icon className="nav-item-icon" size={18} />
              {open && <span className="nav-item-label">{label}</span>}
              {open && badge && unacked > 0 && (
                <span className="nav-badge">{unacked > 99 ? '99+' : unacked}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Live indicator */}
      {open && (
        <div className="sidebar-footer">
          <div className="flex items-center gap-2" style={{ padding: '4px 10px' }}>
            <Activity size={14} color="var(--color-normal)" />
            <span className="text-xs" style={{ color: 'var(--color-normal)', fontWeight: 600 }}>
              Live Monitoring
            </span>
          </div>
        </div>
      )}

      {/* Collapse button */}
      <button
        onClick={toggle}
        className="btn btn-ghost btn-icon"
        style={{
          position: 'absolute', bottom: 64, right: 8,
          width: 28, height: 28, padding: 4,
          borderRadius: '50%',
        }}
        title={open ? 'Collapse sidebar' : 'Expand sidebar'}
      >
        {open ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
      </button>
    </aside>
  );
}
