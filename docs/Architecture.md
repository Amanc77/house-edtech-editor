# Architecture

## Overview

SyncDocs follows **Clean Architecture** with strict separation of concerns:

```
UI (React) → Hooks/Stores → Offline Layer (Dexie) → Sync Engine → API Routes
                                                              ↓
                                                    Controller → Service → Repository → MongoDB
```

## Layers

### Presentation (`app/`, `components/`)
- Next.js App Router pages
- Client components for editor, dashboard, auth
- Server Components where possible

### Application (`hooks/`, `stores/`, `providers/`)
- Zustand for client state
- React hooks for documents, sync, socket, auth
- Context providers for cross-cutting concerns

### Domain (`types/`, `schemas/`, `lib/merge-engine.ts`)
- TypeScript types and Zod schemas
- Deterministic merge algorithm (Lamport + vector clocks)

### Infrastructure (`offline/`, `server/`)
- IndexedDB via Dexie (local-first source of truth)
- MongoDB via Mongoose repositories
- Socket.io for real-time presence

## Data Flow

### Offline Edit
1. User types in TipTap editor
2. Content saved to IndexedDB immediately
3. Operation queued in sync queue
4. Sync engine pushes to `/api/sync` when online

### Conflict Resolution
1. Server receives operation batch with base version
2. Merge engine sorts by Lamport clock → userId → timestamp
3. Transforms positions for concurrent edits
4. Rejects duplicates by checksum
5. Returns merged state + applied/rejected ops

### Version Restore
1. User selects historical snapshot
2. Server creates NEW version from snapshot content
3. History preserved; collaborators unaffected until sync

## Deployment Modes

| Mode | Command | Socket.io | Use Case |
|------|---------|-----------|----------|
| Vercel | `next build` | No (HTTP sync only) | Production demo |
| Custom server | `tsx server/index.ts` | Yes | Full real-time |
