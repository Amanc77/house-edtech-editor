import { z } from "zod";
import { DOCUMENT_ROLES } from "@/constants";

export const createDocumentSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be less than 200 characters")
    .trim(),
  content: z.string().max(5_000_000).optional().default(""),
});

export const updateDocumentSchema = z
  .object({
    title: z
      .string()
      .min(1, "Title cannot be empty")
      .max(200, "Title must be less than 200 characters")
      .trim()
      .optional(),
    content: z.string().max(5_000_000).optional(),
  })
  .refine((data) => data.title !== undefined || data.content !== undefined, {
    message: "At least one field (title or content) must be provided",
  });

export const shareDocumentSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(DOCUMENT_ROLES).refine((role) => role !== "owner", {
    message: "Cannot assign owner role via share",
  }),
});

export const updatePermissionSchema = z.object({
  role: z.enum(DOCUMENT_ROLES).refine((role) => role !== "owner", {
    message: "Cannot change to owner role",
  }),
});

export const documentIdParamSchema = z.object({
  documentId: z.string().min(1, "Document ID is required"),
});

export const listDocumentsSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
  search: z.string().max(200).optional(),
  archived: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
});

export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;
export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>;
export type ShareDocumentInput = z.infer<typeof shareDocumentSchema>;
export type UpdatePermissionInput = z.infer<typeof updatePermissionSchema>;
export type ListDocumentsQuery = z.infer<typeof listDocumentsSchema>;
