"use client";

import { useState } from "react";
import { Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

const EMOJI_CATEGORIES: { label: string; emojis: string[] }[] = [
  {
    label: "Smileys",
    emojis: ["😀", "😃", "😄", "😁", "😅", "😂", "🤣", "😊", "😇", "🙂", "😉", "😍", "🥰", "😘", "😋", "😎", "🤔", "😏", "😢", "😭"],
  },
  {
    label: "Gestures",
    emojis: ["👍", "👎", "👏", "🙌", "🤝", "✌️", "🤞", "💪", "🙏", "👋", "✋", "🖐️", "👌", "🤙", "☝️", "👆", "👇", "👈", "👉", "🤘"],
  },
  {
    label: "Objects",
    emojis: ["📝", "📄", "📋", "📌", "📎", "🔗", "💡", "🔥", "⭐", "✅", "❌", "⚠️", "🎉", "🎊", "🏆", "📊", "📈", "💻", "📱", "🔔"],
  },
  {
    label: "Nature",
    emojis: ["🌟", "🌈", "☀️", "🌙", "⭐", "🌸", "🌺", "🌻", "🍀", "🌳", "🌊", "❄️", "🐶", "🐱", "🦊", "🐻", "🦁", "🐸", "🦋", "🐝"],
  },
];

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
}

export function EmojiPicker({ onSelect }: EmojiPickerProps) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState(0);

  function handleSelect(emoji: string) {
    onSelect(emoji);
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8">
          <Smile className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        <div className="flex border-b">
          {EMOJI_CATEGORIES.map((cat, i) => (
            <button
              key={cat.label}
              type="button"
              className={`flex-1 px-2 py-2 text-xs font-medium transition-colors ${
                category === i
                  ? "border-b-2 border-primary text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setCategory(i)}
            >
              {cat.label}
            </button>
          ))}
        </div>
        <ScrollArea className="h-48 p-2">
          <div className="grid grid-cols-8 gap-0.5">
            {EMOJI_CATEGORIES[category].emojis.map((emoji) => (
              <button
                key={emoji}
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-md text-lg hover:bg-accent transition-colors"
                onClick={() => handleSelect(emoji)}
              >
                {emoji}
              </button>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
