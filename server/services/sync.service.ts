import { MAX_OPERATIONS_PER_DOCUMENT } from "@/constants";
import { mergeOperations, toMergeableOperation } from "@/lib/merge-engine";
import {
  computeChecksum,
  sanitizeContent,
  sanitizeTitle,
  validatePayloadSize,
} from "@/lib/security";
import { connectDB } from "@/server/db/connection";
import { activityRepository } from "@/server/repositories/activity.repository";
import { documentRepository } from "@/server/repositories/document.repository";
import { operationRepository } from "@/server/repositories/operation.repository";
import { recordToMap } from "@/server/repositories/mappers";
import { permissionService } from "@/server/services/permission.service";
import type { SyncPayload, SyncResult } from "@/types";
import type { FetchOperationsQuery } from "@/schemas/sync.schema";

export class SyncServiceError extends Error {
  constructor(
    message: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = "SyncServiceError";
  }
}

export const syncService = {
  async syncOperations(
    userId: string,
    payload: SyncPayload
  ): Promise<SyncResult> {
    const sizeCheck = validatePayloadSize(payload);
    if (!sizeCheck.valid) {
      throw new SyncServiceError(sizeCheck.error ?? "Payload too large", 413);
    }

    await connectDB();

    const document = await documentRepository.findById(payload.documentId);
    if (!document) {
      throw new SyncServiceError("Document not found", 404);
    }

    await permissionService.requireWrite(
      payload.documentId,
      userId,
      document.ownerId
    );

    const opCount = await operationRepository.countByDocument(payload.documentId);
    if (opCount >= MAX_OPERATIONS_PER_DOCUMENT) {
      throw new SyncServiceError("Maximum operations limit reached", 429);
    }

    const existingChecksums = new Set<string>();
    for (const op of payload.operations) {
      const existing = await operationRepository.findByChecksum(
        payload.documentId,
        op.checksum
      );
      if (existing) {
        existingChecksums.add(op.checksum);
      }
    }

    const mergeableOps = payload.operations.map((op) =>
      toMergeableOperation(op, userId)
    );

    const mergeResult = mergeOperations(
      document.content,
      document.title,
      document.lamportClock,
      document.vectorClock,
      mergeableOps,
      existingChecksums
    );

    const newContent = sanitizeContent(mergeResult.content);
    const newTitle = mergeResult.title
      ? sanitizeTitle(mergeResult.title)
      : document.title;
    const newVersion = document.version + mergeResult.appliedOperations.length;
    const checksum = computeChecksum(newContent);

    const operationsToStore = mergeResult.appliedOperations
      .filter((op) => !existingChecksums.has(op.checksum))
      .map((op) => ({
        documentId: payload.documentId,
        userId,
        clientId: op.clientId ?? "server",
        type: op.type,
        position: op.position,
        length: op.length,
        content: op.content,
        lamportClock: op.lamportClock,
        vectorClock: recordToMap(op.vectorClock),
        timestamp: op.timestamp,
        checksum: op.checksum,
        applied: true,
      }));

    let storedOperations: Awaited<
      ReturnType<typeof operationRepository.createMany>
    > = [];
    if (operationsToStore.length > 0) {
      storedOperations = await operationRepository.createMany(operationsToStore);
    }

    const updated = await documentRepository.update(payload.documentId, {
      content: newContent,
      title: newTitle,
      version: newVersion,
      lamportClock: mergeResult.lamportClock,
      vectorClock: recordToMap(mergeResult.vectorClock),
      checksum,
      lastSyncedAt: new Date(),
    });

    if (!updated) {
      throw new SyncServiceError("Failed to update document after sync", 500);
    }

    await activityRepository.create({
      documentId: payload.documentId,
      userId,
      action: "sync.completed",
      metadata: {
        appliedCount: storedOperations.length,
        rejectedCount: mergeResult.rejectedOperations.length,
        conflictsResolved: mergeResult.conflictsResolved,
      },
    });

    return {
      documentId: payload.documentId,
      version: updated.version,
      content: updated.content,
      title: updated.title,
      lamportClock: updated.lamportClock,
      vectorClock: updated.vectorClock,
      checksum: updated.checksum,
      appliedOperations: storedOperations,
      rejectedOperations: mergeResult.rejectedOperations.map((op) => ({
        clientId: op.clientId ?? "unknown",
        type: op.type,
        position: op.position,
        length: op.length,
        content: op.content,
        lamportClock: op.lamportClock,
        vectorClock: op.vectorClock,
        timestamp: op.timestamp,
        checksum: op.checksum,
      })),
      conflictsResolved: mergeResult.conflictsResolved,
    };
  },

  async fetchOperations(
    userId: string,
    query: FetchOperationsQuery
  ) {
    await connectDB();

    const document = await documentRepository.findById(query.documentId);
    if (!document) {
      throw new SyncServiceError("Document not found", 404);
    }

    await permissionService.requireRead(
      query.documentId,
      userId,
      document.ownerId
    );

    const operations = await operationRepository.listByDocument(
      query.documentId,
      {
        sinceLamport: query.sinceLamport,
        limit: query.limit,
      }
    );

    return {
      document,
      operations,
    };
  },

  async getDocumentState(documentId: string, userId: string) {
    await connectDB();

    const document = await documentRepository.findById(documentId);
    if (!document) {
      throw new SyncServiceError("Document not found", 404);
    }

    await permissionService.requireRead(documentId, userId, document.ownerId);

    const maxLamport = await operationRepository.getMaxLamportClock(documentId);

    return {
      ...document,
      maxLamportClock: maxLamport,
    };
  },
};
