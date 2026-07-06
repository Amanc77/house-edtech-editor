import { apiPath } from "@/lib/api";
import type {
  ApiResponse,
  Operation,
  SyncPayload,
  SyncQueueItem,
  SyncResult,
  SyncStatus,
} from "@/types";
import {
  MAX_OPERATION_BATCH_SIZE,
  MAX_SYNC_PAYLOAD_BYTES,
  SYNC_DEBOUNCE_MS,
  SYNC_MAX_RETRIES,
  SYNC_RETRY_BASE_MS,
  SYNC_RETRY_MAX_MS,
} from "@/constants";
import {
  compressOperationBatch,
  mergeVectorClocks,
  toSyncOperationInput,
} from "@/utils/operation";
import { computeChecksum } from "@/utils/content";
import {
  getDocument,
  getPendingSyncItems,
  markOperationsApplied,
  removeSyncItem,
  saveOperations,
  updateSyncItem,
  upsertDocument,
  type StoredDocument,
} from "./db";
import { mergeRemoteOperations } from "./merge-client";
import { networkMonitor } from "./network";

export type SyncEngineEvent =
  | { type: "status"; status: SyncStatus; documentId?: string }
  | { type: "synced"; documentId: string; operationCount: number }
  | { type: "error"; documentId?: string; error: string }
  | { type: "queue"; pending: number; failed: number };

type SyncListener = (event: SyncEngineEvent) => void;

const CLIENT_ID_KEY = "syncdocs_client_id";

class SyncEngine {
  private listeners = new Set<SyncListener>();
  private running = false;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private retryQueue: Map<string, { item: SyncQueueItem; nextRetryAt: number }> =
    new Map();
  private unsubscribeNetwork: (() => void) | null = null;
  private clientId: string;

  constructor() {
    this.clientId = this.resolveClientId();
  }

  private resolveClientId(): string {
    if (typeof window === "undefined") {
      return crypto.randomUUID();
    }
    const existing = localStorage.getItem(CLIENT_ID_KEY);
    if (existing) return existing;
    const id = crypto.randomUUID();
    localStorage.setItem(CLIENT_ID_KEY, id);
    return id;
  }

  getClientId(): string {
    return this.clientId;
  }

  subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  start(): void {
    if (this.running) return;
    this.running = true;

    this.unsubscribeNetwork = networkMonitor.on("change", (online) => {
      if (online) {
        this.emit({ type: "status", status: "pending" });
        this.scheduleSync();
      } else {
        this.emit({ type: "status", status: "offline" });
      }
    });

    if (networkMonitor.online) {
      this.scheduleSync();
    } else {
      this.emit({ type: "status", status: "offline" });
    }
  }

  stop(): void {
    this.running = false;
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    this.unsubscribeNetwork?.();
    this.unsubscribeNetwork = null;
  }

