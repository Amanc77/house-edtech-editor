# API Reference

Base URL: `NEXT_PUBLIC_APP_URL` (e.g. `http://localhost:3000`)

All authenticated endpoints require a valid JWT session cookie.

## Auth

### POST `/api/auth/register`
```json
{ "name": "John", "email": "john@example.com", "password": "secret123" }
```

### POST `/api/auth/login`
```json
{ "email": "john@example.com", "password": "secret123" }
```

### GET `/api/auth/session`
Returns current session user.

### POST `/api/auth/logout`
Clears session.

## Documents

### GET `/api/documents?page=1&pageSize=20`
List user's documents.

### POST `/api/documents`
```json
{ "title": "My Doc", "content": "<p></p>" }
```

### GET `/api/documents/:documentId`
Get document by ID.

### PATCH `/api/documents/:documentId`
```json
{ "title": "Updated", "content": "<p>Hello</p>" }
```

### DELETE `/api/documents/:documentId`
Delete document (owner only).

### POST `/api/documents/:documentId/share`
```json
{ "email": "collab@example.com", "role": "editor" }
```

## Sync

### POST `/api/sync`
```json
{
  "documentId": "uuid",
  "baseVersion": 1,
  "lamportClock": 5,
  "vectorClock": { "client-1": 3 },
  "operations": [...]
}
```

### GET `/api/sync/operations?documentId=uuid&since=0`
Fetch remote operations.

### GET `/api/sync/:documentId/state`
Get current document sync state.

## Versions

### GET `/api/versions/:documentId`
List version snapshots.

### POST `/api/versions/:documentId`
```json
{ "label": "Before launch" }
```

### POST `/api/versions/:documentId/restore`
```json
{ "versionId": "uuid" }
```

## AI

### POST `/api/ai`
```json
{
  "feature": "summarize",
  "content": "Document text...",
  "documentId": "optional-uuid"
}
```

Features: `summarize`, `improve`, `grammar`, `rewrite`, `translate`, `title`, `action-items`, `explain`, `continue`
