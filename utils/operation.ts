import type {
  Operation,
  OperationType,
  SyncOperationInput,
} from "@/types";
import { generateId } from "@/lib/utils";
import { computeChecksum } from "@/utils/content";

export interface CreateOperationInput {
  documentId: string;
  userId: string;
  clientId: string;
  type: OperationType;
  position: number;
  length?: number;
  content?: string;
  lamportClock: number;
  vectorClock: Record<string, number>;
}

export function createOperation(input: CreateOperationInput): Operation {
  const content = input.content ?? "";
  const length = input.length ?? content.length;
  const timestamp = Date.now();

  return {
    id: generateId(),
    documentId: input.documentId,
    userId: input.userId,
    clientId: input.clientId,
    type: input.type,
    position: input.position,
    length,
    content,
    lamportClock: input.lamportClock,
    vectorClock: { ...input.vectorClock },
    timestamp,
    checksum: computeChecksum(
      `${input.type}:${input.position}:${length}:${content}:${timestamp}`
    ),
    applied: false,
  };
}

export function toSyncOperationInput(op: Operation): SyncOperationInput {
  return {
    clientId: op.clientId,
    type: op.type,
    position: op.position,
    length: op.length,
    content: op.content,
    lamportClock: op.lamportClock,
    vectorClock: { ...op.vectorClock },
    timestamp: op.timestamp,
    checksum: op.checksum,
  };
}

export function compareOperations(a: Operation, b: Operation): number {
  if (a.lamportClock !== b.lamportClock) {
    return a.lamportClock - b.lamportClock;
  }

  const vectorCompare = compareVectorClocks(a.vectorClock, b.vectorClock);
  if (vectorCompare !== 0) return vectorCompare;

  if (a.timestamp !== b.timestamp) {
    return a.timestamp - b.timestamp;
  }

  return a.id.localeCompare(b.id);
}

export function compareVectorClocks(
  a: Record<string, number>,
  b: Record<string, number>
): number {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  let aGreater = false;
  let bGreater = false;

  for (const key of keys) {
    const av = a[key] ?? 0;
    const bv = b[key] ?? 0;
    if (av > bv) aGreater = true;
    if (bv > av) bGreater = true;
  }

  if (aGreater && !bGreater) return 1;
  if (bGreater && !aGreater) return -1;
  return 0;
}

export function sortOperations(operations: Operation[]): Operation[] {
  return [...operations].sort(compareOperations);
}

export function deduplicateOperations(operations: Operation[]): Operation[] {
  const seen = new Map<string, Operation>();

  for (const op of sortOperations(operations)) {
    const existing = seen.get(op.id);
    if (!existing) {
      seen.set(op.id, op);
      continue;
    }
    if (compareOperations(op, existing) > 0) {
      seen.set(op.id, op);
    }
  }

  return sortOperations([...seen.values()]);
}

export function incrementVectorClock(
  vectorClock: Record<string, number>,
  clientId: string
): Record<string, number> {
  return {
    ...vectorClock,
    [clientId]: (vectorClock[clientId] ?? 0) + 1,
  };
}

export function mergeVectorClocks(
  local: Record<string, number>,
  remote: Record<string, number>
): Record<string, number> {
  const merged: Record<string, number> = { ...local };
  for (const [key, value] of Object.entries(remote)) {
    merged[key] = Math.max(merged[key] ?? 0, value);
  }
  return merged;
}

export function getOperationKey(op: Operation): string {
  return `${op.id}:${op.checksum}`;
}

export function compressOperationBatch(operations: Operation[]): Operation[] {
  const deduped = deduplicateOperations(operations);
  const byDocument = new Map<string, Operation[]>();

  for (const op of deduped) {
    const list = byDocument.get(op.documentId) ?? [];
    list.push(op);
    byDocument.set(op.documentId, list);
  }

  const compressed: Operation[] = [];
  for (const ops of byDocument.values()) {
    compressed.push(...collapseAdjacentInserts(sortOperations(ops)));
  }

  return compressed;
}

function collapseAdjacentInserts(operations: Operation[]): Operation[] {
  if (operations.length === 0) return operations;

  const result: Operation[] = [];
  let i = 0;

  while (i < operations.length) {
    const current = operations[i];
    if (current.type !== "insert") {
      result.push(current);
      i++;
      continue;
    }

    let merged = { ...current };
    let j = i + 1;

    while (j < operations.length) {
      const next = operations[j];
      if (
        next.type === "insert" &&
        next.userId === merged.userId &&
        next.clientId === merged.clientId &&
        next.position === merged.position + merged.content.length
      ) {
        merged = {
          ...merged,
          content: merged.content + next.content,
          length: merged.length + next.length,
          vectorClock: mergeVectorClocks(merged.vectorClock, next.vectorClock),
          lamportClock: Math.max(merged.lamportClock, next.lamportClock),
          timestamp: Math.max(merged.timestamp, next.timestamp),
          checksum: computeChecksum(
            `${merged.type}:${merged.position}:${merged.length}:${merged.content}:${merged.timestamp}`
          ),
        };
        j++;
      } else {
        break;
      }
    }

    result.push(merged);
    i = j;
  }

  return result;
}
