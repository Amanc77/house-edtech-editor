"use client";

import { useCallback, useEffect, useState } from "react";
import type { DocumentMeta, Operation } from "@/types";
import { apiPath, parseJsonResponse } from "@/lib/api";
import { isMongoObjectId } from "@/lib/mongo-id";
import { computeChecksum } from "@/utils/content";
import { generateId } from "@/lib/utils";
import {
  createStoredDocument,
  deleteDocument as deleteLocalDocument,
  getAllDocuments,
  getDocument,
  upsertDocument,
  saveOperation,
  enqueueSyncItem,
  type StoredDocument,
} from "@/offline/db";
import { createSyncQueueItem, syncEngine } from "@/offline/sync-engine";
import { useDocumentStore } from "@/stores/document-store";
import { useAuthStore } from "@/stores/auth-store";
import { createOperation } from "@/utils/operation";
import { useNetwork } from "./useNetwork";

function toDocumentMeta(doc: StoredDocument): DocumentMeta {
  return {
    id: doc.id,
    title: doc.title,
    ownerId: doc.ownerId,
    content: doc.content,
    version: doc.version,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    lastSyncedAt: doc.lastSyncedAt,
  };
}

function toStoredDocument(
  meta: DocumentMeta,
  extras?: Partial<StoredDocument>
): StoredDocument {
  return createStoredDocument({
    id: meta.id,
    title: meta.title,
    ownerId: meta.ownerId,
    content: meta.content,
    version: meta.version,
    createdAt: meta.createdAt,
    updatedAt: meta.updatedAt,
    lastSyncedAt: meta.lastSyncedAt,
    checksum: computeChecksum(meta.content),
    ...extras,
  });
}

async function createDocumentOnServer(
  title: string,
  content: string
): Promise<DocumentMeta> {
  const response = await fetch(apiPath("/api/documents"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ title, content }),
  });

  const result = await parseJsonResponse<DocumentMeta>(response);
  if (!response.ok || !result.data) {
    throw new Error(result.error ?? "Failed to create document on server");
  }

  return result.data;
}

async function replaceLocalDocumentId(
  localId: string,
  remote: DocumentMeta
): Promise<DocumentMeta> {
  await deleteLocalDocument(localId);
  const stored = toStoredDocument(remote);
  await upsertDocument(stored);
  return toDocumentMeta(stored);
}

export interface UseDocumentResult {
  documents: DocumentMeta[];
  document: DocumentMeta | null;
  loading: boolean;
  error: string | null;
  loadDocuments: () => Promise<DocumentMeta[]>;
  loadDocument: (id: string) => Promise<DocumentMeta>;
  createDocument: (title: string, content?: string) => Promise<DocumentMeta>;
  updateDocument: (
    id: string,
    updates: Partial<Pick<DocumentMeta, "title" | "content">>
  ) => Promise<DocumentMeta>;
  deleteDocument: (id: string) => Promise<void>;
  queueOperation: (
    operation: Omit<Operation, "id" | "timestamp" | "checksum" | "applied">
  ) => Promise<Operation>;
}

