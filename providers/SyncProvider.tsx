"use client";

import {
  createContext,
  useContext,
  useEffect,
  type ReactNode,
} from "react";
import { useSync } from "@/hooks/useSync";
import { useNetwork } from "@/hooks/useNetwork";
import type { SyncStatus } from "@/types";

interface SyncContextValue {
  status: SyncStatus;
  pendingCount: number;
  failedCount: number;
  lastSyncedAt: string | null;
  lastError: string | null;
  isEngineRunning: boolean;
  online: boolean;
  triggerSync: () => void;
  getClientId: () => string;
}

const SyncContext = createContext<SyncContextValue | null>(null);

export function SyncProvider({ children }: { children: ReactNode }) {
  const sync = useSync({ manageEngine: true });
  const { online } = useNetwork();
  const { pendingCount, triggerSync } = sync;

  useEffect(() => {
    if (online && pendingCount > 0) {
      triggerSync();
    }
  }, [online, pendingCount, triggerSync]);

  const value: SyncContextValue = {
    ...sync,
    online,
  };

  return (
    <SyncContext.Provider value={value}>{children}</SyncContext.Provider>
  );
}

export function useSyncContext(): SyncContextValue {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error("useSyncContext must be used within SyncProvider");
  }
  return context;
}
