"use client";

import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";
import { Clock, History, Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import type { DocumentVersion } from "@/types";
import { apiPath, parseJsonResponse } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface VersionHistoryPanelProps {
  documentId: string;
  currentVersion?: number;
  onRestore?: (version: DocumentVersion, restoredContent?: string) => void;
  onCompare?: (version: DocumentVersion) => void;
  className?: string;
}

export function VersionHistoryPanel({
  documentId,
  currentVersion,
  onRestore,
  onCompare,
  className,
}: VersionHistoryPanelProps) {
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState<string | null>(null);

  useEffect(() => {
    async function loadVersions() {
      setLoading(true);
      try {
        const res = await fetch(apiPath(`/api/versions/${documentId}`));
        const json = await parseJsonResponse<{ items?: DocumentVersion[] } | DocumentVersion[]>(res);
        if (res.ok && json.data) {
          const items = Array.isArray(json.data) ? json.data : (json.data.items ?? []);
          setVersions(items);
        }
      } catch {
        toast.error("Failed to load version history");
      } finally {
        setLoading(false);
      }
    }

    loadVersions();
  }, [documentId]);

  async function handleRestore(version: DocumentVersion) {
    setRestoring(version.id);
    try {
      const res = await fetch(apiPath(`/api/versions/${documentId}/restore`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ versionId: version.id }),
      });
      const json = await parseJsonResponse<{ document?: { content?: string } }>(res);

      if (!res.ok) {
        throw new Error(json.error ?? "Failed to restore version");
      }

      toast.success(`Restored to version ${version.versionNumber}`);
      onRestore?.(version, json.data?.document?.content);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Restore failed");
    } finally {
      setRestoring(null);
    }
  }

  return (
    <div className={cn("flex flex-col h-full", className)}>
      <div className="flex items-center gap-2 p-4 border-b">
        <History className="h-4 w-4 text-muted-foreground" />
        <h3 className="font-semibold text-sm">Version History</h3>
        {currentVersion !== undefined && (
          <Badge variant="secondary" className="ml-auto text-xs">
            Current: v{currentVersion}
          </Badge>
        )}
      </div>

      {loading ? (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : versions.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
          <Clock className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">No versions saved yet</p>
        </div>
      ) : (
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {versions.map((version, index) => (
              <motion.div
                key={version.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
                className="rounded-lg border p-3 hover:bg-accent/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {version.label ?? `Version ${version.versionNumber}`}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatDistanceToNow(new Date(version.createdAt), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                  <Badge variant="outline" className="shrink-0 text-xs">
                    v{version.versionNumber}
                  </Badge>
                </div>
                <Separator className="my-2" />
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => onCompare?.(version)}
                  >
                    Compare
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => handleRestore(version)}
                    disabled={restoring === version.id}
                  >
                    {restoring === version.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <RotateCcw className="h-3 w-3" />
                    )}
                    Restore
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
