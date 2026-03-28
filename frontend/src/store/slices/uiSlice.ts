// ─── UI Slice ────────────────────────────────────────────────────────────────
import { create } from 'zustand';
import type { ConnectionStatus } from '@/types';

interface UIState {
  sidebarOpen: boolean;
  connectionStatus: ConnectionStatus;
  activeSampleId: string | null;
  scanDrawerOpen: boolean;

  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setConnectionStatus: (s: ConnectionStatus) => void;
  setActiveSampleId: (id: string | null) => void;
  setScanDrawerOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  connectionStatus: 'disconnected',
  activeSampleId: null,
  scanDrawerOpen: false,

  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setConnectionStatus: (connectionStatus) => set({ connectionStatus }),
  setActiveSampleId: (activeSampleId) => set({ activeSampleId }),
  setScanDrawerOpen: (scanDrawerOpen) => set({ scanDrawerOpen }),
}));
