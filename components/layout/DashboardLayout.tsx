"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Sidebar } from "@/components/layout/Sidebar";
import { OfflineBanner } from "@/components/features/sync/OfflineBanner";
import type { SyncStatus } from "@/types";

interface DashboardLayoutProps {
  children: React.ReactNode;
  syncStatus?: SyncStatus;
  isOnline?: boolean;
  className?: string;
  hideFooter?: boolean;
}

export function DashboardLayout({
  children,
  syncStatus = "synced",
  isOnline = true,
  className,
  hideFooter = false,
}: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col">
      {!isOnline && <OfflineBanner />}
      <Header
        showMenuButton
        onMenuClick={() => setSidebarOpen(true)}
        syncStatus={syncStatus}
      />
      <div className="flex flex-1">
        <Sidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <motion.main
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className={cn("flex-1 overflow-auto p-4 lg:p-6", className)}
        >
          {children}
        </motion.main>
      </div>
      {!hideFooter && <Footer />}
    </div>
  );
}
