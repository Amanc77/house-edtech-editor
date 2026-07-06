"use client";

import { useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { AlertCircle, Loader2 } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DocumentEditor } from "@/components/features/editor/DocumentEditor";
import { Button } from "@/components/ui/button";
import { useDocument } from "@/hooks/useDocument";
import { useNetwork } from "@/hooks/useNetwork";
import { useSyncContext } from "@/providers/SyncProvider";
import { SocketProvider, useSocketContext } from "@/providers/SocketProvider";
import { isSocketEnabled } from "@/lib/socket";
import { usePresenceStore } from "@/stores/presence-store";
import { useSyncStore } from "@/stores/sync-store";

function EditorPageContent({ documentId }: { documentId: string }) {
  const router = useRouter();
  const { document, loading, error, updateDocument } = useDocument(documentId);
  const { online } = useNetwork();
  const syncStatus = useSyncStore((s) => s.status);
  const { triggerSync } = useSyncContext();
  const { connected } = useSocketContext();
  const presenceUsersMap = usePresenceStore((s) => s.users);
  const localUserId = usePresenceStore((s) => s.localUserId);
  const presenceUsers = useMemo(
    () =>
      Object.values(presenceUsersMap).filter(
        (user) => user.userId !== localUserId
      ),
    [presenceUsersMap, localUserId]
  );

  useEffect(() => {
    if (documentId && online) {
      void triggerSync();
    }
  }, [documentId, online, triggerSync]);

  useEffect(() => {
    if (document && document.id !== documentId) {
      router.replace(`/documents/${document.id}`);
    }
  }, [document, documentId, router]);

  const handleSave = useCallback(
    async (content: string, title: string) => {
      if (!documentId) return;
      const updated = await updateDocument(documentId, { content, title });
      if (updated.id !== documentId) {
        router.replace(`/documents/${updated.id}`);
      }
      if (online) void triggerSync();
      return updated.id;
    },
    [documentId, updateDocument, online, triggerSync, router]
  );

  if (loading) {
    return (
      <DashboardLayout hideFooter syncStatus={syncStatus} isOnline={online}>
        <div className="flex h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!document) {
    return (
      <DashboardLayout hideFooter syncStatus={syncStatus} isOnline={online}>
        <div className="flex h-[60vh] flex-col items-center justify-center gap-4 text-center">
          <AlertCircle className="h-10 w-10 text-muted-foreground" />
          <div>
            <p className="font-medium">Document not found</p>
            <p className="text-sm text-muted-foreground mt-1">
              {error ?? "This document may have been deleted or you lack access."}
            </p>
          </div>
          <Button variant="outline" onClick={() => router.push("/dashboard")}>
            Back to dashboard
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      hideFooter
      syncStatus={syncStatus}
      isOnline={online}
      className="flex h-[calc(100vh-3.5rem)] flex-col overflow-hidden p-0 lg:p-0"
    >
      <DocumentEditor
        className="flex-1"
        document={document}
        onSave={handleSave}
        presenceUsers={presenceUsers}
        syncStatus={syncStatus}
        connected={connected}
      />
    </DashboardLayout>
  );
}

export default function EditorPage() {
  const params = useParams();
  const documentId = params.documentId as string;
  const { online } = useNetwork();

  return (
    <SocketProvider
      documentId={documentId}
      autoConnect={online && isSocketEnabled()}
    >
      <EditorPageContent documentId={documentId} />
    </SocketProvider>
  );
}
