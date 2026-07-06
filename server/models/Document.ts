import mongoose, { Schema, type Document as MongooseDocument, type Model } from "mongoose";

export interface IDocument extends MongooseDocument {
  title: string;
  ownerId: mongoose.Types.ObjectId;
  content: string;
  version: number;
  lamportClock: number;
  vectorClock: Map<string, number>;
  checksum: string;
  isArchived: boolean;
  lastSyncedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const documentSchema = new Schema<IDocument>(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    content: { type: String, default: "" },
    version: { type: Number, default: 0, min: 0 },
    lamportClock: { type: Number, default: 0, min: 0 },
    vectorClock: {
      type: Map,
      of: Number,
      default: () => new Map(),
    },
    checksum: { type: String, default: "" },
    isArchived: { type: Boolean, default: false, index: true },
    lastSyncedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

documentSchema.index({ ownerId: 1, updatedAt: -1 });
documentSchema.index({ title: "text" });

export const DocumentModel: Model<IDocument> =
  (mongoose.models.Document as Model<IDocument>) ??
  mongoose.model<IDocument>("Document", documentSchema);
