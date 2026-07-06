import mongoose from "mongoose";
import { OperationModel, type IOperation } from "@/server/models/Operation";
import { toOperationDTO } from "@/server/repositories/mappers";
import type { Operation, OperationType } from "@/types";

export interface CreateOperationData {
  documentId: string;
  userId: string;
  clientId: string;
  type: OperationType;
  position: number;
  length: number;
  content: string;
  lamportClock: number;
  vectorClock: Map<string, number>;
  timestamp: number;
  checksum: string;
  applied?: boolean;
}

export const operationRepository = {
  async findByChecksum(
    documentId: string,
    checksum: string
  ): Promise<Operation | null> {
    const doc = await OperationModel.findOne({ documentId, checksum }).lean<IOperation>();
    return doc ? toOperationDTO(doc as IOperation) : null;
  },

  async create(data: CreateOperationData): Promise<Operation> {
    const doc = await OperationModel.create({
      documentId: new mongoose.Types.ObjectId(data.documentId),
      userId: new mongoose.Types.ObjectId(data.userId),
      clientId: data.clientId,
      type: data.type,
      position: data.position,
      length: data.length,
      content: data.content,
      lamportClock: data.lamportClock,
      vectorClock: data.vectorClock,
      timestamp: data.timestamp,
      checksum: data.checksum,
      applied: data.applied ?? true,
    });
    return toOperationDTO(doc);
  },

  async createMany(data: CreateOperationData[]): Promise<Operation[]> {
    const docs = await OperationModel.insertMany(
      data.map((op) => ({
        documentId: new mongoose.Types.ObjectId(op.documentId),
        userId: new mongoose.Types.ObjectId(op.userId),
        clientId: op.clientId,
        type: op.type,
        position: op.position,
        length: op.length,
        content: op.content,
        lamportClock: op.lamportClock,
        vectorClock: op.vectorClock,
        timestamp: op.timestamp,
        checksum: op.checksum,
        applied: op.applied ?? true,
      }))
    );
    return docs.map((d) => toOperationDTO(d as IOperation));
  },

  async listByDocument(
    documentId: string,
    options: {
      sinceLamport?: number;
      limit?: number;
    } = {}
  ): Promise<Operation[]> {
    const query: Record<string, unknown> = {
      documentId: new mongoose.Types.ObjectId(documentId),
      applied: true,
    };

    if (options.sinceLamport !== undefined && options.sinceLamport > 0) {
      query.lamportClock = { $gt: options.sinceLamport };
    }

    const docs = await OperationModel.find(query)
      .sort({ lamportClock: 1 })
      .limit(options.limit ?? 100)
      .lean<IOperation[]>();

    return docs.map((d) => toOperationDTO(d as IOperation));
  },

  async countByDocument(documentId: string): Promise<number> {
    return OperationModel.countDocuments({
      documentId: new mongoose.Types.ObjectId(documentId),
    });
  },

  async getMaxLamportClock(documentId: string): Promise<number> {
    const result = await OperationModel.findOne({
      documentId: new mongoose.Types.ObjectId(documentId),
    })
      .sort({ lamportClock: -1 })
      .select("lamportClock")
      .lean<{ lamportClock: number }>();

    return result?.lamportClock ?? 0;
  },
};
