import mongoose from "mongoose";
import { ActivityLogModel, type IActivityLog } from "@/server/models/ActivityLog";
import { toActivityLogDTO } from "@/server/repositories/mappers";
import type { ActivityLogEntry } from "@/types";

export interface CreateActivityData {
  documentId: string;
  userId: string;
  action: string;
  metadata?: Record<string, unknown>;
}

export const activityRepository = {
  async create(data: CreateActivityData): Promise<ActivityLogEntry> {
    const doc = await ActivityLogModel.create({
      documentId: new mongoose.Types.ObjectId(data.documentId),
      userId: new mongoose.Types.ObjectId(data.userId),
      action: data.action,
      metadata: data.metadata ?? {},
    });
    return toActivityLogDTO(doc);
  },

  async listByDocument(
    documentId: string,
    page = 1,
    pageSize = 50
  ): Promise<{ items: ActivityLogEntry[]; total: number }> {
    const skip = (page - 1) * pageSize;
    const query = { documentId: new mongoose.Types.ObjectId(documentId) };

    const [docs, total] = await Promise.all([
      ActivityLogModel.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean<IActivityLog[]>(),
      ActivityLogModel.countDocuments(query),
    ]);

    return {
      items: docs.map((d) => toActivityLogDTO(d as IActivityLog)),
      total,
    };
  },

  async listByUser(
    userId: string,
    page = 1,
    pageSize = 50
  ): Promise<{ items: ActivityLogEntry[]; total: number }> {
    const skip = (page - 1) * pageSize;
    const query = { userId: new mongoose.Types.ObjectId(userId) };

    const [docs, total] = await Promise.all([
      ActivityLogModel.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean<IActivityLog[]>(),
      ActivityLogModel.countDocuments(query),
    ]);

    return {
      items: docs.map((d) => toActivityLogDTO(d as IActivityLog)),
      total,
    };
  },
};
