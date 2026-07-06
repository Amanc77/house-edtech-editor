import { z } from "zod";

const aiFeatureSchema = z.enum([
  "summarize",
  "improve",
  "grammar",
  "rewrite",
  "translate",
  "title",
  "action-items",
  "explain",
  "continue",
]);

export const aiRequestSchema = z.object({
  feature: aiFeatureSchema,
  content: z
    .string()
    .min(1, "Content is required")
    .max(100_000, "Content exceeds maximum length"),
  documentId: z.string().min(1).optional(),
  language: z.string().max(50).optional(),
  tone: z.string().max(50).optional(),
});

export const aiBatchRequestSchema = z.object({
  requests: z.array(aiRequestSchema).min(1).max(5),
});

export type AIRequestInput = z.infer<typeof aiRequestSchema>;
export type AIBatchRequestInput = z.infer<typeof aiBatchRequestSchema>;
