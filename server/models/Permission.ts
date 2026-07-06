import mongoose, { Schema, type Document as MongooseDocument, type Model } from "mongoose";
import type { DocumentRole } from "@/types";

export interface IPermission extends MongooseDocument {
  documentId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  role: DocumentRole;
  grantedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const permissionSchema = new Schema<IPermission>(
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
    role: {
      type: String,
      enum: ["owner", "editor", "viewer"],
      required: true,
    },
    grantedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

permissionSchema.index({ documentId: 1, userId: 1 }, { unique: true });

export const PermissionModel: Model<IPermission> =
  (mongoose.models.Permission as Model<IPermission>) ??
  mongoose.model<IPermission>("Permission", permissionSchema);
