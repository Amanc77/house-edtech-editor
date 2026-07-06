import { z } from "zod";
import { MAX_OPERATION_BATCH_SIZE } from "@/constants";

const operationTypeSchema = z.enum([
  "insert",
  "delete",
  "retain",
  "snapshot",
  "restore",
  "title_update",
]);

const vectorClockSchema = z.record(z.string(), z.number().int().min(0));

export const syncOperationSchema = z.object({
  clientId: z.string().min(1).max(128),
  type: operationTypeSchema,
  position: z.number().int().min(0),
  length: z.number().int().min(0),
  content: z.string().max(5_000_000),
  lamportClock: z.number().int().min(0),
  vectorClock: vectorClockSchema,
  timestamp: z.number().int().min(0),
  checksum: z.string().min(1).max(128),
});

export const syncPayloadSchema = z.object({
  documentId: z.string().min(1),
  baseVersion: z.number().int().min(0),
  lamportClock: z.number().int().min(0),
  vectorClock: vectorClockSchema,
  operations: z
    .array(syncOperationSchema)
    .min(1, "At least one operation is required")
    .max(
      MAX_OPERATION_BATCH_SIZE,
      `Maximum ${MAX_OPERATION_BATCH_SIZE} operations per batch`
    ),
});

export const fetchOperationsSchema = z.object({
  documentId: z.string().min(1),
  sinceVersion: z.coerce.number().int().min(0).optional().default(0),
  sinceLamport: z.coerce.number().int().min(0).optional().default(0),
  limit: z.coerce.number().int().min(1).max(500).optional().default(100),
});

export const cursorPayloadSchema = z.object({
  documentId: z.string().min(1),
  from: z.number().int().min(0),
  to: z.number().int().min(0),
});

export const typingPayloadSchema = z.object({
  documentId: z.string().min(1),
  isTyping: z.boolean(),
});

export type SyncOperationInput = z.infer<typeof syncOperationSchema>;
export type SyncPayloadInput = z.infer<typeof syncPayloadSchema>;
export type FetchOperationsQuery = z.infer<typeof fetchOperationsSchema>;
