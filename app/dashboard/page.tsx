"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DocumentList } from "@/components/features/documents/DocumentList";
import { CreateDocumentDialog } from "@/components/features/documents/CreateDocumentDialog";
import { Button } from "@/components/ui/button";
import { useDocument } from "@/hooks/useDocument";
import { useNetwork } from "@/hooks/useNetwork";
import { useSyncStore } from "@/stores/sync-store";

export default function DashboardPage() {
  const { documents, loading, loadDocuments, deleteDocument } = useDocument();
  const { online } = useNetwork();
  const syncStatus = useSyncStore((s) => s.status);
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    void loadDocuments();
  }, [loadDocuments]);

  return (
    <DashboardLayout syncStatus={syncStatus} isOnline={online}>
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Documents</h1>
            <p className="text-muted-foreground">
              Your local-first workspace. Works offline.
            </p>
          </div>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            New document
          </Button>
        </div>

        <DocumentList
          documents={documents}
          loading={loading}
          onDelete={(id) => void deleteDocument(id)}
        />

        <CreateDocumentDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
        />
      </div>
    </DashboardLayout>
  );
}
