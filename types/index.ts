export type DocumentRole = "owner" | "editor" | "viewer";

export type SyncStatus =
  | "synced"
  | "syncing"
  | "pending"
  | "offline"
  | "error"
  | "conflict";

export type OperationType =
  | "insert"
  | "delete"
  | "retain"
  | "snapshot"
  | "restore"
  | "title_update";

export type PermissionAction =
  | "read"
  | "write"
  | "share"
  | "delete"
  | "restore"
  | "snapshot";

export type AuthProvider = "credentials" | "google";

export interface User {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  passwordHash?: string | null;
  provider: AuthProvider;
  emailVerified?: Date | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  image?: string | null;
}

export interface Document {
  id: string;
  title: string;
  ownerId: string;
  content: string;
  version: number;
  lamportClock: number;
  vectorClock: Record<string, number>;
  checksum: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  lastSyncedAt?: string;
}

export interface DocumentMeta {
  id: string;
  title: string;
  ownerId: string;
  content: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  lastSyncedAt?: string;
}

export interface Operation {
  id: string;
  documentId: string;
  userId: string;
  clientId: string;
  type: OperationType;
  position: number;
  length: number;
  content: string;
  lamportClock: number;
  vectorClock: Record<string, number>;
  timestamp: number;
  checksum: string;
  applied: boolean;
}

/** @deprecated Use Operation */
export type DocumentOperation = Operation;

export interface Version {
  id: string;
  documentId: string;
  versionNumber: number;
  title: string;
  content: string;
  snapshotBy: string;
  label?: string;
  checksum: string;
  createdAt: string;
}

/** @deprecated Use Version */
export type DocumentVersion = Version;

export interface Permission {
  id: string;
  documentId: string;
  userId: string;
  role: DocumentRole;
  grantedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface PermissionWithUser extends Permission {
  email?: string;
  name?: string;
}

/** @deprecated Use PermissionWithUser */
export type DocumentPermission = PermissionWithUser;

export interface SyncOperationInput {
  clientId: string;
  type: OperationType;
  position: number;
  length: number;
  content: string;
  lamportClock: number;
  vectorClock: Record<string, number>;
  timestamp: number;
  checksum: string;
}

export interface SyncPayload {
  documentId: string;
  baseVersion: number;
  lamportClock: number;
  vectorClock: Record<string, number>;
  operations: SyncOperationInput[];
}

export interface SyncResult {
  documentId: string;
  version: number;
  content: string;
  title: string;
  lamportClock: number;
  vectorClock: Record<string, number>;
  checksum: string;
  appliedOperations: Operation[];
  rejectedOperations: SyncOperationInput[];
  conflictsResolved: number;
}

export interface PresenceUser {
  userId: string;
  name: string;
  image?: string | null;
  color: string;
  role: DocumentRole;
  cursor?: { from: number; to: number } | null;
  isTyping: boolean;
  lastSeen: number;
}

export interface CursorPayload {
  from: number;
  to: number;
}

export interface SyncQueueItem {
  id: string;
  documentId: string;
  operation: Operation;
  retries: number;
  maxRetries: number;
  createdAt: number;
  lastAttemptAt?: number;
  status: "pending" | "processing" | "failed" | "completed";
}

export interface ActivityLogEntry {
  id: string;
  documentId: string;
  userId: string;
  action: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface CreateDocumentInput {
  title: string;
  content?: string;
}

export interface UpdateDocumentInput {
  title?: string;
  content?: string;
}

export interface ShareDocumentInput {
  email: string;
  role: DocumentRole;
}

export interface CreateVersionInput {
  label?: string;
}

export interface RestoreVersionInput {
  versionId: string;
}

export type AIFeature =
  | "summarize"
  | "improve"
  | "grammar"
  | "rewrite"
  | "translate"
  | "title"
  | "action-items"
  | "explain"
  | "continue";

export interface AIRequest {
  feature: AIFeature;
  content: string;
  documentId?: string;
  language?: string;
  tone?: string;
}

export interface AIResponse {
  feature: AIFeature;
  result: string;
  tokensUsed?: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface AuthenticatedSession {
  userId: string;
  email: string;
  name: string;
  image?: string | null;
}

export interface JwtPayload extends AuthenticatedSession {
  iat?: number;
  exp?: number;
}
