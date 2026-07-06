import mongoose, { Schema, type Document as MongooseDocument, type Model } from "mongoose";

export interface IActivityLog extends MongooseDocument {
  documentId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  action: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const activityLogSchema = new Schema<IActivityLog>(
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
    action: { type: String, required: true, maxlength: 100 },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

activityLogSchema.index({ documentId: 1, createdAt: -1 });

export const ActivityLogModel: Model<IActivityLog> =
  (mongoose.models.ActivityLog as Model<IActivityLog>) ??
  mongoose.model<IActivityLog>("ActivityLog", activityLogSchema);
