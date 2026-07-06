import type { DocumentMeta, Operation } from "@/types";
import { applyContentPatch, clampPosition } from "@/utils/content";
import {
  compareOperations,
  deduplicateOperations,
  sortOperations,
} from "@/utils/operation";

export interface MergeResult {
  content: string;
  title: string;
  version: number;
  appliedOperationIds: string[];
}

export interface MergeState {
  content: string;
  title: string;
  version: number;
  appliedIds: Set<string>;
}

export function createMergeState(doc: DocumentMeta): MergeState {
  return {
    content: doc.content,
    title: doc.title,
    version: doc.version,
    appliedIds: new Set(),
  };
}

export function mergeRemoteOperations(
  doc: DocumentMeta,
  remoteOperations: Operation[],
  alreadyAppliedIds?: Set<string>
): MergeResult {
  const state = createMergeState(doc);
  if (alreadyAppliedIds) {
    for (const id of alreadyAppliedIds) {
      state.appliedIds.add(id);
    }
  }

  const newOps = remoteOperations.filter((op) => !state.appliedIds.has(op.id));
  const ordered = sortOperations(deduplicateOperations(newOps));

  for (const op of ordered) {
    applyOperationToState(state, op);
    state.appliedIds.add(op.id);
  }

  return {
    content: state.content,
    title: state.title,
    version: state.version,
    appliedOperationIds: ordered.map((op) => op.id),
  };
}

export function applyOperationToState(state: MergeState, op: Operation): void {
  switch (op.type) {
    case "insert": {
      const position = clampPosition(op.position, state.content.length);
      state.content = applyContentPatch(
        state.content,
        position,
        0,
        op.content
      );
      state.version = Math.max(state.version, op.lamportClock);
      break;
    }
    case "delete": {
      const position = clampPosition(op.position, state.content.length);
      const length = Math.min(op.length, state.content.length - position);
      state.content = applyContentPatch(state.content, position, length, "");
      state.version = Math.max(state.version, op.lamportClock);
      break;
    }
    case "retain":
      break;
    case "title_update":
      state.title = op.content;
      state.version = Math.max(state.version, op.lamportClock);
      break;
    case "snapshot":
    case "restore":
      state.content = op.content;
      state.version = Math.max(state.version, op.lamportClock);
      break;
    default:
      break;
  }
}

export function transformOperationPosition(
  op: Operation,
  priorOps: Operation[]
): Operation {
  let position = op.position;

  for (const prior of sortOperations(priorOps)) {
    if (prior.id === op.id) continue;
    if (compareOperations(prior, op) >= 0) continue;

    if (prior.type === "insert") {
      if (prior.position <= position) {
        position += prior.content.length;
      }
    } else if (prior.type === "delete") {
      if (prior.position < position) {
        const deleteEnd = prior.position + prior.length;
        if (deleteEnd <= position) {
          position -= prior.length;
        } else {
          position = prior.position;
        }
      }
    }
  }

  return { ...op, position };
}

export function replayOperations(
  baseContent: string,
  baseTitle: string,
  operations: Operation[]
): { content: string; title: string } {
  const state: MergeState = {
    content: baseContent,
    title: baseTitle,
    version: 0,
    appliedIds: new Set(),
  };

  for (const op of sortOperations(deduplicateOperations(operations))) {
    applyOperationToState(state, op);
  }

  return { content: state.content, title: state.title };
}

export function getUnseenOperations(
  allOperations: Operation[],
  appliedIds: Set<string>
): Operation[] {
  return sortOperations(allOperations.filter((op) => !appliedIds.has(op.id)));
}

export function mergeDocumentWithOperations(
  doc: DocumentMeta,
  localOps: Operation[],
  remoteOps: Operation[]
): DocumentMeta {
  const combined = deduplicateOperations([...localOps, ...remoteOps]);
  const { content, title } = replayOperations(doc.content, doc.title, combined);
  const maxLamport = combined.reduce(
    (max, op) => Math.max(max, op.lamportClock),
    doc.version
  );

  return {
    ...doc,
    content,
    title,
    version: maxLamport,
    updatedAt: new Date().toISOString(),
  };
}
