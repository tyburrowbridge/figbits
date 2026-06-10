import { readFile } from "node:fs/promises";
import { CONFIG_PATH, STATE_PATH } from "./paths.js";
import type { Config, State } from "./types.js";

export async function readConfig(): Promise<Config | null> {
  try {
    const raw = await readFile(CONFIG_PATH, "utf8");
    return JSON.parse(raw) as Config;
  } catch (err) {
    if (isNotFound(err)) return null;
    throw err;
  }
}

export async function readState(): Promise<State> {
  try {
    const raw = await readFile(STATE_PATH, "utf8");
    return JSON.parse(raw) as State;
  } catch (err) {
    if (isNotFound(err)) return { lastRun: {}, surfacedThreads: {} };
    throw err;
  }
}

function isNotFound(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code: string }).code === "ENOENT"
  );
}
