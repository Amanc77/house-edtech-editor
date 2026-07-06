import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { authConfig } from "@/lib/auth.config";
import { connectDB } from "@/server/db/connection";
import { userRepository } from "@/server/repositories/user.repository";
import { loginSchema } from "@/schemas/auth.schema";
import type { AuthProvider } from "@/types";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      image?: string | null;
    };
  }

  interface User {
    id: string;
    provider?: AuthProvider;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    provider?: AuthProvider;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        await connectDB();

        const user = await userRepository.findByEmail(parsed.data.email, true);
        if (!user?.passwordHash) return null;

        const isValid = await bcrypt.compare(
          parsed.data.password,
          user.passwordHash
        );
        if (!isValid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          provider: "credentials" as AuthProvider,
        };
      },
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID ?? process.env.AUTH_GOOGLE_ID,
      clientSecret:
        process.env.GOOGLE_CLIENT_SECRET ?? process.env.AUTH_GOOGLE_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account }) {
      if (account?.provider === "google" && user.email) {
        await connectDB();
        const existing = await userRepository.findByEmail(user.email);
        if (!existing) {
          await userRepository.create({
            name: user.name ?? user.email.split("@")[0],
            email: user.email,
            image: user.image,
            provider: "google",
            emailVerified: new Date(),
          });
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        if (account?.provider === "google" && user.email) {
          await connectDB();
          const dbUser = await userRepository.findByEmail(user.email);
          if (dbUser) {
            token.id = dbUser.id;
            token.name = dbUser.name;
            token.email = dbUser.email;
            token.picture = dbUser.image;
            token.provider = "google";
          }
        } else {
          token.id = user.id;
          token.provider = user.provider ?? "credentials";
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token.id) {
        session.user.id = token.id as string;
      }
      if (token.name) session.user.name = token.name;
      if (token.email) session.user.email = token.email;
      if (token.picture !== undefined) {
        session.user.image = token.picture as string | null;
      }
      return session;
    },
  },
  secret: process.env.AUTH_SECRET,
});

export async function getSessionUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return {
    userId: session.user.id,
    email: session.user.email,
    name: session.user.name,
    image: session.user.image,
  };
}
