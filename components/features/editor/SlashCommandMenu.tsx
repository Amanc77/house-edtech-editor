"use client";

import { motion } from "framer-motion";
import {
  Code,
  Heading1,
  Heading2,
  Heading3,
  Image as ImageIcon,
  List,
  ListOrdered,
  ListTodo,
  Minus,
  Quote,
  Table,
  Text,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface SlashCommandItem {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  command: () => void;
}

interface SlashCommandMenuProps {
  items: SlashCommandItem[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  position: { top: number; left: number } | null;
  className?: string;
}

export function SlashCommandMenu({
  items,
  selectedIndex,
  onSelect,
  position,
  className,
}: SlashCommandMenuProps) {
  if (!position || items.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "fixed z-50 w-72 overflow-hidden rounded-lg border bg-popover shadow-lg",
        className
      )}
      style={{ top: position.top, left: position.left }}
    >
      <div className="p-1">
        <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
          Basic blocks
        </p>
        {items.map((item, index) => {
          const Icon = item.icon;
          return (
            <button
              key={item.title}
              type="button"
              className={cn(
                "flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-sm transition-colors",
                index === selectedIndex
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-accent/50"
              )}
              onClick={() => onSelect(index)}
              onMouseEnter={() => onSelect(index)}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-md border bg-background">
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <p className="font-medium">{item.title}</p>
                <p className="text-xs text-muted-foreground">
                  {item.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}

export function getDefaultSlashCommands(
  callbacks: Record<string, () => void>
): SlashCommandItem[] {
  return [
    {
      title: "Text",
      description: "Plain paragraph",
      icon: Text,
      command: callbacks.text ?? (() => {}),
    },
    {
      title: "Heading 1",
      description: "Large section heading",
      icon: Heading1,
      command: callbacks.h1 ?? (() => {}),
    },
    {
      title: "Heading 2",
      description: "Medium section heading",
      icon: Heading2,
      command: callbacks.h2 ?? (() => {}),
    },
    {
      title: "Heading 3",
      description: "Small section heading",
      icon: Heading3,
      command: callbacks.h3 ?? (() => {}),
    },
    {
      title: "Bullet List",
      description: "Unordered list",
      icon: List,
      command: callbacks.bulletList ?? (() => {}),
    },
    {
      title: "Numbered List",
      description: "Ordered list",
      icon: ListOrdered,
      command: callbacks.orderedList ?? (() => {}),
    },
    {
      title: "Task List",
      description: "Checklist with tasks",
      icon: ListTodo,
      command: callbacks.taskList ?? (() => {}),
    },
    {
      title: "Quote",
      description: "Blockquote",
      icon: Quote,
      command: callbacks.blockquote ?? (() => {}),
    },
    {
      title: "Code Block",
      description: "Syntax highlighted code",
      icon: Code,
      command: callbacks.codeBlock ?? (() => {}),
    },
    {
      title: "Divider",
      description: "Horizontal rule",
      icon: Minus,
      command: callbacks.hr ?? (() => {}),
    },
    {
      title: "Image",
      description: "Insert an image",
      icon: ImageIcon,
      command: callbacks.image ?? (() => {}),
    },
    {
      title: "Table",
      description: "3×3 table with header",
      icon: Table,
      command: callbacks.table ?? (() => {}),
    },
  ];
}
