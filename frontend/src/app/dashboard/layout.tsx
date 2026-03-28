'use client';
import Sidebar from '@/components/layout/Sidebar';
import ScanDrawer from '@/components/scan/ScanDrawer';
import { useLiveData } from '@/hooks/useLiveData';
import { useUIStore } from '@/store/slices/uiSlice';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  useLiveData(); // Start all real-time pollers for the entire dashboard

  const scanOpen = useUIStore((s) => s.scanDrawerOpen);

  return (
    <div className="layout-root">
      <Sidebar />
      <div className="layout-main">
        {children}
      </div>
      {scanOpen && <ScanDrawer />}
    </div>
  );
}
