"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CloudOff, RefreshCw, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OfflineBannerProps {
  onRetry?: () => void;
  pendingChanges?: number;
}

export function OfflineBanner({ onRetry, pendingChanges = 0 }: OfflineBannerProps) {
  const [isOnline, setIsOnline] = useState(
    () => typeof window !== "undefined" && navigator.onLine
  );
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    function handleOnline() {
      setIsOnline(true);
      setWasOffline(true);
      setTimeout(() => setWasOffline(false), 3000);
    }

    function handleOffline() {
      setIsOnline(false);
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="overflow-hidden"
        >
          <div className="flex items-center justify-between gap-4 bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-sm text-amber-700 dark:text-amber-400">
            <div className="flex items-center gap-2">
              <WifiOff className="h-4 w-4 shrink-0" />
              <span>
                You&apos;re offline.
                {pendingChanges > 0 &&
                  ` ${pendingChanges} change${pendingChanges > 1 ? "s" : ""} will sync when reconnected.`}
              </span>
            </div>
            {onRetry && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="shrink-0 border-amber-500/30"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Retry
              </Button>
            )}
          </div>
        </motion.div>
      )}
      {isOnline && wasOffline && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="overflow-hidden"
        >
          <div className="flex items-center gap-2 bg-emerald-500/10 border-b border-emerald-500/20 px-4 py-2 text-sm text-emerald-700 dark:text-emerald-400">
            <CloudOff className="h-4 w-4" />
            Back online — syncing changes…
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
