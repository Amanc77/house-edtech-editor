import mongoose from "mongoose";
import { DocumentModel, type IDocument } from "@/server/models/Document";
import { toDocumentDTO } from "@/server/repositories/mappers";
import type { Document } from "@/types";

export interface CreateDocumentData {
  title: string;
  content?: string;
  ownerId: string;
  checksum?: string;
}

export interface UpdateDocumentData {
  title?: string;
  content?: string;
  version?: number;
  lamportClock?: number;
  vectorClock?: Map<string, number>;
  checksum?: string;
  isArchived?: boolean;
  lastSyncedAt?: Date;
}

export interface ListDocumentsFilter {
  userId: string;
  page?: number;
  pageSize?: number;
  search?: string;
  archived?: boolean;
}

export const documentRepository = {
  async findById(id: string): Promise<Document | null> {
    if (!mongoose.isValidObjectId(id)) return null;
    const doc = await DocumentModel.findById(id).lean<IDocument>();
    return doc ? toDocumentDTO(doc as IDocument) : null;
  },

  async findByIdForUpdate(id: string): Promise<IDocument | null> {
    if (!mongoose.isValidObjectId(id)) return null;
    return DocumentModel.findById(id);
  },

  async create(data: CreateDocumentData): Promise<Document> {
    if (!mongoose.isValidObjectId(data.ownerId)) {
      throw new Error("Invalid owner ID");
    }

    const doc = await DocumentModel.create({
      title: data.title,
      content: data.content ?? "",
      ownerId: new mongoose.Types.ObjectId(data.ownerId),
      checksum: data.checksum ?? "",
      version: 0,
      lamportClock: 0,
      vectorClock: new Map(),
    });
    return toDocumentDTO(doc);
  },

  async update(id: string, data: UpdateDocumentData): Promise<Document | null> {
    if (!mongoose.isValidObjectId(id)) return null;
    const doc = await DocumentModel.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true }
    ).lean<IDocument>();
    return doc ? toDocumentDTO(doc as IDocument) : null;
  },

  async delete(id: string): Promise<boolean> {
    if (!mongoose.isValidObjectId(id)) return false;
    const result = await DocumentModel.deleteOne({ _id: id });
    return result.deletedCount > 0;
  },

  async listByOwner(filter: ListDocumentsFilter): Promise<{
    items: Document[];
    total: number;
  }> {
    if (!mongoose.isValidObjectId(filter.userId)) {
      return { items: [], total: 0 };
    }

    const page = filter.page ?? 1;
    const pageSize = filter.pageSize ?? 20;
    const skip = (page - 1) * pageSize;

    const query: Record<string, unknown> = {
      ownerId: new mongoose.Types.ObjectId(filter.userId),
    };

    if (filter.archived !== undefined) {
      query.isArchived = filter.archived;
    }

    if (filter.search) {
      query.$text = { $search: filter.search };
    }

    const [docs, total] = await Promise.all([
      DocumentModel.find(query)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean<IDocument[]>(),
      DocumentModel.countDocuments(query),
    ]);

    return {
      items: docs.map((d) => toDocumentDTO(d as IDocument)),
      total,
    };
  },

  async listAccessible(
    documentIds: string[],
    filter: Omit<ListDocumentsFilter, "userId">
  ): Promise<{ items: Document[]; total: number }> {
    const page = filter.page ?? 1;
    const pageSize = filter.pageSize ?? 20;
    const skip = (page - 1) * pageSize;

    const objectIds = documentIds
      .filter((id) => mongoose.isValidObjectId(id))
      .map((id) => new mongoose.Types.ObjectId(id));

    if (objectIds.length === 0) {
      return { items: [], total: 0 };
    }

    const query: Record<string, unknown> = {
      _id: { $in: objectIds },
    };

    if (filter.archived !== undefined) {
      query.isArchived = filter.archived;
    }

    if (filter.search) {
      query.$text = { $search: filter.search };
    }

    const [docs, total] = await Promise.all([
      DocumentModel.find(query)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean<IDocument[]>(),
      DocumentModel.countDocuments(query),
    ]);

    return {
      items: docs.map((d) => toDocumentDTO(d as IDocument)),
      total,
    };
  },
};
