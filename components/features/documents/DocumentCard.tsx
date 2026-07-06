"use client";

import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";
import {
  FileText,
  MoreHorizontal,
  Share2,
  Star,
  Trash2,
} from "lucide-react";
import type { DocumentMeta } from "@/types";
import { cn, truncate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SyncIndicator } from "@/components/features/sync/SyncIndicator";
import type { SyncStatus } from "@/types";

interface DocumentCardProps {
  document: DocumentMeta;
  syncStatus?: SyncStatus;
  starred?: boolean;
  onStar?: (id: string) => void;
  onDelete?: (id: string) => void;
  onShare?: (id: string) => void;
  className?: string;
}

export function DocumentCard({
  document,
  syncStatus = "synced",
  starred = false,
  onStar,
  onDelete,
  onShare,
  className,
}: DocumentCardProps) {
  const router = useRouter();
  const updatedAgo = formatDistanceToNow(new Date(document.updatedAt), {
    addSuffix: true,
  });

  function openDocument() {
    router.push(`/documents/${document.id}`);
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        role="button"
        tabIndex={0}
        onClick={openDocument}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openDocument();
          }
        }}
        className={cn(
          "group glass-subtle cursor-pointer transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          className
        )}
      >
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
          <div className="flex items-start gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FileText className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <CardTitle className="truncate text-base">
                {truncate(document.title || "Untitled", 40)}
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Updated {updatedAgo}
              </CardDescription>
            </div>
          </div>
            <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(event) => event.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onStar?.(document.id)}>
                <Star className={cn("h-4 w-4", starred && "fill-amber-400 text-amber-400")} />
                {starred ? "Unstar" : "Star"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onShare?.(document.id)}>
                <Share2 className="h-4 w-4" />
                Share
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => onDelete?.(document.id)}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {truncate(
              document.content.replace(/<[^>]*>/g, "").trim() || "No content yet",
              120
            )}
          </p>
          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="text-xs">
              v{document.version}
            </Badge>
            <SyncIndicator status={syncStatus} compact />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
