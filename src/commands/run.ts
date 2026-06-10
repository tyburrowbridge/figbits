import { readConfig, readState } from "../config/read.js";
import { writeState } from "../config/write.js";
import type { Config, State, WatchedFile } from "../config/types.js";
import { createClient, type FigmaClient } from "../figma/client.js";
import {
  fetchComments,
  filterFreshComments,
  resolveNodeNames,
  type FigmaComment,
} from "../figma/comments.js";
import {
  buildDigestPayload,
  type DigestItem,
} from "../slack/blocks.js";
import { postToWebhook, type SlackPayload } from "../slack/webhook.js";
import { mapWithConcurrency } from "../util/concurrency.js";
import { PRESET_LABELS } from "../schedule/presets.js";

const FILE_CONCURRENCY = 5;
const FIRST_RUN_LOOKBACK_MS = 24 * 60 * 60 * 1000;

export type DigestDeps = {
  client: FigmaClient;
  postSlack: (url: string, payload: SlackPayload) => Promise<void>;
  log: (message: string) => void;
  now: () => Date;
};

export type DigestOutcome = {
  nextState: State;
  postedCount: number;
  filesWithActivity: number;
};

export async function computeAndSendDigest(
  config: Config,
  state: State,
  deps: DigestDeps,
): Promise<DigestOutcome> {
  const runStart = deps.now();
  const results = await mapWithConcurrency(
    config.files,
    FILE_CONCURRENCY,
    (file) => processFile(deps, file, state, runStart),
  );

  const items: DigestItem[] = results
    .filter((r): r is FileRunResult => r !== null)
    .filter((r) => r.comments.length > 0)
    .map((r) => ({
      fileKey: r.file.key,
      fileName: r.file.name,
      comments: r.comments,
      nodeNames: r.nodeNames,
    }));

  const nextState = buildNextState(state, results, runStart);

  if (items.length === 0) {
    deps.log(`No new comments across ${config.files.length} watched file(s).`);
    return { nextState, postedCount: 0, filesWithActivity: 0 };
  }

  const payload = buildDigestPayload({
    items,
    nextRunLabel: PRESET_LABELS[config.schedule],
  });
  await deps.postSlack(config.slackWebhook, payload);

  const total = items.reduce((n, it) => n + it.comments.length, 0);
  deps.log(`Posted digest: ${total} comment(s) across ${items.length} file(s).`);
  return { nextState, postedCount: total, filesWithActivity: items.length };
}

export async function runDigest(): Promise<void> {
  const config = await readConfig();
  if (!config) {
    throw new Error("No config found. Run `figbits init` first.");
  }
  const state = await readState();
  const outcome = await computeAndSendDigest(config, state, {
    client: createClient(config.figmaPat),
    postSlack: postToWebhook,
    log: (m) => process.stdout.write(`${m}\n`),
    now: () => new Date(),
  });
  await writeState(outcome.nextState);
}

type FileRunResult = {
  file: WatchedFile;
  comments: FigmaComment[];
  nodeNames: Map<string, string>;
  surfacedThreadIds: Set<string>;
};

async function processFile(
  deps: DigestDeps,
  file: WatchedFile,
  state: State,
  runStart: Date,
): Promise<FileRunResult | null> {
  try {
    const all = await fetchComments(deps.client, file.key);
    const lastRunIso =
      state.lastRun[file.key] ??
      new Date(runStart.getTime() - FIRST_RUN_LOOKBACK_MS).toISOString();
    const surfaced = new Set(state.surfacedThreads[file.key] ?? []);
    const { fresh, nextSurfacedThreadIds } = filterFreshComments({
      comments: all,
      lastRunIso,
      surfacedThreadIds: surfaced,
    });

    const nodeIds = fresh
      .map((c) => c.client_meta?.node_id)
      .filter((id): id is string => typeof id === "string" && id.length > 0);
    const nodeNames = await resolveNodeNames(deps.client, file.key, nodeIds);

    return {
      file,
      comments: fresh,
      nodeNames,
      surfacedThreadIds: nextSurfacedThreadIds,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    deps.log(`  ! ${file.name}: ${message}`);
    return null;
  }
}

function buildNextState(
  state: State,
  results: (FileRunResult | null)[],
  runStart: Date,
): State {
  const iso = runStart.toISOString();
  const nextLastRun = { ...state.lastRun };
  const nextSurfaced = { ...state.surfacedThreads };
  for (const r of results) {
    if (!r) continue;
    nextLastRun[r.file.key] = iso;
    nextSurfaced[r.file.key] = [...r.surfacedThreadIds];
  }
  return { lastRun: nextLastRun, surfacedThreads: nextSurfaced };
}
