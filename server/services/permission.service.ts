import { ROLE_PERMISSIONS } from "@/constants";
import { connectDB } from "@/server/db/connection";
import { permissionRepository } from "@/server/repositories/permission.repository";
import type { DocumentRole, PermissionAction } from "@/types";

export class PermissionServiceError extends Error {
  constructor(
    message: string,
    public statusCode: number = 403
  ) {
    super(message);
    this.name = "PermissionServiceError";
  }
}

export const permissionService = {
  async getUserRole(
    documentId: string,
    userId: string,
    ownerId?: string
  ): Promise<DocumentRole | null> {
    await connectDB();

    if (ownerId && ownerId === userId) {
      return "owner";
    }

    const permission = await permissionRepository.findByDocumentAndUser(
      documentId,
      userId
    );
    return permission?.role ?? null;
  },

  async canPerform(
    documentId: string,
    userId: string,
    action: PermissionAction,
    ownerId?: string
  ): Promise<boolean> {
    const role = await this.getUserRole(documentId, userId, ownerId);
    if (!role) return false;

    const permissions = ROLE_PERMISSIONS[role];
    return (permissions as readonly string[]).includes(action);
  },

  async requirePermission(
    documentId: string,
    userId: string,
    action: PermissionAction,
    ownerId?: string
  ): Promise<DocumentRole> {
    const role = await this.getUserRole(documentId, userId, ownerId);
    if (!role) {
      throw new PermissionServiceError("Access denied", 403);
    }

    const canPerform = await this.canPerform(
      documentId,
      userId,
      action,
      ownerId
    );
    if (!canPerform) {
      throw new PermissionServiceError(
        `Role '${role}' cannot perform '${action}'`,
        403
      );
    }

    return role;
  },

  async canWrite(
    documentId: string,
    userId: string,
    ownerId?: string
  ): Promise<boolean> {
    return this.canPerform(documentId, userId, "write", ownerId);
  },

  async requireWrite(
    documentId: string,
    userId: string,
    ownerId?: string
  ): Promise<DocumentRole> {
    return this.requirePermission(documentId, userId, "write", ownerId);
  },

  async requireRead(
    documentId: string,
    userId: string,
    ownerId?: string
  ): Promise<DocumentRole> {
    return this.requirePermission(documentId, userId, "read", ownerId);
  },
};
