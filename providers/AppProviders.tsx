"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { AuthProvider } from "@/providers/AuthProvider";
import { SyncProvider } from "@/providers/SyncProvider";
import { Toaster } from "sonner";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <AuthProvider>
          <SyncProvider>
            {children}
            <Toaster richColors position="top-right" closeButton />
          </SyncProvider>
        </AuthProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
