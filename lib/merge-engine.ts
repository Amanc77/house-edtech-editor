import type { Operation, SyncOperationInput } from "@/types";

export interface MergeableOperation {
  userId: string;
  type: Operation["type"];
  position: number;
  length: number;
  content: string;
  lamportClock: number;
  vectorClock: Record<string, number>;
  timestamp: number;
  checksum: string;
  clientId?: string;
}

export interface MergeResult {
  content: string;
  title?: string;
  lamportClock: number;
  vectorClock: Record<string, number>;
  checksum: string;
  appliedOperations: MergeableOperation[];
  rejectedOperations: MergeableOperation[];
  conflictsResolved: number;
}

function compareOperations(a: MergeableOperation, b: MergeableOperation): number {
  if (a.lamportClock !== b.lamportClock) {
    return a.lamportClock - b.lamportClock;
  }
  if (a.userId !== b.userId) {
    return a.userId.localeCompare(b.userId);
  }
  if (a.timestamp !== b.timestamp) {
    return a.timestamp - b.timestamp;
  }
  return a.checksum.localeCompare(b.checksum);
}

export function sortOperations<T extends MergeableOperation>(operations: T[]): T[] {
  return [...operations].sort(compareOperations);
}

function mergeVectorClocks(
  base: Record<string, number>,
  incoming: Record<string, number>
): Record<string, number> {
  const merged = { ...base };
  for (const [key, value] of Object.entries(incoming)) {
    merged[key] = Math.max(merged[key] ?? 0, value);
  }
  return merged;
}

function applyInsert(content: string, position: number, text: string): string {
  const safePos = Math.max(0, Math.min(position, content.length));
  return content.slice(0, safePos) + text + content.slice(safePos);
}

function applyDelete(content: string, position: number, length: number): string {
  const safePos = Math.max(0, Math.min(position, content.length));
  const safeEnd = Math.max(safePos, Math.min(safePos + length, content.length));
  return content.slice(0, safePos) + content.slice(safeEnd);
}

function transformPosition(
  position: number,
  appliedOps: MergeableOperation[]
): number {
  let transformed = position;
  for (const op of appliedOps) {
    if (op.type === "insert" && op.position <= transformed) {
      transformed += op.content.length;
    } else if (op.type === "delete" && op.position < transformed) {
      const deleteEnd = op.position + op.length;
      if (deleteEnd <= transformed) {
        transformed -= op.length;
      } else if (op.position < transformed) {
        transformed = op.position;
      }
    }
  }
  return Math.max(0, transformed);
}

export function mergeOperations(
  baseContent: string,
  baseTitle: string,
  baseLamportClock: number,
  baseVectorClock: Record<string, number>,
  incomingOperations: MergeableOperation[],
  existingChecksums: Set<string> = new Set()
): MergeResult {
  const sorted = sortOperations(incomingOperations);
  let content = baseContent;
  let title = baseTitle;
  let lamportClock = baseLamportClock;
  let vectorClock = { ...baseVectorClock };
  const appliedOperations: MergeableOperation[] = [];
  const rejectedOperations: MergeableOperation[] = [];
  let conflictsResolved = 0;

  for (const op of sorted) {
    if (existingChecksums.has(op.checksum)) {
      rejectedOperations.push(op);
      continue;
    }

    lamportClock = Math.max(lamportClock, op.lamportClock);
    vectorClock = mergeVectorClocks(vectorClock, op.vectorClock);

    const transformedPosition = transformPosition(op.position, appliedOperations);

    try {
      switch (op.type) {
        case "insert": {
          content = applyInsert(content, transformedPosition, op.content);
          appliedOperations.push({ ...op, position: transformedPosition });
          break;
        }
        case "delete": {
          content = applyDelete(content, transformedPosition, op.length);
          appliedOperations.push({ ...op, position: transformedPosition });
          break;
        }
        case "retain":
          appliedOperations.push(op);
          break;
        case "title_update":
          title = op.content;
          appliedOperations.push(op);
          break;
        case "snapshot":
        case "restore":
          appliedOperations.push(op);
          break;
        default:
          rejectedOperations.push(op);
      }
    } catch {
      rejectedOperations.push(op);
      conflictsResolved++;
    }
  }

  const checksum = computeContentChecksum(content);

  return {
    content,
    title,
    lamportClock,
    vectorClock,
    checksum,
    appliedOperations,
    rejectedOperations,
    conflictsResolved,
  };
}

export function computeContentChecksum(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

export function toMergeableOperation(
  op: SyncOperationInput,
  userId: string
): MergeableOperation {
  return {
    userId,
    type: op.type,
    position: op.position,
    length: op.length,
    content: op.content,
    lamportClock: op.lamportClock,
    vectorClock: op.vectorClock,
    timestamp: op.timestamp,
    checksum: op.checksum,
    clientId: op.clientId,
  };
}

export function toMergeableFromStored(op: Operation): MergeableOperation {
  return {
    userId: op.userId,
    type: op.type,
    position: op.position,
    length: op.length,
    content: op.content,
    lamportClock: op.lamportClock,
    vectorClock: op.vectorClock,
    timestamp: op.timestamp,
    checksum: op.checksum,
    clientId: op.clientId,
  };
}
