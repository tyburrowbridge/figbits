import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  filterFreshComments,
  type FigmaComment,
} from "../src/figma/comments.ts";

function mk(
  id: string,
  parent: string,
  createdAt: string,
  message = "msg",
): FigmaComment {
  return {
    id,
    file_key: "F",
    parent_id: parent,
    user: { id: "u", handle: "u" },
    created_at: createdAt,
    resolved_at: null,
    message,
  };
}

describe("filterFreshComments", () => {
  it("keeps top-level newer than cutoff", () => {
    const out = filterFreshComments({
      comments: [mk("a", "", "2026-01-01T00:00:00Z")],
      lastRunIso: "2025-12-01T00:00:00Z",
      surfacedThreadIds: new Set(),
    });
    assert.equal(out.fresh.length, 1);
    assert.ok(out.nextSurfacedThreadIds.has("a"));
  });

  it("drops top-level at or before cutoff", () => {
    const out = filterFreshComments({
      comments: [mk("a", "", "2025-01-01T00:00:00Z")],
      lastRunIso: "2025-12-01T00:00:00Z",
      surfacedThreadIds: new Set(),
    });
    assert.equal(out.fresh.length, 0);
  });

  it("includes replies to already-surfaced threads", () => {
    const out = filterFreshComments({
      comments: [mk("reply", "old-parent", "2026-01-02T00:00:00Z")],
      lastRunIso: "2026-01-01T00:00:00Z",
      surfacedThreadIds: new Set(["old-parent"]),
    });
    assert.equal(out.fresh.length, 1);
    assert.equal(out.fresh[0]?.id, "reply");
  });

  it("includes replies to NEW top-level surfaced this run", () => {
    const out = filterFreshComments({
      comments: [
        mk("parent", "", "2026-01-02T00:00:00Z"),
        mk("reply", "parent", "2026-01-02T01:00:00Z"),
      ],
      lastRunIso: "2026-01-01T00:00:00Z",
      surfacedThreadIds: new Set(),
    });
    assert.equal(out.fresh.length, 2);
  });

  it("drops replies whose parent is not surfaced", () => {
    const out = filterFreshComments({
      comments: [mk("orphan", "stranger", "2026-01-02T00:00:00Z")],
      lastRunIso: "2026-01-01T00:00:00Z",
      surfacedThreadIds: new Set(),
    });
    assert.equal(out.fresh.length, 0);
  });

  it("sorts results by created_at ascending", () => {
    const out = filterFreshComments({
      comments: [
        mk("b", "", "2026-01-03T00:00:00Z"),
        mk("a", "", "2026-01-02T00:00:00Z"),
      ],
      lastRunIso: null,
      surfacedThreadIds: new Set(),
    });
    assert.deepEqual(
      out.fresh.map((c) => c.id),
      ["a", "b"],
    );
  });
});
