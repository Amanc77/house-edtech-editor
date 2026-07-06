"use client";

import { useEffect, useCallback } from "react";
import { syncEngine } from "@/offline/sync-engine";
import { useSyncStore } from "@/stores/sync-store";

export function useSync(options?: { manageEngine?: boolean }) {
  const manageEngine = options?.manageEngine ?? false;
  const status = useSyncStore((s) => s.status);
  const pendingCount = useSyncStore((s) => s.pendingCount);
  const failedCount = useSyncStore((s) => s.failedCount);
  const lastSyncedAt = useSyncStore((s) => s.lastSyncedAt);
  const lastError = useSyncStore((s) => s.lastError);
  const isEngineRunning = useSyncStore((s) => s.isEngineRunning);

  const setStatus = useSyncStore((s) => s.setStatus);
  const setQueueCounts = useSyncStore((s) => s.setQueueCounts);
  const setLastSyncedAt = useSyncStore((s) => s.setLastSyncedAt);
  const setLastError = useSyncStore((s) => s.setLastError);
  const setEngineRunning = useSyncStore((s) => s.setEngineRunning);

  useEffect(() => {
    if (!manageEngine) return;

    syncEngine.start();
    setEngineRunning(true);

    const unsubscribe = syncEngine.subscribe((event) => {
      switch (event.type) {
        case "status":
          setStatus(event.status);
          break;
        case "synced":
          setLastSyncedAt(new Date().toISOString());
          setStatus("synced");
          break;
        case "error":
          setLastError(event.error);
          setStatus("error");
          break;
        case "queue":
          setQueueCounts(event.pending, event.failed);
          if (event.pending > 0) {
            setStatus("pending");
          }
          break;
      }
    });

    return () => {
      unsubscribe();
      syncEngine.stop();
      setEngineRunning(false);
    };
  }, [
    manageEngine,
    setStatus,
    setQueueCounts,
    setLastSyncedAt,
    setLastError,
    setEngineRunning,
  ]);

  const triggerSync = useCallback(() => {
    syncEngine.scheduleSync(0);
  }, []);

  const getClientId = useCallback(() => syncEngine.getClientId(), []);

  return {
    status,
    pendingCount,
    failedCount,
    lastSyncedAt,
    lastError,
    isEngineRunning,
    triggerSync,
    getClientId,
  };
}
