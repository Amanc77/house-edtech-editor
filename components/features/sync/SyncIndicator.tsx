"use client";

import { motion } from "framer-motion";
import {
  AlertTriangle,
  Check,
  CloudOff,
  Loader2,
  RefreshCw,
  Wifi,
} from "lucide-react";
import type { SyncStatus } from "@/types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SyncIndicatorProps {
  status: SyncStatus;
  compact?: boolean;
  className?: string;
}

const statusConfig: Record<
  SyncStatus,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    variant: "default" | "secondary" | "success" | "warning" | "destructive" | "outline";
    animate?: boolean;
  }
> = {
  synced: { label: "Synced", icon: Check, variant: "success" },
  syncing: { label: "Syncing…", icon: Loader2, variant: "secondary", animate: true },
  pending: { label: "Pending", icon: RefreshCw, variant: "warning", animate: true },
  offline: { label: "Offline", icon: CloudOff, variant: "outline" },
  error: { label: "Sync error", icon: AlertTriangle, variant: "destructive" },
  conflict: { label: "Conflict", icon: AlertTriangle, variant: "destructive" },
};

export function SyncIndicator({
  status,
  compact = false,
  className,
}: SyncIndicatorProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  const badge = (
    <Badge
      variant={config.variant}
      className={cn("gap-1", compact && "px-1.5", className)}
    >
      <Icon
        className={cn(
          "h-3 w-3",
          config.animate && "animate-spin"
        )}
      />
      {!compact && config.label}
    </Badge>
  );

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{badge}</TooltipTrigger>
          <TooltipContent>{config.label}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <motion.div
      key={status}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.15 }}
    >
      {badge}
    </motion.div>
  );
}

interface ConnectionStatusProps {
  connected: boolean;
  latency?: number;
  className?: string;
}

export function ConnectionStatus({
  connected,
  latency,
  className,
}: ConnectionStatusProps) {
  return (
    <div className={cn("flex items-center gap-2 text-xs text-muted-foreground", className)}>
      <Wifi
        className={cn(
          "h-3.5 w-3.5",
          connected ? "text-emerald-500" : "text-muted-foreground"
        )}
      />
      <span>{connected ? "Connected" : "Disconnected"}</span>
      {connected && latency !== undefined && (
        <span className="text-muted-foreground/70">({latency}ms)</span>
      )}
    </div>
  );
}
