"use client";

import { useState } from "react";
import type { Editor } from "@tiptap/react";
import { motion } from "framer-motion";
import {
  CheckSquare,
  Languages,
  Loader2,
  PenLine,
  Sparkles,
  SpellCheck,
  Wand2,
} from "lucide-react";
import { toast } from "sonner";
import type { AIFeature } from "@/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

interface AISidebarProps {
  editor: Editor | null;
  documentId: string;
  className?: string;
}

const AI_FEATURES: {
  id: AIFeature;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    id: "summarize",
    label: "Summarize",
    description: "Create a concise summary",
    icon: Sparkles,
  },
  {
    id: "improve",
    label: "Improve writing",
    description: "Enhance clarity and flow",
    icon: Wand2,
  },
  {
    id: "grammar",
    label: "Fix grammar",
    description: "Correct spelling and grammar",
    icon: SpellCheck,
  },
  {
    id: "rewrite",
    label: "Rewrite",
    description: "Rephrase selected text",
    icon: PenLine,
  },
  {
    id: "translate",
    label: "Translate",
    description: "Translate to another language",
    icon: Languages,
  },
  {
    id: "action-items",
    label: "Action items",
    description: "Extract tasks from content",
    icon: CheckSquare,
  },
];

export function AISidebar({ editor, documentId, className }: AISidebarProps) {
  const [loading, setLoading] = useState<AIFeature | null>(null);
  const [result, setResult] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");

  async function runFeature(feature: AIFeature) {
    if (!editor) return;

    const { from, to } = editor.state.selection;
    const selectedText =
      from !== to
        ? editor.state.doc.textBetween(from, to)
        : editor.getText();

    if (!selectedText.trim()) {
      toast.error("No content to process");
      return;
    }

    setLoading(feature);
    setResult("");

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feature,
          content: selectedText,
          documentId,
          tone: customPrompt || undefined,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error ?? "AI request failed");
      }

      setResult(json.data?.result ?? json.data ?? "");
      toast.success("AI processing complete");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "AI request failed");
    } finally {
      setLoading(null);
    }
  }

  function applyResult() {
    if (!editor || !result) return;

    const { from, to } = editor.state.selection;
    if (from !== to) {
      editor.chain().focus().deleteRange({ from, to }).insertContent(result).run();
    } else {
      editor.chain().focus().insertContent(`<p>${result}</p>`).run();
    }
    toast.success("Applied AI result");
    setResult("");
  }

  function insertResult() {
    if (!editor || !result) return;
    editor.chain().focus().insertContent(`<p>${result}</p>`).run();
    toast.success("Inserted AI result");
    setResult("");
  }

  return (
    <div className={cn("flex flex-col h-full", className)}>
      <div className="flex items-center gap-2 p-4 border-b">
        <Sparkles className="h-4 w-4 text-primary" />
        <h3 className="font-semibold text-sm">AI Assistant</h3>
        <Badge variant="secondary" className="ml-auto text-xs">
          Beta
        </Badge>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {AI_FEATURES.map((feature) => {
            const Icon = feature.icon;
            const isLoading = loading === feature.id;

            return (
              <motion.button
                key={feature.id}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="button"
                disabled={!!loading}
                onClick={() => runFeature(feature.id)}
                className="flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-accent/50 disabled:opacity-50"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium">{feature.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              </motion.button>
            );
          })}
        </div>

        <Separator className="my-2" />

        <div className="p-3 space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            Custom instruction (optional)
          </p>
          <Textarea
            placeholder="e.g. Make it more formal..."
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            rows={2}
            className="text-sm"
          />
        </div>

        {result && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 space-y-2"
          >
            <Separator />
            <p className="text-xs font-medium text-muted-foreground">Result</p>
            <div className="rounded-lg border bg-muted/30 p-3 text-sm whitespace-pre-wrap">
              {result}
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={applyResult} className="flex-1">
                Replace selection
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={insertResult}
                className="flex-1"
              >
                Insert below
              </Button>
            </div>
          </motion.div>
        )}
      </ScrollArea>
    </div>
  );
}
