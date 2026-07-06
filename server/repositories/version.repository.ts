import mongoose from "mongoose";
import { VersionModel, type IVersion } from "@/server/models/Version";
import { toVersionDTO } from "@/server/repositories/mappers";
import type { Version } from "@/types";

export interface CreateVersionData {
  documentId: string;
  versionNumber: number;
  title: string;
  content: string;
  snapshotBy: string;
  label?: string;
  checksum: string;
}

export const versionRepository = {
  async findById(id: string): Promise<Version | null> {
    if (!mongoose.isValidObjectId(id)) return null;
    const doc = await VersionModel.findById(id).lean<IVersion>();
    return doc ? toVersionDTO(doc as IVersion) : null;
  },

  async findByDocumentAndNumber(
    documentId: string,
    versionNumber: number
  ): Promise<Version | null> {
    const doc = await VersionModel.findOne({ documentId, versionNumber }).lean<IVersion>();
    return doc ? toVersionDTO(doc as IVersion) : null;
  },

  async create(data: CreateVersionData): Promise<Version> {
    const doc = await VersionModel.create({
      documentId: new mongoose.Types.ObjectId(data.documentId),
      versionNumber: data.versionNumber,
      title: data.title,
      content: data.content,
      snapshotBy: new mongoose.Types.ObjectId(data.snapshotBy),
      label: data.label ?? null,
      checksum: data.checksum,
    });
    return toVersionDTO(doc);
  },

  async listByDocument(
    documentId: string,
    page = 1,
    pageSize = 20
  ): Promise<{ items: Version[]; total: number }> {
    const skip = (page - 1) * pageSize;
    const query = { documentId: new mongoose.Types.ObjectId(documentId) };

    const [docs, total] = await Promise.all([
      VersionModel.find(query)
        .sort({ versionNumber: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean<IVersion[]>(),
      VersionModel.countDocuments(query),
    ]);

    return {
      items: docs.map((d) => toVersionDTO(d as IVersion)),
      total,
    };
  },

  async getLatestVersionNumber(documentId: string): Promise<number> {
    const latest = await VersionModel.findOne({
      documentId: new mongoose.Types.ObjectId(documentId),
    })
      .sort({ versionNumber: -1 })
      .select("versionNumber")
      .lean<{ versionNumber: number }>();

    return latest?.versionNumber ?? 0;
  },

  async countByDocument(documentId: string): Promise<number> {
    return VersionModel.countDocuments({
      documentId: new mongoose.Types.ObjectId(documentId),
    });
  },
};
