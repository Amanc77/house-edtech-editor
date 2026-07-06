import { connectDB } from "@/server/db/connection";
import { activityRepository } from "@/server/repositories/activity.repository";
import { documentRepository } from "@/server/repositories/document.repository";
import { permissionRepository } from "@/server/repositories/permission.repository";
import { permissionService } from "@/server/services/permission.service";
import {
  computeChecksum,
  sanitizeContent,
  sanitizeTitle,
} from "@/lib/security";
import type {
  CreateDocumentInput,
  Document,
  PaginatedResponse,
  PermissionWithUser,
  ShareDocumentInput,
  UpdateDocumentInput,
} from "@/types";
import type { ListDocumentsQuery } from "@/schemas/document.schema";

export class DocumentServiceError extends Error {
  constructor(
    message: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = "DocumentServiceError";
  }
}

export const documentService = {
  async create(userId: string, input: CreateDocumentInput): Promise<Document> {
    await connectDB();

    const title = sanitizeTitle(input.title);
    const content = sanitizeContent(input.content ?? "");
    const checksum = computeChecksum(content);

    const document = await documentRepository.create({
      title,
      content,
      ownerId: userId,
      checksum,
    });

    await permissionRepository.create({
      documentId: document.id,
      userId,
      role: "owner",
      grantedBy: userId,
    });

    await activityRepository.create({
      documentId: document.id,
      userId,
      action: "document.created",
      metadata: { title },
    });

    return document;
  },

  async getById(documentId: string, userId: string): Promise<Document> {
    await connectDB();

    const document = await documentRepository.findById(documentId);
    if (!document) {
      throw new DocumentServiceError("Document not found", 404);
    }

    await permissionService.requireRead(documentId, userId, document.ownerId);
    return document;
  },

  async update(
    documentId: string,
    userId: string,
    input: UpdateDocumentInput
  ): Promise<Document> {
    await connectDB();

    const document = await documentRepository.findById(documentId);
    if (!document) {
      throw new DocumentServiceError("Document not found", 404);
    }

    await permissionService.requireWrite(documentId, userId, document.ownerId);

    const updates: Parameters<typeof documentRepository.update>[1] = {};

    if (input.title !== undefined) {
      updates.title = sanitizeTitle(input.title);
    }
    if (input.content !== undefined) {
      updates.content = sanitizeContent(input.content);
      updates.checksum = computeChecksum(updates.content);
      updates.version = document.version + 1;
      updates.lastSyncedAt = new Date();
    }

    const updated = await documentRepository.update(documentId, updates);
    if (!updated) {
      throw new DocumentServiceError("Failed to update document", 500);
    }

    await activityRepository.create({
      documentId,
      userId,
      action: "document.updated",
      metadata: { fields: Object.keys(input) },
    });

    return updated;
  },

  async delete(documentId: string, userId: string): Promise<void> {
    await connectDB();

    const document = await documentRepository.findById(documentId);
    if (!document) {
      throw new DocumentServiceError("Document not found", 404);
    }

    await permissionService.requirePermission(
      documentId,
      userId,
      "delete",
      document.ownerId
    );

    await Promise.all([
      permissionRepository.deleteAllForDocument(documentId),
      documentRepository.delete(documentId),
    ]);

    await activityRepository.create({
      documentId,
      userId,
      action: "document.deleted",
    });
  },

  async list(
    userId: string,
    query: ListDocumentsQuery
  ): Promise<PaginatedResponse<Document>> {
    await connectDB();

    const owned = await documentRepository.listByOwner({
      userId,
      page: query.page,
      pageSize: query.pageSize,
      search: query.search,
      archived: query.archived,
    });

    const sharedDocIds = await permissionRepository.listDocumentIdsForUser(userId);
    const ownedIds = new Set(owned.items.map((d) => d.id));
    const uniqueSharedIds = sharedDocIds.filter((id) => !ownedIds.has(id));

    let sharedItems: Document[] = [];
    if (uniqueSharedIds.length > 0) {
      const shared = await documentRepository.listAccessible(uniqueSharedIds, {
        page: 1,
        pageSize: query.pageSize,
        search: query.search,
        archived: query.archived,
      });
      sharedItems = shared.items;
    }

    const allItems = [...owned.items, ...sharedItems].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const start = (page - 1) * pageSize;
    const items = allItems.slice(start, start + pageSize);

    return {
      items,
      total: owned.total + sharedItems.length,
      page,
      pageSize,
      hasMore: start + pageSize < owned.total + sharedItems.length,
    };
  },

  async share(
    documentId: string,
    userId: string,
    input: ShareDocumentInput
  ): Promise<PermissionWithUser> {
    await connectDB();

    const document = await documentRepository.findById(documentId);
    if (!document) {
      throw new DocumentServiceError("Document not found", 404);
    }

    await permissionService.requirePermission(
      documentId,
      userId,
      "share",
      document.ownerId
    );

    const targetUser = await permissionRepository.findUserByEmail(input.email);
    if (!targetUser) {
      throw new DocumentServiceError("User not found with that email", 404);
    }

    const targetUserId = targetUser._id.toString();
    if (targetUserId === userId) {
      throw new DocumentServiceError("Cannot share with yourself", 400);
    }

    const existing = await permissionRepository.findByDocumentAndUser(
      documentId,
      targetUserId
    );

    let permission;
    if (existing) {
      permission = await permissionRepository.updateRole(
        documentId,
        targetUserId,
        input.role
      );
    } else {
      permission = await permissionRepository.create({
        documentId,
        userId: targetUserId,
        role: input.role,
        grantedBy: userId,
      });
    }

    if (!permission) {
      throw new DocumentServiceError("Failed to share document", 500);
    }

    await activityRepository.create({
      documentId,
      userId,
      action: "document.shared",
      metadata: { targetEmail: input.email, role: input.role },
    });

    return {
      ...permission,
      name: targetUser.name,
      email: targetUser.email,
    };
  },

  async listPermissions(
    documentId: string,
    userId: string
  ): Promise<PermissionWithUser[]> {
    await connectDB();

    const document = await documentRepository.findById(documentId);
    if (!document) {
      throw new DocumentServiceError("Document not found", 404);
    }

    await permissionService.requireRead(documentId, userId, document.ownerId);
    return permissionRepository.listByDocument(documentId);
  },

  async removePermission(
    documentId: string,
    userId: string,
    targetUserId: string
  ): Promise<void> {
    await connectDB();

    const document = await documentRepository.findById(documentId);
    if (!document) {
      throw new DocumentServiceError("Document not found", 404);
    }

    await permissionService.requirePermission(
      documentId,
      userId,
      "share",
      document.ownerId
    );

    if (targetUserId === document.ownerId) {
      throw new DocumentServiceError("Cannot remove owner permission", 400);
    }

    const removed = await permissionRepository.delete(documentId, targetUserId);
    if (!removed) {
      throw new DocumentServiceError("Permission not found", 404);
    }

    await activityRepository.create({
      documentId,
      userId,
      action: "permission.removed",
      metadata: { targetUserId },
    });
  },

  async archive(documentId: string, userId: string): Promise<Document> {
    await connectDB();

    const document = await documentRepository.findById(documentId);
    if (!document) {
      throw new DocumentServiceError("Document not found", 404);
    }

    await permissionService.requireWrite(documentId, userId, document.ownerId);

    const updated = await documentRepository.update(documentId, {
      isArchived: true,
    });

    if (!updated) {
      throw new DocumentServiceError("Failed to archive document", 500);
    }

    return updated;
  },
};