export function useDocument(documentId?: string): UseDocumentResult {
  const { online } = useNetwork();
  const user = useAuthStore((s) => s.user);
  const documents = useDocumentStore((s) => s.documents);
  const listLoading = useDocumentStore((s) => s.isLoading);
  const setDocuments = useDocumentStore((s) => s.setDocuments);
  const addDocument = useDocumentStore((s) => s.addDocument);
  const updateDocumentInStore = useDocumentStore((s) => s.updateDocument);
  const removeDocumentFromStore = useDocumentStore((s) => s.removeDocument);
  const setLoading = useDocumentStore((s) => s.setLoading);
  const setError = useDocumentStore((s) => s.setError);

  const [document, setDocument] = useState<DocumentMeta | null>(null);
  const [loading, setLocalLoading] = useState(false);
  const [documentError, setDocumentError] = useState<string | null>(null);

  const loadDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const localDocs = await getAllDocuments();

      if (online) {
        const response = await fetch(apiPath("/api/documents"), {
          credentials: "include",
        });

        if (response.ok) {
          const result = await parseJsonResponse<DocumentMeta[] | { items: DocumentMeta[] }>(response);
          const remoteDocs: DocumentMeta[] = Array.isArray(result.data)
            ? result.data
            : (result.data?.items ?? []);
          for (const doc of remoteDocs) {
            await upsertDocument(toStoredDocument(doc));
          }

          const remoteIds = new Set(remoteDocs.map((doc) => doc.id));
          const merged = await getAllDocuments();
          const deduped: DocumentMeta[] = [];
          const seenTitles = new Map<string, DocumentMeta>();

          for (const doc of merged.map(toDocumentMeta)) {
            const key = `${doc.ownerId}:${doc.title.trim().toLowerCase()}`;
            const existing = seenTitles.get(key);

            if (!existing) {
              seenTitles.set(key, doc);
              deduped.push(doc);
              continue;
            }

            const keepRemote =
              remoteIds.has(doc.id) && !remoteIds.has(existing.id)
                ? doc
                : remoteIds.has(existing.id)
                  ? existing
                  : doc.lastSyncedAt && !existing.lastSyncedAt
                    ? doc
                    : existing;
            const drop =
              keepRemote.id === doc.id ? existing : doc;

            if (drop.id !== keepRemote.id && !remoteIds.has(drop.id)) {
              await deleteLocalDocument(drop.id);
            }

            seenTitles.set(key, keepRemote);
            const index = deduped.findIndex((item) => item.id === existing.id);
            if (index >= 0) {
              deduped[index] = keepRemote;
            }
          }

          setDocuments(deduped);
          return deduped;
        }
      }

      const meta = localDocs.map(toDocumentMeta);
      setDocuments(meta);
      return meta;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load documents";
      setError(message);
      const fallback = await getAllDocuments();
      const meta = fallback.map(toDocumentMeta);
      setDocuments(meta);
      return meta;
    } finally {
      setLoading(false);
    }
  }, [online, setDocuments, setLoading, setError]);

  const loadDocument = useCallback(
    async (id: string) => {
      setLocalLoading(true);
      setDocumentError(null);
      try {
        let doc = await getDocument(id);

        if (online) {
          const shouldRegisterOnServer =
            !!doc && !isMongoObjectId(id);

          if (shouldRegisterOnServer && doc) {
            const remote = await createDocumentOnServer(doc.title, doc.content);
            const meta = await replaceLocalDocumentId(id, remote);
            removeDocumentFromStore(id);
            addDocument(meta);
            setDocument(meta);
            updateDocumentInStore(meta.id, meta);
            return meta;
          }

          const response = await fetch(apiPath(`/api/documents/${id}`), {
            credentials: "include",
          });

          if (response.ok) {
            const result = await parseJsonResponse<
              DocumentMeta & {
                lamportClock?: number;
                vectorClock?: Record<string, number>;
                checksum?: string;
              }
            >(response);
            const remote = result.data;
            if (remote) {
              await upsertDocument(toStoredDocument(remote));
              doc = await getDocument(id);
            }
          }
        }

        if (!doc) {
          throw new Error("Document not found");
        }

        const meta = toDocumentMeta(doc);
        setDocument(meta);
        updateDocumentInStore(doc.id, meta);
        return meta;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to load document";
        setError(message);
        setDocumentError(message);
        setDocument(null);
        throw error;
      } finally {
        setLocalLoading(false);
      }
    },
    [online, setError, updateDocumentInStore, addDocument, removeDocumentFromStore]
  );

  const createDocument = useCallback(
    async (title: string, content = "") => {
      if (online) {
        const remoteDoc = await createDocumentOnServer(title, content);
        const stored = toStoredDocument(remoteDoc);
        await upsertDocument(stored);
        addDocument(toDocumentMeta(stored));
        return toDocumentMeta(stored);
      }

      const now = new Date().toISOString();
      const ownerId = user?.id ?? "local-user";
      const newDoc = createStoredDocument({
        id: generateId(),
        title,
        content,
        ownerId,
        version: 0,
        lamportClock: 0,
        vectorClock: {},
        createdAt: now,
        updatedAt: now,
      });

      await upsertDocument(newDoc);
      addDocument(toDocumentMeta(newDoc));
      return toDocumentMeta(newDoc);
    },
    [user, online, addDocument]
  );

  const updateDocument = useCallback(
    async (
      id: string,
      updates: Partial<Pick<DocumentMeta, "title" | "content">>
    ) => {
      const existing = await getDocument(id);
      if (!existing) throw new Error("Document not found");

      const updated = createStoredDocument({
        ...existing,
        ...updates,
        updatedAt: new Date().toISOString(),
        checksum: computeChecksum(updates.content ?? existing.content),
      });

      await upsertDocument(updated);
      const meta = toDocumentMeta(updated);
      updateDocumentInStore(id, meta);
      setDocument((prev) => {
        if (prev?.id !== id) return prev;
        if (
          prev.title === meta.title &&
          prev.content === meta.content &&
          prev.version === meta.version
        ) {
          return prev;
        }
        return meta;
      });

      if (online) {
        try {
          if (!isMongoObjectId(id)) {
            const remote = await createDocumentOnServer(
              updates.title ?? existing.title,
              updates.content ?? existing.content
            );
            const meta = await replaceLocalDocumentId(id, remote);
            removeDocumentFromStore(id);
            addDocument(meta);
            setDocument(meta);
            return meta;
          }

          const response = await fetch(apiPath(`/api/documents/${id}`), {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(updates),
          });

          if (response.status === 404) {
            const remote = await createDocumentOnServer(
              updates.title ?? existing.title,
              updates.content ?? existing.content
            );
            const createdMeta = await replaceLocalDocumentId(id, remote);
            removeDocumentFromStore(id);
            addDocument(createdMeta);
            setDocument(createdMeta);
            return createdMeta;
          }

          if (!response.ok) {
            await parseJsonResponse(response).catch(() => undefined);
          }
        } catch {
          // offline-first: local doc is source of truth until sync
        }
      }

      return meta;
    },
    [online, updateDocumentInStore, addDocument, removeDocumentFromStore]
  );

  const deleteDocument = useCallback(
    async (id: string) => {
      await deleteLocalDocument(id);
      removeDocumentFromStore(id);
      setDocument((prev) => (prev?.id === id ? null : prev));

      if (online) {
        try {
          await fetch(apiPath(`/api/documents/${id}`), {
            method: "DELETE",
            credentials: "include",
          });
        } catch {
          // local delete already applied
        }
      }
    },
    [online, removeDocumentFromStore]
  );

  const queueOperation = useCallback(
    async (
      operation: Omit<Operation, "id" | "timestamp" | "checksum" | "applied">
    ) => {
      const op = createOperation({
        documentId: operation.documentId,
        userId: operation.userId,
        clientId: operation.clientId,
        type: operation.type,
        position: operation.position,
        length: operation.length,
        content: operation.content,
        lamportClock: operation.lamportClock,
        vectorClock: operation.vectorClock,
      });

      await saveOperation(op);
      await enqueueSyncItem(createSyncQueueItem(op));
      syncEngine.scheduleSync();

      const doc = await getDocument(operation.documentId);
      if (doc) {
        let content = doc.content;
        let title = doc.title;

        if (op.type === "insert") {
          content =
            content.slice(0, op.position) +
            op.content +
            content.slice(op.position);
        } else if (op.type === "delete") {
          content =
            content.slice(0, op.position) +
            content.slice(op.position + op.length);
        } else if (op.type === "title_update") {
          title = op.content;
        }

        const updated = createStoredDocument({
          ...doc,
          content,
          title,
          version: doc.version + 1,
          lamportClock: op.lamportClock,
          vectorClock: op.vectorClock,
          checksum: computeChecksum(content),
          updatedAt: new Date().toISOString(),
        });
        await upsertDocument(updated);
        updateDocumentInStore(doc.id, toDocumentMeta(updated));
      }

      return op;
    },
    [updateDocumentInStore]
  );

  useEffect(() => {
    if (documentId) {
      setDocument(null);
      void loadDocument(documentId).catch(() => undefined);
    }
  }, [documentId, loadDocument]);

  return {
    documents,
    document,
    loading: documentId ? loading : listLoading,
    error: documentError,
    loadDocuments,
    loadDocument,
    createDocument,
    updateDocument,
    deleteDocument,
    queueOperation,
  };
}
