import { describe, it, expect } from "vitest";
import { sortOperations } from "@/lib/merge-engine";

describe("sortOperations", () => {
  it("orders by lamport clock then userId", () => {
    const ops = [
      {
        userId: "b",
        type: "insert" as const,
        position: 0,
        length: 0,
        content: "b",
        lamportClock: 2,
        vectorClock: {},
        timestamp: 2,
        checksum: "b",
      },
      {
        userId: "a",
        type: "insert" as const,
        position: 0,
        length: 0,
        content: "a",
        lamportClock: 1,
        vectorClock: {},
        timestamp: 1,
        checksum: "a",
      },
    ];

    const sorted = sortOperations(ops);
    expect(sorted[0].lamportClock).toBe(1);
    expect(sorted[1].lamportClock).toBe(2);
  });
});
