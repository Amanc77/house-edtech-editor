"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowLeftRight, Minus, Plus } from "lucide-react";
import type { DocumentVersion } from "@/types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface VersionCompareProps {
  currentContent: string;
  version: DocumentVersion;
  className?: string;
}

type DiffLine = {
  type: "added" | "removed" | "unchanged";
  content: string;
};

function computeDiff(oldText: string, newText: string): DiffLine[] {
  const oldLines = oldText.split("\n");
  const newLines = newText.split("\n");
  const result: DiffLine[] = [];

  const maxLen = Math.max(oldLines.length, newLines.length);

  for (let i = 0; i < maxLen; i++) {
    const oldLine = oldLines[i];
    const newLine = newLines[i];

    if (oldLine === undefined && newLine !== undefined) {
      result.push({ type: "added", content: newLine });
    } else if (newLine === undefined && oldLine !== undefined) {
      result.push({ type: "removed", content: oldLine });
    } else if (oldLine !== newLine) {
      if (oldLine) result.push({ type: "removed", content: oldLine });
      if (newLine) result.push({ type: "added", content: newLine });
    } else if (oldLine) {
      result.push({ type: "unchanged", content: oldLine });
    }
  }

  return result;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

export function VersionCompare({
  currentContent,
  version,
  className,
}: VersionCompareProps) {
  const currentText = stripHtml(currentContent);
  const versionText = stripHtml(version.content);

  const diff = useMemo(
    () => computeDiff(versionText, currentText),
    [versionText, currentText]
  );

  const stats = useMemo(() => {
    const added = diff.filter((d) => d.type === "added").length;
    const removed = diff.filter((d) => d.type === "removed").length;
    return { added, removed };
  }, [diff]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn("flex flex-col h-full", className)}
    >
      <div className="flex items-center gap-2 p-4 border-b">
        <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
        <h3 className="font-semibold text-sm">Compare Versions</h3>
        <div className="ml-auto flex gap-2">
          <Badge variant="outline" className="gap-1 text-xs">
            <Minus className="h-3 w-3 text-red-500" />
            {stats.removed}
          </Badge>
          <Badge variant="outline" className="gap-1 text-xs">
            <Plus className="h-3 w-3 text-emerald-500" />
            {stats.added}
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="diff" className="flex-1 flex flex-col">
        <TabsList className="mx-4 mt-2">
          <TabsTrigger value="diff">Diff</TabsTrigger>
          <TabsTrigger value="current">Current</TabsTrigger>
          <TabsTrigger value="version">Version {version.versionNumber}</TabsTrigger>
        </TabsList>

        <TabsContent value="diff" className="flex-1 mt-0">
          <ScrollArea className="h-[calc(100vh-16rem)]">
            <div className="p-4 font-mono text-sm space-y-0.5">
              {diff.map((line, i) => (
                <div
                  key={i}
                  className={cn(
                    "px-2 py-0.5 rounded-sm",
                    line.type === "added" &&
                      "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
                    line.type === "removed" &&
                      "bg-red-500/10 text-red-700 dark:text-red-400 line-through",
                    line.type === "unchanged" && "text-muted-foreground"
                  )}
                >
                  <span className="select-none mr-2 opacity-50">
                    {line.type === "added" ? "+" : line.type === "removed" ? "-" : " "}
                  </span>
                  {line.content || " "}
                </div>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="current" className="flex-1 mt-0">
          <ScrollArea className="h-[calc(100vh-16rem)]">
            <div className="p-4 prose prose-sm dark:prose-invert max-w-none">
              <div dangerouslySetInnerHTML={{ __html: currentContent }} />
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="version" className="flex-1 mt-0">
          <ScrollArea className="h-[calc(100vh-16rem)]">
            <div className="p-4 prose prose-sm dark:prose-invert max-w-none">
              <div dangerouslySetInnerHTML={{ __html: version.content }} />
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
