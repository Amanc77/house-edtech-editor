"use client";

import { motion } from "framer-motion";
import type { PresenceUser } from "@/types";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PresenceAvatarsProps {
  users: PresenceUser[];
  max?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "h-6 w-6 text-[10px]",
  md: "h-8 w-8 text-xs",
  lg: "h-10 w-10 text-sm",
};

export function PresenceAvatars({
  users,
  max = 5,
  size = "md",
  className,
}: PresenceAvatarsProps) {
  const visible = users.slice(0, max);
  const overflow = users.length - max;

  if (users.length === 0) return null;

  return (
    <TooltipProvider>
      <div className={cn("flex items-center -space-x-2", className)}>
        {visible.map((user, index) => (
          <Tooltip key={user.userId}>
            <TooltipTrigger asChild>
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.05 }}
                className="relative"
              >
                <Avatar
                  className={cn(
                    sizeClasses[size],
                    "ring-2 ring-background"
                  )}
                  style={{ borderColor: user.color }}
                >
                  <AvatarImage src={user.image ?? undefined} alt={user.name} />
                  <AvatarFallback
                    style={{ backgroundColor: user.color, color: "white" }}
                  >
                    {user.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {user.isTyping && (
                  <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-background" />
                )}
              </motion.div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="font-medium">{user.name}</p>
              {user.isTyping && (
                <p className="text-xs text-muted-foreground">Typing…</p>
              )}
            </TooltipContent>
          </Tooltip>
        ))}
        {overflow > 0 && (
          <div
            className={cn(
              sizeClasses[size],
              "flex items-center justify-center rounded-full bg-muted font-medium ring-2 ring-background"
            )}
          >
            +{overflow}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
