"use client";

import { useEffect } from "react";
import type { Editor } from "@tiptap/react";
import {
  Bold,
  FileText,
  Heading1,
  History,
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  Save,
  Share2,
  Sparkles,
  Table,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editor: Editor | null;
  onToggleHistory?: () => void;
  onToggleAI?: () => void;
  onShare?: () => void;
  onSave?: () => void;
}

export function CommandPalette({
  open,
  onOpenChange,
  editor,
  onToggleHistory,
  onToggleAI,
  onShare,
  onSave,
}: CommandPaletteProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  function run(command: () => void) {
    command();
    onOpenChange(false);
  }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Type a command or search…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Formatting">
          <CommandItem
            onSelect={() =>
              run(() => editor?.chain().focus().toggleBold().run())
            }
          >
            <Bold className="h-4 w-4" />
            Bold
            <CommandShortcut>⌘B</CommandShortcut>
          </CommandItem>
          <CommandItem
            onSelect={() =>
              run(() => editor?.chain().focus().toggleItalic().run())
            }
          >
            <Italic className="h-4 w-4" />
            Italic
            <CommandShortcut>⌘I</CommandShortcut>
          </CommandItem>
          <CommandItem
            onSelect={() =>
              run(() =>
                editor?.chain().focus().toggleHeading({ level: 1 }).run()
              )
            }
          >
            <Heading1 className="h-4 w-4" />
            Heading 1
          </CommandItem>
          <CommandItem
            onSelect={() =>
              run(() => editor?.chain().focus().toggleBulletList().run())
            }
          >
            <List className="h-4 w-4" />
            Bullet list
          </CommandItem>
          <CommandItem
            onSelect={() => {
              const url = window.prompt("Link URL");
              if (url) {
                run(() =>
                  editor
                    ?.chain()
                    .focus()
                    .extendMarkRange("link")
                    .setLink({ href: url })
                    .run()
                );
              }
            }}
          >
            <LinkIcon className="h-4 w-4" />
            Insert link
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Insert">
          <CommandItem
            onSelect={() => {
              const url = window.prompt("Image URL");
              if (url) {
                run(() =>
                  editor?.chain().focus().setImage({ src: url }).run()
                );
              }
            }}
          >
            <ImageIcon className="h-4 w-4" />
            Insert image
          </CommandItem>
          <CommandItem
            onSelect={() =>
              run(() =>
                editor
                  ?.chain()
                  .focus()
                  .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                  .run()
              )
            }
          >
            <Table className="h-4 w-4" />
            Insert table
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Document">
          <CommandItem onSelect={() => run(() => onSave?.())}>
            <Save className="h-4 w-4" />
            Save document
            <CommandShortcut>⌘S</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => run(() => onShare?.())}>
            <Share2 className="h-4 w-4" />
            Share document
          </CommandItem>
          <CommandItem onSelect={() => run(() => onToggleHistory?.())}>
            <History className="h-4 w-4" />
            Version history
          </CommandItem>
          <CommandItem onSelect={() => run(() => onToggleAI?.())}>
            <Sparkles className="h-4 w-4" />
            AI assistant
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Navigation">
          <CommandItem
            onSelect={() => {
              onOpenChange(false);
              window.location.href = "/dashboard";
            }}
          >
            <FileText className="h-4 w-4" />
            Go to dashboard
          </CommandItem>
          <CommandItem
            onSelect={() => {
              onOpenChange(false);
              window.location.href = "/documents";
            }}
          >
            <FileText className="h-4 w-4" />
            All documents
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
