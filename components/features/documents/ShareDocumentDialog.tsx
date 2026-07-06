"use client";

import { useEffect, useState } from "react";
import { Copy, Loader2, Mail, UserPlus } from "lucide-react";
import { toast } from "sonner";
import type { DocumentPermission, DocumentRole } from "@/types";
import { apiPath, parseJsonResponse } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ShareDocumentDialogProps {
  documentId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShareDocumentDialog({
  documentId,
  open,
  onOpenChange,
}: ShareDocumentDialogProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<DocumentRole>("editor");
  const [permissions, setPermissions] = useState<DocumentPermission[]>([]);
  const [shareLink, setShareLink] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isInviting, setIsInviting] = useState(false);

  useEffect(() => {
    if (!open) return;

    async function loadPermissions() {
      setIsLoading(true);
      try {
        const res = await fetch(apiPath(`/api/documents/${documentId}/permissions`));
        const json = await parseJsonResponse<DocumentPermission[]>(res);
        if (res.ok && json.data) {
          setPermissions(json.data);
        }
        setShareLink(
          `${window.location.origin}/documents/${documentId}`
        );
      } catch {
        setShareLink(`${window.location.origin}/documents/${documentId}`);
      } finally {
        setIsLoading(false);
      }
    }

    loadPermissions();
  }, [open, documentId]);

  async function handleInvite() {
    if (!email.trim()) {
      toast.error("Please enter an email address");
      return;
    }

    setIsInviting(true);
    try {
      const res = await fetch(apiPath(`/api/documents/${documentId}/share`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), role }),
      });
      const json = await parseJsonResponse<DocumentPermission>(res);

      if (!res.ok) {
        throw new Error(json.error ?? "Failed to invite user");
      }

      toast.success(`Invited ${email} as ${role}`);
      setEmail("");
      const permission = json.data;
      if (permission) {
        setPermissions((prev) => [...prev, permission]);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to invite");
    } finally {
      setIsInviting(false);
    }
  }

  function copyLink() {
    navigator.clipboard.writeText(shareLink);
    toast.success("Link copied to clipboard");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share document</DialogTitle>
          <DialogDescription>
            Invite collaborators or copy the share link.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1 space-y-2">
              <Label htmlFor="invite-email">Email</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="collaborator@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isInviting}
              />
            </div>
            <div className="w-28 space-y-2">
              <Label>Role</Label>
              <Select
                value={role}
                onValueChange={(v) => setRole(v as DocumentRole)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="editor">Editor</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button
            onClick={handleInvite}
            disabled={isInviting}
            className="w-full"
          >
            {isInviting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <UserPlus className="h-4 w-4" />
            )}
            Invite
          </Button>

          <div className="space-y-2">
            <Label>Share link</Label>
            <div className="flex gap-2">
              <Input value={shareLink} readOnly className="text-xs" />
              <Button variant="outline" size="icon" onClick={copyLink}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>People with access</Label>
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : permissions.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">
                No collaborators yet
              </p>
            ) : (
              <ScrollArea className="max-h-40">
                <div className="space-y-2">
                  {permissions.map((perm) => (
                    <div
                      key={perm.id}
                      className="flex items-center justify-between rounded-md border p-2"
                    >
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7">
                          <AvatarImage src="" />
                          <AvatarFallback>
                            {(perm.name ?? perm.email ?? "?")[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">
                            {perm.name ?? perm.email}
                          </p>
                          {perm.email && perm.name && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {perm.email}
                            </p>
                          )}
                        </div>
                      </div>
                      <Badge variant="secondary">{perm.role}</Badge>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
