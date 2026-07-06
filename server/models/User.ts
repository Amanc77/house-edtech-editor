import mongoose, { Schema, type Document as MongooseDocument, type Model } from "mongoose";
import type { AuthProvider } from "@/types";

export interface IUser extends MongooseDocument {
  name: string;
  email: string;
  passwordHash?: string | null;
  image?: string | null;
  provider: AuthProvider;
  emailVerified?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, default: null, select: false },
    image: { type: String, default: null },
    provider: {
      type: String,
      enum: ["credentials", "google"],
      default: "credentials",
    },
    emailVerified: { type: Date, default: null },
  },
  { timestamps: true }
);

export const UserModel: Model<IUser> =
  (mongoose.models.User as Model<IUser>) ??
  mongoose.model<IUser>("User", userSchema);
