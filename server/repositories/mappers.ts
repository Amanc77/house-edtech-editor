import type { IUser } from "@/server/models/User";
import type { IDocument } from "@/server/models/Document";
import type { IVersion } from "@/server/models/Version";
import type { IOperation } from "@/server/models/Operation";
import type { IPermission } from "@/server/models/Permission";
import type { IActivityLog } from "@/server/models/ActivityLog";
import type {
  User,
  Document,
  Version,
  Operation,
  Permission,
  ActivityLogEntry,
} from "@/types";

function mapToRecord(map: Map<string, number> | Record<string, number>): Record<string, number> {
  if (map instanceof Map) {
    return Object.fromEntries(map.entries());
  }
  return { ...map };
}

export function toUserDTO(doc: IUser): User {
  return {
    id: doc._id.toString(),
    name: doc.name,
    email: doc.email,
    image: doc.image ?? null,
    provider: doc.provider,
    emailVerified: doc.emailVerified ?? null,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export function toDocumentDTO(doc: IDocument): Document {
  return {
    id: doc._id.toString(),
    title: doc.title,
    ownerId: doc.ownerId.toString(),
    content: doc.content,
    version: doc.version,
    lamportClock: doc.lamportClock,
    vectorClock: mapToRecord(doc.vectorClock),
    checksum: doc.checksum,
    isArchived: doc.isArchived,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
    lastSyncedAt: doc.lastSyncedAt?.toISOString(),
  };
}

export function toVersionDTO(doc: IVersion): Version {
  return {
    id: doc._id.toString(),
    documentId: doc.documentId.toString(),
    versionNumber: doc.versionNumber,
    title: doc.title,
    content: doc.content,
    snapshotBy: doc.snapshotBy.toString(),
    label: doc.label ?? undefined,
    checksum: doc.checksum,
    createdAt: doc.createdAt.toISOString(),
  };
}

export function toOperationDTO(doc: IOperation): Operation {
  return {
    id: doc._id.toString(),
    documentId: doc.documentId.toString(),
    userId: doc.userId.toString(),
    clientId: doc.clientId,
    type: doc.type,
    position: doc.position,
    length: doc.length,
    content: doc.content,
    lamportClock: doc.lamportClock,
    vectorClock: mapToRecord(doc.vectorClock),
    timestamp: doc.timestamp,
    checksum: doc.checksum,
    applied: doc.applied,
  };
}

export function toPermissionDTO(doc: IPermission): Permission {
  return {
    id: doc._id.toString(),
    documentId: doc.documentId.toString(),
    userId: doc.userId.toString(),
    role: doc.role,
    grantedBy: doc.grantedBy.toString(),
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export function toActivityLogDTO(doc: IActivityLog): ActivityLogEntry {
  return {
    id: doc._id.toString(),
    documentId: doc.documentId.toString(),
    userId: doc.userId.toString(),
    action: doc.action,
    metadata: doc.metadata,
    createdAt: doc.createdAt.toISOString(),
  };
}

export function recordToMap(
  record: Record<string, number>
): Map<string, number> {
  return new Map(Object.entries(record));
}
