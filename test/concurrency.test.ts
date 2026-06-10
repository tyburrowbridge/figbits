import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mapWithConcurrency } from "../src/util/concurrency.ts";

describe("mapWithConcurrency", () => {
  it("preserves order of results", async () => {
    const out = await mapWithConcurrency([1, 2, 3, 4, 5], 2, async (n) => n * 10);
    assert.deepEqual(out, [10, 20, 30, 40, 50]);
  });

  it("respects concurrency limit", async () => {
    let active = 0;
    let peak = 0;
    await mapWithConcurrency(
      Array.from({ length: 20 }, (_, i) => i),
      3,
      async () => {
        active++;
        peak = Math.max(peak, active);
        await new Promise((r) => setTimeout(r, 5));
        active--;
      },
    );
    assert.ok(peak <= 3, `peak concurrency ${peak} exceeded limit 3`);
  });

  it("handles empty input", async () => {
    const out = await mapWithConcurrency<number, number>([], 5, async (n) => n);
    assert.deepEqual(out, []);
  });

  it("limit larger than item count is fine", async () => {
    const out = await mapWithConcurrency([1, 2], 10, async (n) => n + 1);
    assert.deepEqual(out, [2, 3]);
  });
});
