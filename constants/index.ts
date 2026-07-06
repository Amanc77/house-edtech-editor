export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "SyncDocs";

export const MAX_TITLE_LENGTH = 200;
export const MAX_CONTENT_LENGTH = 5_000_000;
export const MAX_OPERATION_BATCH_SIZE = 100;
export const MAX_SYNC_PAYLOAD_BYTES =
  Number(process.env.MAX_SYNC_PAYLOAD_BYTES) || 1_048_576;
export const MAX_OPERATIONS_PER_DOCUMENT = 50_000;

export const SYNC_RETRY_BASE_MS = 1000;
export const SYNC_RETRY_MAX_MS = 60000;
export const SYNC_MAX_RETRIES = 10;
export const SYNC_DEBOUNCE_MS = 500;
export const HEARTBEAT_INTERVAL_MS = 30000;
export const CURSOR_THROTTLE_MS = 100;

export const RATE_LIMIT_MAX_REQUESTS =
  Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 100;
export const RATE_LIMIT_WINDOW_MS =
  Number(process.env.RATE_LIMIT_WINDOW_MS) || 60000;

export const PRESENCE_COLORS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#06b6d4",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
];

export const DOCUMENT_ROLES = ["owner", "editor", "viewer"] as const;

export const ROLE_PERMISSIONS = {
  owner: ["read", "write", "share", "delete", "restore", "snapshot"],
  editor: ["read", "write", "snapshot"],
  viewer: ["read"],
} as const;

export const PROTECTED_ROUTES = [
  "/dashboard",
  "/documents",
  "/settings",
];

export const AUTH_ROUTES = ["/login", "/register"];
