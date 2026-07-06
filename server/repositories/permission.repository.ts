import mongoose from "mongoose";
import { PermissionModel, type IPermission } from "@/server/models/Permission";
import { UserModel } from "@/server/models/User";
import { toPermissionDTO } from "@/server/repositories/mappers";
import type { DocumentRole, Permission, PermissionWithUser } from "@/types";

export interface CreatePermissionData {
  documentId: string;
  userId: string;
  role: DocumentRole;
  grantedBy: string;
}

export const permissionRepository = {
  async findByDocumentAndUser(
    documentId: string,
    userId: string
  ): Promise<Permission | null> {
    const doc = await PermissionModel.findOne({
      documentId: new mongoose.Types.ObjectId(documentId),
      userId: new mongoose.Types.ObjectId(userId),
    }).lean<IPermission>();

    return doc ? toPermissionDTO(doc as IPermission) : null;
  },

  async create(data: CreatePermissionData): Promise<Permission> {
    const doc = await PermissionModel.create({
      documentId: new mongoose.Types.ObjectId(data.documentId),
      userId: new mongoose.Types.ObjectId(data.userId),
      role: data.role,
      grantedBy: new mongoose.Types.ObjectId(data.grantedBy),
    });
    return toPermissionDTO(doc);
  },

  async updateRole(
    documentId: string,
    userId: string,
    role: DocumentRole
  ): Promise<Permission | null> {
    const doc = await PermissionModel.findOneAndUpdate(
      {
        documentId: new mongoose.Types.ObjectId(documentId),
        userId: new mongoose.Types.ObjectId(userId),
      },
      { $set: { role } },
      { new: true, runValidators: true }
    ).lean<IPermission>();

    return doc ? toPermissionDTO(doc as IPermission) : null;
  },

  async delete(documentId: string, userId: string): Promise<boolean> {
    const result = await PermissionModel.deleteOne({
      documentId: new mongoose.Types.ObjectId(documentId),
      userId: new mongoose.Types.ObjectId(userId),
    });
    return result.deletedCount > 0;
  },

  async listByDocument(documentId: string): Promise<PermissionWithUser[]> {
    const permissions = await PermissionModel.find({
      documentId: new mongoose.Types.ObjectId(documentId),
    })
      .populate<{ userId: { _id: mongoose.Types.ObjectId; name: string; email: string } }>(
        "userId",
        "name email"
      )
      .lean<
        (IPermission & {
          userId: { _id: mongoose.Types.ObjectId; name: string; email: string };
        })[]
      >();

    return permissions.map((p) => ({
      ...toPermissionDTO(p as IPermission),
      name: p.userId?.name,
      email: p.userId?.email,
    }));
  },

  async listDocumentIdsForUser(userId: string): Promise<string[]> {
    const permissions = await PermissionModel.find({
      userId: new mongoose.Types.ObjectId(userId),
    })
      .select("documentId")
      .lean<{ documentId: mongoose.Types.ObjectId }[]>();

    return permissions.map((p) => p.documentId.toString());
  },

  async deleteAllForDocument(documentId: string): Promise<number> {
    const result = await PermissionModel.deleteMany({
      documentId: new mongoose.Types.ObjectId(documentId),
    });
    return result.deletedCount;
  },

  async findUserByEmail(email: string) {
    return UserModel.findOne({ email: email.toLowerCase() })
      .select("_id name email")
      .lean<{ _id: mongoose.Types.ObjectId; name: string; email: string }>();
  },
};
