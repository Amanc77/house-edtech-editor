"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import LinkExt from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import CharacterCount from "@tiptap/extension-character-count";
import Typography from "@tiptap/extension-typography";
import Highlight from "@tiptap/extension-highlight";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { common, createLowlight } from "lowlight";
import { ArrowLeft, History, Loader2, Save, Share2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import type { DocumentMeta, DocumentVersion, PresenceUser, SyncStatus } from "@/types";
import { apiPath, parseJsonResponse } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  SlashCommandMenu,
  getDefaultSlashCommands,
  type SlashCommandItem,
} from "@/components/features/editor/SlashCommandMenu";
import { CollaboratorCursors } from "@/components/features/editor/CollaboratorCursors";
import { VersionHistoryPanel } from "@/components/features/editor/VersionHistoryPanel";
import { VersionCompare } from "@/components/features/editor/VersionCompare";
import { AISidebar } from "@/components/features/editor/AISidebar";
import { CommandPalette } from "@/components/features/editor/CommandPalette";
import { ShareDocumentDialog } from "@/components/features/documents/ShareDocumentDialog";

const lowlight = createLowlight(common);

interface DocumentEditorProps {
  document: DocumentMeta;
  onUpdate?: (content: string, title?: string) => void;
  onSave?: (content: string, title: string) => Promise<string | void>;
  presenceUsers?: PresenceUser[];
  syncStatus?: SyncStatus;
  connected?: boolean;
  readOnly?: boolean;
  className?: string;
}

