'use client';
import Sidebar from '@/components/layout/Sidebar';
import ScanDrawer from '@/components/scan/ScanDrawer';
import ResultDrawer from '@/components/result/ResultDrawer';
import { useLiveData } from '@/hooks/useLiveData';
import { useUIStore } from '@/store/slices/uiSlice';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  useLiveData(); // Start all real-time pollers for the entire dashboard

  const scanOpen = useUIStore((s) => s.scanDrawerOpen);
  const resultOpen = useUIStore((s) => s.resultDrawerOpen);

  return (
    <div className="layout-root">
      <Sidebar />
      <div className="layout-main">
        {children}
      </div>
      {scanOpen && <ScanDrawer />}
      {resultOpen && <ResultDrawer />}
    </div>
  );
}
