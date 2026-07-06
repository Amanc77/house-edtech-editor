"use client";

import type { Editor } from "@tiptap/react";
import type { SyncStatus } from "@/types";
import { cn } from "@/lib/utils";
import { SyncIndicator } from "@/components/features/sync/SyncIndicator";
import { ConnectionStatus } from "@/components/features/sync/ConnectionStatus";
import { TypingIndicator } from "@/components/features/presence/TypingIndicator";
import type { PresenceUser } from "@/types";

interface EditorStatusBarProps {
  editor: Editor | null;
  syncStatus?: SyncStatus;
  connected?: boolean;
  latency?: number;
  presenceUsers?: PresenceUser[];
  lastSaved?: Date | null;
  className?: string;
}

export function EditorStatusBar({
  editor,
  syncStatus = "synced",
  connected = true,
  latency,
  presenceUsers = [],
  lastSaved,
  className,
}: EditorStatusBarProps) {
  const characters = editor?.storage.characterCount?.characters() ?? 0;
  const words = editor?.storage.characterCount?.words() ?? 0;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-2 border-t bg-muted/30 px-4 py-1.5 text-xs text-muted-foreground",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <span>{words} words</span>
        <span>{characters} characters</span>
        {lastSaved && (
          <span>
            Saved {lastSaved.toLocaleTimeString()}
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <TypingIndicator users={presenceUsers} />
        <ConnectionStatus connected={connected} latency={latency} />
        <SyncIndicator status={syncStatus} compact />
      </div>
    </div>
  );
}
