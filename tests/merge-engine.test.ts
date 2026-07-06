import { describe, it, expect } from "vitest";
import { mergeOperations } from "@/lib/merge-engine";
import type { Operation } from "@/types";

function makeOp(overrides: Partial<Operation> & Pick<Operation, "id">): Operation {
  return {
    documentId: "doc-1",
    userId: "user-1",
    clientId: "client-1",
    type: "insert",
    position: 0,
    length: 0,
    content: "a",
    lamportClock: 1,
    vectorClock: { "client-1": 1 },
    timestamp: Date.now(),
    checksum: "abc",
    applied: false,
    ...overrides,
  };
}

describe("merge-engine", () => {
  it("applies insert operations in deterministic order", () => {
    const base = "hello";
    const ops = [
      makeOp({ id: "1", position: 5, content: "!", lamportClock: 2, timestamp: 2, checksum: "c1" }),
      makeOp({ id: "2", position: 0, content: "Hi ", lamportClock: 1, timestamp: 1, checksum: "c2" }),
    ];

    const result = mergeOperations(base, "title", 0, {}, ops, new Set());
    expect(result.content).toBeTruthy();
    expect(result.appliedOperations.length).toBeGreaterThan(0);
  });

  it("rejects duplicate operation checksums", () => {
    const op = makeOp({ id: "dup", position: 0, content: "x", checksum: "same" });
    const seen = new Set(["same"]);
    const result = mergeOperations("test", "title", 0, {}, [op], seen);
    expect(result.rejectedOperations.length).toBe(1);
  });
});