export function DocumentEditor({
  document,
  onUpdate,
  onSave,
  presenceUsers = [],
  syncStatus = "synced",
  connected = true,
  readOnly = false,
  className,
}: DocumentEditorProps) {
  const [title, setTitle] = useState(document.title);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [compareVersion, setCompareVersion] = useState<DocumentVersion | null>(null);
  const [commandOpen, setCommandOpen] = useState(false);
  const [savingVersion, setSavingVersion] = useState(false);

  const [slashOpen, setSlashOpen] = useState(false);
  const [slashItems, setSlashItems] = useState<SlashCommandItem[]>([]);
  const [slashIndex, setSlashIndex] = useState(0);
  const [slashPosition, setSlashPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const slashQueryRef = useRef("");
  const loadedDocumentIdRef = useRef<string | null>(null);

  const editorRef = useRef<HTMLDivElement>(null);
  const [editorContainer, setEditorContainer] = useState<HTMLDivElement | null>(
    null
  );

  const setEditorContainerRef = useCallback((node: HTMLDivElement | null) => {
    editorRef.current = node;
    setEditorContainer(node);
  }, []);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        heading: { levels: [1, 2, 3, 4] },
      }),
      Placeholder.configure({
        placeholder: "Start writing…",
      }),
      LinkExt.configure({
        openOnClick: false,
        HTMLAttributes: { class: "text-primary underline" },
      }),
      Image.configure({ inline: false, allowBase64: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      TaskList,
      TaskItem.configure({ nested: true }),
      CharacterCount,
      Typography,
      Highlight.configure({ multicolor: false }),
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      CodeBlockLowlight.configure({ lowlight }),
    ],
    content: document.content || "<p></p>",
    editable: !readOnly,
    autofocus: "end",
    editorProps: {
      attributes: {
        class: "prose-editor focus:outline-none min-h-[50vh]",
        spellcheck: "true",
      },
      handleKeyDown: (view, event) => {
        if (slashOpen) {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setSlashIndex((i) => (i + 1) % slashItems.length);
            return true;
          }
          if (event.key === "ArrowUp") {
            event.preventDefault();
            setSlashIndex(
              (i) => (i - 1 + slashItems.length) % slashItems.length
            );
            return true;
          }
          if (event.key === "Enter") {
            event.preventDefault();
            executeSlashCommand(slashIndex);
            return true;
          }
          if (event.key === "Escape") {
            setSlashOpen(false);
            return true;
          }
        }

        if ((event.metaKey || event.ctrlKey) && event.key === "k") {
          event.preventDefault();
          setCommandOpen(true);
          return true;
        }

        return false;
      },
    },
    onUpdate: ({ editor: ed }) => {
      const html = ed.getHTML();
      onUpdate?.(html, title);

      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        onSave?.(html, title).then(() => setLastSaved(new Date()));
      }, 1500);

      checkSlashCommand(ed);
    },
  });

  const buildSlashCommands = useCallback((): SlashCommandItem[] => {
    if (!editor) return [];
    const ed = editor;
    return getDefaultSlashCommands({
      text: () => ed.chain().focus().setParagraph().run(),
      h1: () => ed.chain().focus().toggleHeading({ level: 1 }).run(),
      h2: () => ed.chain().focus().toggleHeading({ level: 2 }).run(),
      h3: () => ed.chain().focus().toggleHeading({ level: 3 }).run(),
      bulletList: () => ed.chain().focus().toggleBulletList().run(),
      orderedList: () => ed.chain().focus().toggleOrderedList().run(),
      taskList: () => ed.chain().focus().toggleTaskList().run(),
      blockquote: () => ed.chain().focus().toggleBlockquote().run(),
      codeBlock: () => ed.chain().focus().toggleCodeBlock().run(),
      hr: () => ed.chain().focus().setHorizontalRule().run(),
      image: () => {
        const url = window.prompt("Image URL");
        if (url) ed.chain().focus().setImage({ src: url }).run();
      },
      table: () =>
        ed.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
    });
  }, [editor]);

  function checkSlashCommand(ed: NonNullable<typeof editor>) {
    const { from } = ed.state.selection;
    const textBefore = ed.state.doc.textBetween(
      Math.max(0, from - 20),
      from,
      "\n"
    );
    const slashMatch = textBefore.match(/\/(\w*)$/);

    if (slashMatch) {
      const query = slashMatch[1].toLowerCase();
      slashQueryRef.current = query;
      const allCommands = buildSlashCommands();
      const filtered = query
        ? allCommands.filter((c) =>
            c.title.toLowerCase().includes(query)
          )
        : allCommands;

      if (filtered.length > 0) {
        const coords = ed.view.coordsAtPos(from);
        setSlashPosition({ top: coords.bottom + 4, left: coords.left });
        setSlashItems(filtered);
        setSlashIndex(0);
        setSlashOpen(true);
        return;
      }
    }

    setSlashOpen(false);
  }

  function executeSlashCommand(index: number) {
    if (!editor || !slashItems[index]) return;

    const { from } = editor.state.selection;
    const textBefore = editor.state.doc.textBetween(
      Math.max(0, from - 20),
      from,
      "\n"
    );
    const slashMatch = textBefore.match(/\/(\w*)$/);

    if (slashMatch) {
      const deleteFrom = from - slashMatch[0].length;
      editor
        .chain()
        .focus()
        .deleteRange({ from: deleteFrom, to: from })
        .run();
    }

    slashItems[index].command();
    setSlashOpen(false);
  }

  useEffect(() => {
    if (!editor) return;

    if (loadedDocumentIdRef.current !== document.id) {
      editor.commands.setContent(document.content || "<p></p>", {
        emitUpdate: false,
      });
      setTitle(document.title);
      loadedDocumentIdRef.current = document.id;

      if (!readOnly) {
        requestAnimationFrame(() => {
          editor.commands.focus("end");
        });
      }
    }
  }, [document.id, document.content, document.title, editor, readOnly]);

  useEffect(() => {
    return () => {
      loadedDocumentIdRef.current = null;
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  function handleTitleChange(newTitle: string) {
    setTitle(newTitle);
    onUpdate?.(editor?.getHTML() ?? "", newTitle);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      onSave?.(editor?.getHTML() ?? "", newTitle).then(() =>
        setLastSaved(new Date())
      );
    }, 1500);
  }

  async function handleSaveVersion() {
    if (!editor) return;
    setSavingVersion(true);
    try {
      const html = editor.getHTML();
      const savedId = (await onSave?.(html, title)) ?? document.id;

      const res = await fetch(apiPath(`/api/versions/${savedId}`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          label: title || "Manual save",
        }),
      });
      const json = await parseJsonResponse(res);
      if (!res.ok) {
        throw new Error(json.error ?? "Failed to save version");
      }
      toast.success("Version saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save version");
    } finally {
      setSavingVersion(false);
    }
  }

  const words = editor?.storage.characterCount?.words() ?? 0;
  const characters = editor?.storage.characterCount?.characters() ?? 0;
  const syncLabel =
    syncStatus === "synced"
      ? "synced"
      : syncStatus === "syncing"
        ? "syncing"
        : syncStatus;

  return (
    <div className={cn("flex h-full min-h-0 flex-col", className)}>
      <div className="flex flex-1 overflow-hidden">
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <div className="mx-auto w-full max-w-4xl flex-1 overflow-auto px-4 py-6 lg:px-8">
            <Link
              href="/dashboard"
              className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              All docs
            </Link>

            <Input
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="mb-6 h-auto border-0 bg-transparent px-0 text-3xl font-bold tracking-tight shadow-none focus-visible:ring-0"
              placeholder="Untitled document"
              disabled={readOnly}
            />

            <div
              className="relative rounded-xl border bg-card/40"
              ref={setEditorContainerRef}
              onClick={() => editor?.commands.focus()}
            >
              <EditorContent editor={editor} className="editor-prose px-6 py-5" />
              <CollaboratorCursors
                users={presenceUsers}
                editorElement={editorContainer}
              />
            </div>
          </div>

          <div className="border-t bg-background/80 px-4 py-3 backdrop-blur-sm lg:px-8">
            <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span>{words} words</span>
                <span>·</span>
                <span>{characters} chars</span>
                <span>·</span>
                <span>base v{document.version}</span>
                <span>·</span>
                <span className={cn(syncStatus === "synced" && "text-emerald-500")}>
                  {syncLabel}
                  {!connected && " (offline)"}
                </span>
                {lastSaved && (
                  <>
                    <span>·</span>
                    <span>Saved {lastSaved.toLocaleTimeString()}</span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="hidden sm:inline-flex"
                  onClick={() => setShowShare(true)}
                >
                  <Share2 className="h-4 w-4" />
                  Share
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="hidden sm:inline-flex"
                  onClick={() => {
                    setShowHistory(true);
                    setShowAI(false);
                    setCompareVersion(null);
                  }}
                >
                  <History className="h-4 w-4" />
                  History
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSaveVersion}
                  disabled={savingVersion || readOnly}
                >
                  {savingVersion ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save version
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setShowAI(true);
                    setShowHistory(false);
                    setCompareVersion(null);
                  }}
                >
                  <Sparkles className="h-4 w-4" />
                  AI assist
                </Button>
              </div>
            </div>
          </div>
        </div>

        {(showHistory || showAI || compareVersion) && (
          <aside className="w-80 shrink-0 overflow-hidden border-l bg-card/50">
            {compareVersion ? (
              <VersionCompare
                currentContent={editor?.getHTML() ?? ""}
                version={compareVersion}
              />
            ) : showHistory ? (
              <VersionHistoryPanel
                documentId={document.id}
                currentVersion={document.version}
                onCompare={setCompareVersion}
                onRestore={(_version, restoredContent) => {
                  if (restoredContent) {
                    editor?.commands.setContent(restoredContent, {
                      emitUpdate: false,
                    });
                  }
                }}
              />
            ) : showAI ? (
              <AISidebar editor={editor} documentId={document.id} />
            ) : null}
          </aside>
        )}
      </div>

      <SlashCommandMenu
        items={slashItems}
        selectedIndex={slashIndex}
        onSelect={executeSlashCommand}
        position={slashPosition}
      />

      <CommandPalette
        open={commandOpen}
        onOpenChange={setCommandOpen}
        editor={editor}
        onToggleHistory={() => setShowHistory((v) => !v)}
        onToggleAI={() => setShowAI((v) => !v)}
        onShare={() => setShowShare(true)}
      />

      <ShareDocumentDialog
        documentId={document.id}
        open={showShare}
        onOpenChange={setShowShare}
      />
    </div>
  );
}
