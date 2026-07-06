import { UserModel, type IUser } from "@/server/models/User";
import { toUserDTO } from "@/server/repositories/mappers";
import type { AuthProvider, User } from "@/types";

export interface CreateUserData {
  name: string;
  email: string;
  passwordHash?: string | null;
  image?: string | null;
  provider?: AuthProvider;
  emailVerified?: Date | null;
}

export interface UpdateUserData {
  name?: string;
  image?: string | null;
  passwordHash?: string | null;
  emailVerified?: Date | null;
}

export const userRepository = {
  async findById(id: string): Promise<User | null> {
    const doc = await UserModel.findById(id).lean<IUser>();
    return doc ? toUserDTO(doc as IUser) : null;
  },

  async findByEmail(email: string, includePassword = false): Promise<(User & { passwordHash?: string | null }) | null> {
    const query = UserModel.findOne({ email: email.toLowerCase() });
    if (includePassword) {
      query.select("+passwordHash");
    }
    const doc = await query.lean<IUser & { passwordHash?: string }>();
    if (!doc) return null;
    return {
      ...toUserDTO(doc as IUser),
      passwordHash: doc.passwordHash ?? null,
    };
  },

  async create(data: CreateUserData): Promise<User> {
    const doc = await UserModel.create({
      name: data.name,
      email: data.email.toLowerCase(),
      passwordHash: data.passwordHash ?? null,
      image: data.image ?? null,
      provider: data.provider ?? "credentials",
      emailVerified: data.emailVerified ?? null,
    });
    return toUserDTO(doc);
  },

  async update(id: string, data: UpdateUserData): Promise<User | null> {
    const doc = await UserModel.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true }
    ).lean<IUser>();
    return doc ? toUserDTO(doc as IUser) : null;
  },

  async findOrCreateByEmail(
    email: string,
    defaults: Omit<CreateUserData, "email">
  ): Promise<User> {
    const existing = await this.findByEmail(email);
    if (existing) return existing;
    return this.create({ ...defaults, email });
  },

  async existsByEmail(email: string): Promise<boolean> {
    const count = await UserModel.countDocuments({ email: email.toLowerCase() });
    return count > 0;
  },
};
