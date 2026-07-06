"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Search } from "lucide-react";
import type { DocumentMeta, SyncStatus } from "@/types";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { DocumentCard } from "@/components/features/documents/DocumentCard";
import { ShareDocumentDialog } from "@/components/features/documents/ShareDocumentDialog";

interface DocumentListProps {
  documents: DocumentMeta[];
  loading?: boolean;
  syncStatuses?: Record<string, SyncStatus>;
  starredIds?: Set<string>;
  onStar?: (id: string) => void;
  onDelete?: (id: string) => void;
  emptyMessage?: string;
}

export function DocumentList({
  documents,
  loading = false,
  syncStatuses = {},
  starredIds = new Set(),
  onStar,
  onDelete,
  emptyMessage = "No documents yet. Create your first document to get started.",
}: DocumentListProps) {
  const [search, setSearch] = useState("");
  const [shareDocId, setShareDocId] = useState<string | null>(null);

  const filtered = documents.filter((doc) =>
    doc.title.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-40 rounded-xl" />
        ))}
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-16 text-center"
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
          <FileText className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground max-w-sm">{emptyMessage}</p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search documents..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          No documents match &quot;{search}&quot;
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((doc, index) => (
            <motion.div
              key={doc.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <DocumentCard
                document={doc}
                syncStatus={syncStatuses[doc.id] ?? "synced"}
                starred={starredIds.has(doc.id)}
                onStar={onStar}
                onDelete={onDelete}
                onShare={setShareDocId}
              />
            </motion.div>
          ))}
        </div>
      )}

      {shareDocId && (
        <ShareDocumentDialog
          documentId={shareDocId}
          open={!!shareDocId}
          onOpenChange={(open) => !open && setShareDocId(null)}
        />
      )}
    </div>
  );
}