  scheduleSync(delayMs = SYNC_DEBOUNCE_MS): void {
    if (!this.running) return;
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.debounceTimer = null;
      void this.processQueue();
    }, delayMs);
  }

  async processQueue(): Promise<void> {
    if (!this.running) return;

    if (!networkMonitor.online) {
      this.emit({ type: "status", status: "offline" });
      return;
    }

    const pending = await getPendingSyncItems();
    const failed = pending.filter((i) => i.status === "failed").length;
    this.emit({
      type: "queue",
      pending: pending.length,
      failed,
    });

    if (pending.length === 0) {
      this.emit({ type: "status", status: "synced" });
      return;
    }

    this.emit({ type: "status", status: "syncing" });

    const now = Date.now();
    const readyItems: SyncQueueItem[] = [];

    for (const item of pending) {
      const retryEntry = this.retryQueue.get(item.id);
      if (retryEntry && retryEntry.nextRetryAt > now) continue;
      readyItems.push(item);
    }

    const batches = this.createBatches(readyItems);

    for (const batch of batches) {
      try {
        await this.uploadBatch(batch);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Sync batch failed";
        this.emit({ type: "error", error: message });
        await this.handleBatchFailure(batch, message);
      }
    }

    const remaining = await getPendingSyncItems();
    if (remaining.length === 0) {
      this.emit({ type: "status", status: "synced" });
    } else {
      this.emit({ type: "status", status: "pending" });
      const nextRetries = remaining.map((item) => item.retries);
      const minRetries = Math.min(...nextRetries);
      this.scheduleSync(this.getNextRetryDelay(minRetries));
    }
  }

  private createBatches(items: SyncQueueItem[]): SyncQueueItem[][] {
    const byDocument = new Map<string, SyncQueueItem[]>();

    for (const item of items) {
      const list = byDocument.get(item.documentId) ?? [];
      list.push(item);
      byDocument.set(item.documentId, list);
    }

    const batches: SyncQueueItem[][] = [];

    for (const docItems of byDocument.values()) {
      for (let i = 0; i < docItems.length; i += MAX_OPERATION_BATCH_SIZE) {
        batches.push(docItems.slice(i, i + MAX_OPERATION_BATCH_SIZE));
      }
    }

    return batches;
  }

  private async uploadBatch(batch: SyncQueueItem[]): Promise<void> {
    if (batch.length === 0) return;

    const documentId = batch[0].documentId;
    const doc = await getDocument(documentId);
    if (!doc) {
      throw new Error(`Document ${documentId} not found in local store`);
    }

    const compressed = compressOperationBatch(batch.map((item) => item.operation));
    const syncOperations = compressed.map(toSyncOperationInput);

    const payload: SyncPayload = {
      documentId,
      baseVersion: doc.version,
      lamportClock: doc.lamportClock,
      vectorClock: { ...doc.vectorClock },
      operations: syncOperations,
    };

    const payloadSize = new Blob([JSON.stringify(payload)]).size;
    if (payloadSize > MAX_SYNC_PAYLOAD_BYTES) {
      const half = Math.ceil(batch.length / 2);
      await this.uploadBatch(batch.slice(0, half));
      await this.uploadBatch(batch.slice(half));
      return;
    }

    for (const item of batch) {
      await updateSyncItem(item.id, { status: "processing" });
    }

    const response = await fetch(apiPath("/api/sync"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as ApiResponse;
      throw new Error(body.error ?? `Sync failed with status ${response.status}`);
    }

    const result = (await response.json()) as ApiResponse<SyncResult>;
    const syncResult = result.data;
    if (!syncResult) {
      throw new Error("Sync response missing data");
    }

    await this.applySyncResult(doc, syncResult, compressed);

    for (const item of batch) {
      await updateSyncItem(item.id, { status: "completed" });
      await removeSyncItem(item.id);
      this.retryQueue.delete(item.id);
    }

    this.emit({
      type: "synced",
      documentId,
      operationCount: compressed.length,
    });
  }

  private async applySyncResult(
    doc: StoredDocument,
    syncResult: SyncResult,
    localOps: Operation[]
  ): Promise<void> {
    if (syncResult.appliedOperations.length > 0) {
      await saveOperations(syncResult.appliedOperations);
      await markOperationsApplied(
        syncResult.appliedOperations.map((op) => op.id)
      );
    }

    const merged = mergeRemoteOperations(
      {
        id: doc.id,
        title: doc.title,
        ownerId: doc.ownerId,
        content: doc.content,
        version: doc.version,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
        lastSyncedAt: doc.lastSyncedAt,
      },
      syncResult.appliedOperations
    );

    const updatedDoc: StoredDocument = {
      ...doc,
      content: syncResult.content,
      title: syncResult.title,
      version: syncResult.version,
      lamportClock: syncResult.lamportClock,
      vectorClock: mergeVectorClocks(doc.vectorClock, syncResult.vectorClock),
      checksum: syncResult.checksum ?? computeChecksum(syncResult.content),
      updatedAt: new Date().toISOString(),
      lastSyncedAt: new Date().toISOString(),
    };

    if (merged.content !== syncResult.content) {
      updatedDoc.content = merged.content;
      updatedDoc.title = merged.title;
    }

    await upsertDocument(updatedDoc);
    await markOperationsApplied(localOps.map((op) => op.id));
  }

  private async handleBatchFailure(
    batch: SyncQueueItem[],
    errorMessage: string
  ): Promise<void> {
    for (const item of batch) {
      const retries = item.retries + 1;
      const status = retries >= item.maxRetries ? "failed" : "pending";

      await updateSyncItem(item.id, {
        status,
        retries,
        lastAttemptAt: Date.now(),
      });

      if (retries < item.maxRetries) {
        const delay = this.getBackoffDelay(retries);
        this.retryQueue.set(item.id, {
          item: { ...item, retries },
          nextRetryAt: Date.now() + delay,
        });
      } else {
        this.emit({
          type: "error",
          documentId: item.documentId,
          error: `${errorMessage} (max retries exceeded)`,
        });
      }
    }

    this.emit({ type: "status", status: "error" });
  }

  private getBackoffDelay(retries: number): number {
    const delay = SYNC_RETRY_BASE_MS * Math.pow(2, retries - 1);
    const jitter = Math.random() * 0.3 * delay;
    return Math.min(delay + jitter, SYNC_RETRY_MAX_MS);
  }

  private getNextRetryDelay(retries: number): number {
    return Math.min(
      this.getBackoffDelay(Math.max(1, retries)),
      SYNC_RETRY_MAX_MS
    );
  }

  private emit(event: SyncEngineEvent): void {
    for (const listener of this.listeners) {
      listener(event);
    }
  }
}

export const syncEngine = new SyncEngine();

export function createSyncQueueItem(
  operation: Operation,
  overrides?: Partial<SyncQueueItem>
): SyncQueueItem {
  return {
    id: operation.id,
    documentId: operation.documentId,
    operation,
    retries: 0,
    maxRetries: SYNC_MAX_RETRIES,
    createdAt: Date.now(),
    status: "pending",
    ...overrides,
  };
}
