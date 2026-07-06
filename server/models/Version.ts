import mongoose, { Schema, type Document as MongooseDocument, type Model } from "mongoose";

export interface IVersion extends MongooseDocument {
  documentId: mongoose.Types.ObjectId;
  versionNumber: number;
  title: string;
  content: string;
  snapshotBy: mongoose.Types.ObjectId;
  label?: string | null;
  checksum: string;
  createdAt: Date;
}

const versionSchema = new Schema<IVersion>(
  {
    documentId: {
      type: Schema.Types.ObjectId,
      ref: "Document",
      required: true,
      index: true,
    },
    versionNumber: { type: Number, required: true, min: 0 },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    content: { type: String, default: "" },
    snapshotBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    label: { type: String, default: null, maxlength: 200 },
    checksum: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

versionSchema.index({ documentId: 1, versionNumber: -1 }, { unique: true });

export const VersionModel: Model<IVersion> =
  (mongoose.models.Version as Model<IVersion>) ??
  mongoose.model<IVersion>("Version", versionSchema);
