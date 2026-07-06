import { create } from "zustand";
import type { SyncStatus } from "@/types";

interface SyncState {
  status: SyncStatus;
  pendingCount: number;
  failedCount: number;
  lastSyncedAt: string | null;
  lastError: string | null;
  isEngineRunning: boolean;
  setStatus: (status: SyncStatus) => void;
  setQueueCounts: (pending: number, failed: number) => void;
  setLastSyncedAt: (timestamp: string) => void;
  setLastError: (error: string | null) => void;
  setEngineRunning: (running: boolean) => void;
  reset: () => void;
}

const initialState = {
  status: "synced" as SyncStatus,
  pendingCount: 0,
  failedCount: 0,
  lastSyncedAt: null as string | null,
  lastError: null as string | null,
  isEngineRunning: false,
};

export const useSyncStore = create<SyncState>((set) => ({
  ...initialState,
  setStatus: (status) => set({ status }),
  setQueueCounts: (pendingCount, failedCount) =>
    set({ pendingCount, failedCount }),
  setLastSyncedAt: (lastSyncedAt) => set({ lastSyncedAt, lastError: null }),
  setLastError: (lastError) => set({ lastError }),
  setEngineRunning: (isEngineRunning) => set({ isEngineRunning }),
  reset: () => set(initialState),
}));
