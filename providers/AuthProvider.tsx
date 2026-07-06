"use client";

import {
  createContext,
  useContext,
  type ReactNode,
} from "react";
import { useAuth } from "@/hooks/useAuth";
import type { UserProfile } from "@/types";
import type { LoginInput, RegisterInput } from "@/schemas/auth.schema";

interface AuthContextValue {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginInput) => Promise<UserProfile>;
  register: (data: RegisterInput) => Promise<UserProfile>;
  logout: () => Promise<void>;
  fetchSession: () => Promise<UserProfile | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();

  return (
    <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
  );
}

export function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within AuthProvider");
  }
  return context;
}

export function AuthGate({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { isAuthenticated, isLoading } = useAuthContext();

  if (isLoading) {
    return fallback ?? null;
  }

  if (!isAuthenticated) {
    return fallback ?? null;
  }

  return <>{children}</>;
}
