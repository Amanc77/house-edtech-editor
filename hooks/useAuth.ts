"use client";

import { useCallback, useEffect } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { apiPath } from "@/lib/api";
import type { UserProfile } from "@/types";
import type { LoginInput, RegisterInput } from "@/schemas/auth.schema";

export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const error = useAuthStore((s) => s.error);
  const setUser = useAuthStore((s) => s.setUser);
  const setLoading = useAuthStore((s) => s.setLoading);
  const setError = useAuthStore((s) => s.setError);
  const logoutStore = useAuthStore((s) => s.logout);

  const fetchSession = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(apiPath("/api/auth/session"), {
        credentials: "include",
      });

      if (!response.ok) {
        setUser(null);
        return null;
      }

      const result = await response.json();
      const sessionUser = result.data?.user ?? result.user ?? null;
      setUser(sessionUser as UserProfile | null);
      return sessionUser as UserProfile | null;
    } catch {
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, [setUser, setLoading]);

  const login = useCallback(
    async (credentials: LoginInput) => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(apiPath("/api/auth/login"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(credentials),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error ?? "Login failed");
        }

        const loggedInUser = result.data?.user ?? result.user;
        setUser(loggedInUser as UserProfile);
        return loggedInUser as UserProfile;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Login failed";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [setUser, setLoading, setError]
  );

  const register = useCallback(
    async (data: RegisterInput) => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(apiPath("/api/auth/register"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(data),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error ?? "Registration failed");
        }

        const profile = (result.data ?? result.user) as UserProfile;
        setUser(profile);
        return profile;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Registration failed";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [setUser, setLoading, setError]
  );

  const logout = useCallback(async () => {
    try {
      await fetch(apiPath("/api/auth/logout"), {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // clear local state regardless
    }
    logoutStore();
  }, [logoutStore]);

  useEffect(() => {
    void fetchSession();
  }, [fetchSession]);

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    fetchSession,
  };
}
