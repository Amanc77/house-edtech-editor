# Offline Sync

## Architecture

SyncDocs uses **IndexedDB (Dexie)** as the primary source of truth. The network is never required for reads or writes.

```
User Edit → IndexedDB → Sync Queue → (when online) → POST /api/sync → MongoDB
```

## Sync Engine (`offline/sync-engine.ts`)

| Feature | Implementation |
|---------|----------------|
| Operation queue | Dexie `syncQueue` table |
| Retry | Exponential backoff (1s → 60s max) |
| Network detection | `offline/network.ts` + `navigator.onLine` |
| Batch upload | Up to 100 ops per request |
| Queue compression | Merges consecutive inserts |
| Status events | `synced`, `pending`, `error`, `offline` |

## Client Flow

1. **Open document** — Load from IndexedDB instantly (no network)
2. **Edit** — Save to IndexedDB + enqueue operation
3. **Go offline** — Continue editing; queue grows
4. **Come online** — Sync engine auto-flushes queue
5. **Conflict** — Server merge engine resolves deterministically

## Sync Payload

```typescript
{
  documentId: string;
  baseVersion: number;      // optimistic concurrency
  lamportClock: number;
  vectorClock: Record<string, number>;
  operations: SyncOperationInput[];
}
```

## Testing Offline

1. Open a document in the editor
2. DevTools → Network → Offline
3. Make edits (should work instantly)
4. Go back online → watch sync indicator turn green
