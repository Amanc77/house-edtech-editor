"use client";

import { useEffect, useState, useCallback } from "react";
import {
  isOnline,
  networkMonitor,
  onNetworkChange,
} from "@/offline/network";

export interface NetworkStatus {
  online: boolean;
  checking: boolean;
  lastCheckedAt: number | null;
}

export function useNetwork(): NetworkStatus & {
  checkConnectivity: () => Promise<boolean>;
} {
  const [online, setOnline] = useState(() => isOnline());
  const [checking, setChecking] = useState(false);
  const [lastCheckedAt, setLastCheckedAt] = useState<number | null>(null);

  const checkConnectivity = useCallback(async () => {
    setChecking(true);
    try {
      const result = await networkMonitor.checkConnectivity();
      setOnline(result);
      setLastCheckedAt(Date.now());
      return result;
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    return onNetworkChange(setOnline);
  }, []);

  return { online, checking, lastCheckedAt, checkConnectivity };
}
