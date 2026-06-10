import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { computeAndSendDigest } from "../src/commands/run.ts";
import type { Config, State } from "../src/config/types.ts";
import type { FigmaClient } from "../src/figma/client.ts";
import type { FigmaComment } from "../src/figma/comments.ts";
import type { SlackPayload } from "../src/slack/webhook.ts";

function comment(
  id: string,
  createdAt: string,
  parent = "",
  nodeId?: string,
): FigmaComment {
  return {
    id,
    file_key: "FK",
    parent_id: parent,
    user: { id: "u", handle: "ada" },
    created_at: createdAt,
    resolved_at: null,
    message: `msg ${id}`,
    client_meta: nodeId ? { node_id: nodeId } : null,
  };
}

type Posted = { url: string; payload: SlackPayload };

function makeDeps(
  responses: Record<string, unknown>,
  posted: Posted[],
  now: Date,
): Parameters<typeof computeAndSendDigest>[2] {
  const client: FigmaClient = {
    async get<T>(path: string): Promise<T> {
      const key = Object.keys(responses).find((k) => path.startsWith(k));
      if (!key) throw new Error(`unexpected path: ${path}`);
      return responses[key] as T;
    },
  };
  return {
    client,
    postSlack: async (url, payload) => {
      posted.push({ url, payload });
    },
    log: () => {},
    now: () => now,
  };
}

const baseConfig: Config = {
  figmaPat: "x",
  teamId: "1",
  files: [{ key: "FK", name: "Onboarding", projectName: "Web" }],
  slackWebhook: "https://hooks.slack.com/test/abc",
  schedule: "daily-9",
};

describe("computeAndSendDigest", () => {
  it("posts when fresh comments exist and updates state", async () => {
    const now = new Date("2026-06-10T12:00:00Z");
    const responses = {
      "/v1/files/FK/comments": {
        comments: [
          comment("c1", "2026-06-10T11:00:00Z", "", "1:2"),
          comment("c2", "2026-06-09T00:00:00Z"), // older than lastRun → drop
        ],
      },
      "/v1/files/FK/nodes": {
        nodes: { "1:2": { document: { id: "1:2", name: "Hero", type: "FRAME" } } },
      },
    };
    const posted: Posted[] = [];
    const state: State = {
      lastRun: { FK: "2026-06-10T10:00:00Z" },
      surfacedThreads: {},
    };

    const out = await computeAndSendDigest(
      baseConfig,
      state,
      makeDeps(responses, posted, now),
    );

    assert.equal(posted.length, 1);
    assert.equal(out.postedCount, 1);
    assert.equal(out.filesWithActivity, 1);
    assert.equal(out.nextState.lastRun["FK"], now.toISOString());
    assert.deepEqual(out.nextState.surfacedThreads["FK"], ["c1"]);
    const text = JSON.stringify(posted[0]?.payload);
    assert.match(text, /Hero/);
    assert.match(text, /1 new comment/);
  });

  it("does not post when no fresh comments, still advances state", async () => {
    const now = new Date("2026-06-10T12:00:00Z");
    const responses = {
      "/v1/files/FK/comments": {
        comments: [comment("old", "2026-01-01T00:00:00Z")],
      },
      "/v1/files/FK/nodes": { nodes: {} },
    };
    const posted: Posted[] = [];
    const state: State = {
      lastRun: { FK: "2026-06-09T00:00:00Z" },
      surfacedThreads: {},
    };

    const out = await computeAndSendDigest(
      baseConfig,
      state,
      makeDeps(responses, posted, now),
    );

    assert.equal(posted.length, 0);
    assert.equal(out.postedCount, 0);
    assert.equal(out.nextState.lastRun["FK"], now.toISOString());
  });

  it("first run (no lastRun) only includes last 24h", async () => {
    const now = new Date("2026-06-10T12:00:00Z");
    const responses = {
      "/v1/files/FK/comments": {
        comments: [
          comment("recent", "2026-06-10T06:00:00Z"),
          comment("ancient", "2025-01-01T00:00:00Z"),
        ],
      },
      "/v1/files/FK/nodes": { nodes: {} },
    };
    const posted: Posted[] = [];
    const state: State = { lastRun: {}, surfacedThreads: {} };

    const out = await computeAndSendDigest(
      baseConfig,
      state,
      makeDeps(responses, posted, now),
    );
    assert.equal(out.postedCount, 1);
    const text = JSON.stringify(posted[0]?.payload);
    assert.match(text, /msg recent/);
    assert.ok(!text.includes("msg ancient"));
  });

  it("file fetch error isolates — other files still proceed", async () => {
    const now = new Date("2026-06-10T12:00:00Z");
    const cfg: Config = {
      ...baseConfig,
      files: [
        { key: "OK", name: "Good", projectName: "P" },
        { key: "BAD", name: "Broken", projectName: "P" },
      ],
    };
    const responses = {
      "/v1/files/OK/comments": {
        comments: [comment("c1", "2026-06-10T11:00:00Z")],
      },
      "/v1/files/OK/nodes": { nodes: {} },
      // BAD throws — no handler match
    };
    const posted: Posted[] = [];
    const state: State = { lastRun: {}, surfacedThreads: {} };

    const out = await computeAndSendDigest(
      cfg,
      state,
      makeDeps(responses, posted, now),
    );
    assert.equal(out.filesWithActivity, 1);
    assert.equal(out.nextState.lastRun["OK"], now.toISOString());
    assert.equal(out.nextState.lastRun["BAD"], undefined);
  });

  it("surfaces replies under previously-seen threads", async () => {
    const now = new Date("2026-06-10T12:00:00Z");
    const responses = {
      "/v1/files/FK/comments": {
        comments: [comment("reply", "2026-06-10T11:30:00Z", "parent-old")],
      },
      "/v1/files/FK/nodes": { nodes: {} },
    };
    const posted: Posted[] = [];
    const state: State = {
      lastRun: { FK: "2026-06-10T10:00:00Z" },
      surfacedThreads: { FK: ["parent-old"] },
    };

    const out = await computeAndSendDigest(
      baseConfig,
      state,
      makeDeps(responses, posted, now),
    );
    assert.equal(out.postedCount, 1);
    const text = JSON.stringify(posted[0]?.payload);
    assert.match(text, /msg reply/);
  });
});
