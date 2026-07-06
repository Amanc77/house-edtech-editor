import Dexie, { type EntityTable } from "dexie";
import type { Operation, SyncQueueItem, Version } from "@/types";
import { computeChecksum } from "@/utils/content";

/** Local document record with sync metadata for offline-first storage. */
export interface StoredDocument {
  id: string;
  title: string;
  ownerId: string;
  content: string;
  version: number;
  lamportClock: number;
  vectorClock: Record<string, number>;
  checksum: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  lastSyncedAt?: string;
}

export interface AppMetadata {
  key: string;
  value: string;
  updatedAt: number;
}

export function createStoredDocument(
  partial: Pick<StoredDocument, "id" | "title" | "ownerId"> &
    Partial<
      Pick<
        StoredDocument,
        | "content"
        | "version"
        | "lamportClock"
        | "vectorClock"
        | "checksum"
        | "isArchived"
        | "createdAt"
        | "updatedAt"
        | "lastSyncedAt"
      >
    >
): StoredDocument {
  const now = new Date().toISOString();
  const content = partial.content ?? "";
  return {
    content,
    version: partial.version ?? 0,
    lamportClock: partial.lamportClock ?? 0,
    vectorClock: partial.vectorClock ?? {},
    checksum: partial.checksum ?? computeChecksum(content),
    isArchived: partial.isArchived ?? false,
    createdAt: partial.createdAt ?? now,
    updatedAt: partial.updatedAt ?? now,
    lastSyncedAt: partial.lastSyncedAt,
    ...partial,
  };
}

export class SyncDocsDatabase extends Dexie {
  documents!: EntityTable<StoredDocument, "id">;
  operations!: EntityTable<Operation, "id">;
  syncQueue!: EntityTable<SyncQueueItem, "id">;
  versions!: EntityTable<Version, "id">;
  metadata!: EntityTable<AppMetadata, "key">;

  constructor() {
    super("SyncDocsDB");

    this.version(1).stores({
      documents:
        "id, ownerId, title, version, lamportClock, updatedAt, lastSyncedAt, createdAt, isArchived",
      operations:
        "id, documentId, userId, clientId, type, lamportClock, timestamp, applied, checksum, [documentId+lamportClock], [documentId+applied]",
      syncQueue:
        "id, documentId, status, createdAt, retries, lastAttemptAt, [documentId+status]",
      versions:
        "id, documentId, versionNumber, createdAt, checksum, [documentId+versionNumber]",
      metadata: "key, updatedAt",
    });
  }
}

export const db = new SyncDocsDatabase();

export async function getDocument(
  id: string
): Promise<StoredDocument | undefined> {
  return db.documents.get(id);
}

export async function getAllDocuments(): Promise<StoredDocument[]> {
  return db.documents.orderBy("updatedAt").reverse().toArray();
}

export async function upsertDocument(doc: StoredDocument): Promise<void> {
  await db.documents.put(doc);
}

export async function deleteDocument(id: string): Promise<void> {
  await db.transaction(
    "rw",
    [db.documents, db.operations, db.syncQueue, db.versions],
    async () => {
      await db.documents.delete(id);
      await db.operations.where("documentId").equals(id).delete();
      await db.syncQueue.where("documentId").equals(id).delete();
      await db.versions.where("documentId").equals(id).delete();
    }
  );
}

export async function getOperationsForDocument(
  documentId: string
): Promise<Operation[]> {
  return db.operations
    .where("documentId")
    .equals(documentId)
    .sortBy("lamportClock");
}

export async function getUnappliedOperations(
  documentId: string
): Promise<Operation[]> {
  return db.operations
    .where({ documentId, applied: false })
    .sortBy("lamportClock");
}

export async function saveOperation(op: Operation): Promise<void> {
  await db.operations.put(op);
}

export async function saveOperations(ops: Operation[]): Promise<void> {
  await db.operations.bulkPut(ops);
}

export async function markOperationsApplied(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  await db.transaction("rw", db.operations, async () => {
    for (const id of ids) {
      await db.operations.update(id, { applied: true });
    }
  });
}

export async function getPendingSyncItems(): Promise<SyncQueueItem[]> {
  return db.syncQueue
    .where("status")
    .anyOf(["pending", "failed"])
    .sortBy("createdAt");
}

export async function getSyncQueueForDocument(
  documentId: string
): Promise<SyncQueueItem[]> {
  return db.syncQueue
    .where("documentId")
    .equals(documentId)
    .sortBy("createdAt");
}

export async function enqueueSyncItem(item: SyncQueueItem): Promise<void> {
  await db.syncQueue.put(item);
}

export async function updateSyncItem(
  id: string,
  updates: Partial<SyncQueueItem>
): Promise<void> {
  await db.syncQueue.update(id, updates);
}

export async function removeSyncItem(id: string): Promise<void> {
  await db.syncQueue.delete(id);
}

export async function getVersionsForDocument(
  documentId: string
): Promise<Version[]> {
  return db.versions
    .where("documentId")
    .equals(documentId)
    .sortBy("versionNumber");
}

export async function saveVersion(version: Version): Promise<void> {
  await db.versions.put(version);
}

export async function getMetadata(key: string): Promise<string | undefined> {
  const entry = await db.metadata.get(key);
  return entry?.value;
}

export async function setMetadata(key: string, value: string): Promise<void> {
  await db.metadata.put({ key, value, updatedAt: Date.now() });
}

export async function clearAllData(): Promise<void> {
  await db.transaction(
    "rw",
    [db.documents, db.operations, db.syncQueue, db.versions, db.metadata],
    async () => {
      await db.documents.clear();
      await db.operations.clear();
      await db.syncQueue.clear();
      await db.versions.clear();
      await db.metadata.clear();
    }
  );
}
