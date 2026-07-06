import { computeChecksum, sanitizeContent, sanitizeTitle } from "@/lib/security";
import { connectDB } from "@/server/db/connection";
import { activityRepository } from "@/server/repositories/activity.repository";
import { documentRepository } from "@/server/repositories/document.repository";
import { versionRepository } from "@/server/repositories/version.repository";
import { permissionService } from "@/server/services/permission.service";
import type { PaginatedResponse, Version } from "@/types";
import type {
  CreateVersionInput,
  ListVersionsQuery,
} from "@/schemas/version.schema";

export class VersionServiceError extends Error {
  constructor(
    message: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = "VersionServiceError";
  }
}

export const versionService = {
  async createSnapshot(
    documentId: string,
    userId: string,
    input: CreateVersionInput
  ): Promise<Version> {
    await connectDB();

    const document = await documentRepository.findById(documentId);
    if (!document) {
      throw new VersionServiceError("Document not found", 404);
    }

    await permissionService.requirePermission(
      documentId,
      userId,
      "snapshot",
      document.ownerId
    );

    const latestNumber = await versionRepository.getLatestVersionNumber(documentId);
    const versionNumber = latestNumber + 1;
    const content = sanitizeContent(document.content);
    const checksum = computeChecksum(content);

    const version = await versionRepository.create({
      documentId,
      versionNumber,
      title: document.title,
      content,
      snapshotBy: userId,
      label: input.label ? sanitizeTitle(input.label) : undefined,
      checksum,
    });

    await activityRepository.create({
      documentId,
      userId,
      action: "version.created",
      metadata: { versionNumber, label: input.label },
    });

    return version;
  },

  async listVersions(
    documentId: string,
    userId: string,
    query: ListVersionsQuery
  ): Promise<PaginatedResponse<Version>> {
    await connectDB();

    const document = await documentRepository.findById(documentId);
    if (!document) {
      throw new VersionServiceError("Document not found", 404);
    }

    await permissionService.requireRead(documentId, userId, document.ownerId);

    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const result = await versionRepository.listByDocument(
      documentId,
      page,
      pageSize
    );

    return {
      items: result.items,
      total: result.total,
      page,
      pageSize,
      hasMore: page * pageSize < result.total,
    };
  },

  async getVersion(
    documentId: string,
    versionId: string,
    userId: string
  ): Promise<Version> {
    await connectDB();

    const document = await documentRepository.findById(documentId);
    if (!document) {
      throw new VersionServiceError("Document not found", 404);
    }

    await permissionService.requireRead(documentId, userId, document.ownerId);

    const version = await versionRepository.findById(versionId);
    if (!version || version.documentId !== documentId) {
      throw new VersionServiceError("Version not found", 404);
    }

    return version;
  },

  async restoreVersion(
    documentId: string,
    userId: string,
    versionId: string
  ): Promise<{ document: Awaited<ReturnType<typeof documentRepository.findById>>; version: Version }> {
    await connectDB();

    const document = await documentRepository.findById(documentId);
    if (!document) {
      throw new VersionServiceError("Document not found", 404);
    }

    await permissionService.requirePermission(
      documentId,
      userId,
      "restore",
      document.ownerId
    );

    const version = await versionRepository.findById(versionId);
    if (!version || version.documentId !== documentId) {
      throw new VersionServiceError("Version not found", 404);
    }

    const content = sanitizeContent(version.content);
    const checksum = computeChecksum(content);

    const updated = await documentRepository.update(documentId, {
      content,
      title: version.title,
      version: document.version + 1,
      checksum,
      lastSyncedAt: new Date(),
    });

    if (!updated) {
      throw new VersionServiceError("Failed to restore version", 500);
    }

    await activityRepository.create({
      documentId,
      userId,
      action: "version.restored",
      metadata: { versionId, versionNumber: version.versionNumber },
    });

    return { document: updated, version };
  },
};
