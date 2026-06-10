import { chmod, mkdir, writeFile } from "node:fs/promises";
import { CONFIG_DIR, CONFIG_PATH, STATE_PATH } from "./paths.js";
import type { Config, State } from "./types.js";

export async function writeConfig(config: Config): Promise<void> {
  await ensureDir();
  await writeFile(CONFIG_PATH, JSON.stringify(config, null, 2), "utf8");
  await chmod(CONFIG_PATH, 0o600);
}

export async function writeState(state: State): Promise<void> {
  await ensureDir();
  await writeFile(STATE_PATH, JSON.stringify(state, null, 2), "utf8");
  await chmod(STATE_PATH, 0o600);
}

async function ensureDir(): Promise<void> {
  await mkdir(CONFIG_DIR, { recursive: true, mode: 0o700 });
}
