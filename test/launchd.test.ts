import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { renderPlist } from "../src/schedule/launchd.ts";
import { presetToCalendarEntries } from "../src/schedule/presets.ts";

describe("renderPlist", () => {
  const inv = {
    nodePath: "/usr/local/bin/node",
    scriptPath: "/Users/me/figbits/dist/bin/figbits.js",
  };

  it("includes label, node path, script path, run arg", () => {
    const xml = renderPlist(inv, presetToCalendarEntries("daily-9"));
    assert.match(xml, /<string>com\.figbits\.digest<\/string>/);
    assert.match(xml, /<string>\/usr\/local\/bin\/node<\/string>/);
    assert.match(xml, /figbits\.js<\/string>/);
    assert.match(xml, /<string>run<\/string>/);
  });

  it("emits one calendar dict per entry", () => {
    const entries = presetToCalendarEntries("twice-9-13");
    const xml = renderPlist(inv, entries);
    const count = (xml.match(/<dict>/g) ?? []).length;
    // outer <dict> + 2 calendar entry <dict>s
    assert.equal(count, 3);
  });

  it("hourly-workday emits 45 entries with Weekday", () => {
    const xml = renderPlist(
      inv,
      presetToCalendarEntries("hourly-workday"),
    );
    const weekdays = (xml.match(/<key>Weekday<\/key>/g) ?? []).length;
    assert.equal(weekdays, 45);
  });

  it("daily-9 has no Weekday key", () => {
    const xml = renderPlist(inv, presetToCalendarEntries("daily-9"));
    assert.equal((xml.match(/<key>Weekday<\/key>/g) ?? []).length, 0);
  });

  it("starts with valid plist DOCTYPE", () => {
    const xml = renderPlist(inv, presetToCalendarEntries("daily-9"));
    assert.ok(xml.startsWith('<?xml version="1.0"'));
    assert.match(xml, /<!DOCTYPE plist/);
  });
});
