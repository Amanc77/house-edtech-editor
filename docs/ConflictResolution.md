# Conflict Resolution

## Strategy

SyncDocs uses **deterministic operation-based merging** with Lamport clocks and vector clocks. No last-write-wins — all valid operations are preserved.

## Ordering Algorithm

Operations are sorted by:

1. **Lamport clock** (ascending)
2. **User ID** (lexicographic tiebreaker)
3. **Timestamp** (ascending)
4. **Checksum** (lexicographic tiebreaker)

```typescript
function compareOperations(a, b) {
  if (a.lamportClock !== b.lamportClock) return a.lamportClock - b.lamportClock;
  if (a.userId !== b.userId) return a.userId.localeCompare(b.userId);
  if (a.timestamp !== b.timestamp) return a.timestamp - b.timestamp;
  return a.checksum.localeCompare(b.checksum);
}
```

## Operation Types

| Type | Description |
|------|-------------|
| `insert` | Insert text at position |
| `delete` | Delete `length` chars at position |
| `retain` | Keep content (sync marker) |
| `title_update` | Update document title |
| `snapshot` | Version snapshot marker |
| `restore` | Restore from version |

## Position Transformation

When applying concurrent operations, positions are transformed based on previously applied operations in the sorted batch. This ensures:

- Two users typing at the same position both get merged
- Offline edits don't overwrite online edits
- Late-arriving operations are correctly positioned

## Duplicate Detection

Operations with matching checksums in `existingChecksums` set are rejected (idempotency).

## Version Mismatch

Client sends `baseVersion` with sync payload. Server applies merge regardless but tracks version increments. Conflicts resolved count is returned in sync response.

## No Data Loss Guarantee

- Rejected operations are returned in `rejectedOperations` array
- Client can retry or display conflict UI
- Version restore creates NEW version — never deletes history
