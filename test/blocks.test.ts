import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildDigestPayload } from "../src/slack/blocks.ts";
import type { FigmaComment } from "../src/figma/comments.ts";

function mk(
  id: string,
  parent: string,
  message: string,
  nodeId?: string,
): FigmaComment {
  return {
    id,
    file_key: "FILE",
    parent_id: parent,
    user: { id: "u", handle: "maria" },
    created_at: "2026-01-01T00:00:00Z",
    resolved_at: null,
    message,
    client_meta: nodeId ? { node_id: nodeId } : null,
  };
}

describe("buildDigestPayload", () => {
  it("renders header + per-file sections", () => {
    const payload = buildDigestPayload({
      items: [
        {
          fileKey: "FILE",
          fileName: "Onboarding",
          comments: [mk("c1", "", "Hi there", "1:2")],
          nodeNames: new Map([["1:2", "Email step"]]),
        },
      ],
      nextRunLabel: "Daily at 9:00 AM",
    });
    const blocks = payload.blocks ?? [];
    assert.ok(blocks.length >= 3);
    const header = blocks[0] as { text: { text: string } };
    assert.match(header.text.text, /Figma activity/);
    assert.match(header.text.text, /1 file/);
    assert.match(header.text.text, /1 new comment/);
  });

  it("caps items per file with overflow note", () => {
    const many: FigmaComment[] = [];
    for (let i = 0; i < 15; i++) many.push(mk(`c${i}`, "", `m${i}`));
    const payload = buildDigestPayload({
      items: [
        {
          fileKey: "FILE",
          fileName: "Big file",
          comments: many,
          nodeNames: new Map(),
        },
      ],
      nextRunLabel: null,
    });
    const text = JSON.stringify(payload);
    assert.match(text, /5 more/);
  });

  it("escapes <, >, & in user content", () => {
    const payload = buildDigestPayload({
      items: [
        {
          fileKey: "FILE",
          fileName: "<script>",
          comments: [mk("c1", "", "a & b > c")],
          nodeNames: new Map(),
        },
      ],
      nextRunLabel: null,
    });
    const text = JSON.stringify(payload);
    assert.ok(!text.includes("<script>"));
    assert.match(text, /&lt;script&gt;/);
    assert.match(text, /&amp;/);
  });

  it("includes deep link with node-id and comment id", () => {
    const payload = buildDigestPayload({
      items: [
        {
          fileKey: "FK",
          fileName: "F",
          comments: [mk("CID", "", "x", "9:9")],
          nodeNames: new Map([["9:9", "Frame"]]),
        },
      ],
      nextRunLabel: null,
    });
    const text = JSON.stringify(payload);
    assert.match(text, /figma\.com\/file\/FK\?node-id=9%3A9#CID/);
  });
});
