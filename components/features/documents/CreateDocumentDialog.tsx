"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FilePlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { MAX_TITLE_LENGTH } from "@/constants";
import { useDocument } from "@/hooks/useDocument";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface CreateDocumentDialogProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onCreated?: (documentId: string) => void;
}

export function CreateDocumentDialog({
  trigger,
  open: controlledOpen,
  onOpenChange,
  onCreated,
}: CreateDocumentDialogProps) {
  const router = useRouter();
  const { createDocument } = useDocument();
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const [title, setTitle] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleCreate() {
    if (!title.trim()) {
      toast.error("Please enter a document title");
      return;
    }

    setIsLoading(true);
    try {
      const doc = await createDocument(title.trim());
      toast.success("Document created");
      setOpen(false);
      setTitle("");
      onCreated?.(doc.id);
      router.push(`/documents/${doc.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create document");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled && (
        <DialogTrigger asChild>
          {trigger ?? (
            <Button>
              <FilePlus className="h-4 w-4" />
              New Document
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create new document</DialogTitle>
          <DialogDescription>
            Give your document a title to get started.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-2">
          <Label htmlFor="doc-title">Title</Label>
          <Input
            id="doc-title"
            placeholder="My awesome document"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={MAX_TITLE_LENGTH}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            disabled={isLoading}
            autoFocus
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={isLoading}>
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
