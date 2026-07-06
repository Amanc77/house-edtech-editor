import { z } from "zod";

export const createVersionSchema = z.object({
  label: z
    .string()
    .max(200, "Label must be less than 200 characters")
    .trim()
    .optional(),
});

export const restoreVersionSchema = z.object({
  versionId: z.string().min(1, "Version ID is required"),
});

export const listVersionsSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export const versionIdParamSchema = z.object({
  documentId: z.string().min(1),
  versionId: z.string().min(1),
});

export type CreateVersionInput = z.infer<typeof createVersionSchema>;
export type RestoreVersionInput = z.infer<typeof restoreVersionSchema>;
export type ListVersionsQuery = z.infer<typeof listVersionsSchema>;
