import bcrypt from "bcryptjs";
import { connectDB } from "@/server/db/connection";
import { userRepository } from "@/server/repositories/user.repository";
import type { LoginInput, RegisterInput } from "@/schemas/auth.schema";
import type { UserProfile } from "@/types";

const SALT_ROUNDS = 12;

export class AuthServiceError extends Error {
  constructor(
    message: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = "AuthServiceError";
  }
}

export const authService = {
  async register(input: RegisterInput): Promise<UserProfile> {
    await connectDB();

    const exists = await userRepository.existsByEmail(input.email);
    if (exists) {
      throw new AuthServiceError("Email already registered", 409);
    }

    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
    const user = await userRepository.create({
      name: input.name,
      email: input.email,
      passwordHash,
      provider: "credentials",
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
    };
  },

  async validateCredentials(input: LoginInput): Promise<UserProfile | null> {
    await connectDB();

    const user = await userRepository.findByEmail(input.email, true);
    if (!user?.passwordHash) return null;

    const isValid = await bcrypt.compare(input.password, user.passwordHash);
    if (!isValid) return null;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
    };
  },

  async getProfile(userId: string): Promise<UserProfile | null> {
    await connectDB();
    const user = await userRepository.findById(userId);
    if (!user) return null;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
    };
  },

  async updateProfile(
    userId: string,
    data: { name?: string; image?: string | null }
  ): Promise<UserProfile | null> {
    await connectDB();
    const user = await userRepository.update(userId, data);
    if (!user) return null;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
    };
  },
};
