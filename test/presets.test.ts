import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { presetToCalendarEntries } from "../src/schedule/presets.ts";

describe("presetToCalendarEntries", () => {
  it("daily-9 → single 9:00 entry", () => {
    const e = presetToCalendarEntries("daily-9");
    assert.deepEqual(e, [{ Hour: 9, Minute: 0 }]);
  });

  it("twice-9-13 → two entries", () => {
    const e = presetToCalendarEntries("twice-9-13");
    assert.equal(e.length, 2);
    assert.equal(e[0]?.Hour, 9);
    assert.equal(e[1]?.Hour, 13);
  });

  it("hourly-workday → 9 hours × 5 weekdays = 45 entries", () => {
    const e = presetToCalendarEntries("hourly-workday");
    assert.equal(e.length, 45);
    assert.ok(e.every((x) => x.Weekday !== undefined));
    assert.ok(e.every((x) => x.Hour >= 9 && x.Hour <= 17));
  });

  it("weekly-mon → Monday only", () => {
    const e = presetToCalendarEntries("weekly-mon");
    assert.deepEqual(e, [{ Hour: 9, Minute: 0, Weekday: 1 }]);
  });
});
