"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  FilePlus,
  FileText,
  LayoutDashboard,
  Settings,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { CreateDocumentDialog } from "@/components/features/documents/CreateDocumentDialog";

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
  className?: string;
}

const mainNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/documents", label: "All Documents", icon: FileText },
];

const secondaryNav = [
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar({ open = true, onClose, className }: SidebarProps) {
  const pathname = usePathname();

  const navContent = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between p-4 lg:p-3">
        <CreateDocumentDialog
          trigger={
            <Button className="w-full justify-start gap-2" size="sm">
              <FilePlus className="h-4 w-4" />
              New Document
            </Button>
          }
        />
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            className="ml-2 lg:hidden"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1 px-3">
        <nav className="space-y-1">
          {mainNav.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                pathname === href || pathname.startsWith(href + "/")
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          ))}
        </nav>

        <Separator className="my-4" />

        <nav className="space-y-1">
          {secondaryNav.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                pathname === href
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          ))}
        </nav>
      </ScrollArea>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden lg:flex w-[var(--sidebar-width)] shrink-0 flex-col border-r bg-card/50",
          className
        )}
      >
        {navContent}
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && onClose && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 lg:hidden"
              onClick={onClose}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className={cn(
                "fixed inset-y-0 left-0 z-50 w-[var(--sidebar-width)] border-r bg-card lg:hidden",
                className
              )}
            >
              {navContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
