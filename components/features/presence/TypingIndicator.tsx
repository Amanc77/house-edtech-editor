"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { PresenceUser } from "@/types";

interface TypingIndicatorProps {
  users: PresenceUser[];
  className?: string;
}

export function TypingIndicator({ users, className }: TypingIndicatorProps) {
  const typingUsers = users.filter((u) => u.isTyping);

  if (typingUsers.length === 0) return null;

  const names =
    typingUsers.length === 1
      ? typingUsers[0].name
      : typingUsers.length === 2
        ? `${typingUsers[0].name} and ${typingUsers[1].name}`
        : `${typingUsers[0].name} and ${typingUsers.length - 1} others`;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 4 }}
        className={className}
      >
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <span>{names}</span>
          <span className="flex gap-0.5">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="h-1 w-1 rounded-full bg-muted-foreground"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
              />
            ))}
          </span>
        </p>
      </motion.div>
    </AnimatePresence>
  );
}
