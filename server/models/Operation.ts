import mongoose, { Schema, type Document as MongooseDocument, type Model } from "mongoose";
import type { OperationType } from "@/types";

export interface IOperation extends MongooseDocument {
  documentId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  clientId: string;
  type: OperationType;
  position: number;
  length: number;
  content: string;
  lamportClock: number;
  vectorClock: Map<string, number>;
  timestamp: number;
  checksum: string;
  applied: boolean;
  createdAt: Date;
}

const operationSchema = new Schema<IOperation>(
  {
    documentId: {
      type: Schema.Types.ObjectId,
      ref: "Document",
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    clientId: { type: String, required: true, maxlength: 128 },
    type: {
      type: String,
      enum: ["insert", "delete", "retain", "snapshot", "restore", "title_update"],
      required: true,
    },
    position: { type: Number, required: true, min: 0 },
    length: { type: Number, required: true, min: 0 },
    content: { type: String, default: "" },
    lamportClock: { type: Number, required: true, min: 0, index: true },
    vectorClock: {
      type: Map,
      of: Number,
      default: () => new Map(),
    },
    timestamp: { type: Number, required: true },
    checksum: { type: String, required: true, maxlength: 128 },
    applied: { type: Boolean, default: true, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

operationSchema.index({ documentId: 1, lamportClock: 1 });
operationSchema.index({ documentId: 1, checksum: 1 }, { unique: true });

export const OperationModel: Model<IOperation> =
  (mongoose.models.Operation as Model<IOperation>) ??
  mongoose.model<IOperation>("Operation", operationSchema);
