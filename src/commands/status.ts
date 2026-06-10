import { readConfig, readState } from "../config/read.js";
import {
  CONFIG_PATH,
  LAUNCH_AGENT_LABEL,
  LAUNCH_AGENT_PATH,
} from "../config/paths.js";
import { PRESET_LABELS } from "../schedule/presets.js";
import { ICON } from "../ui/icons.js";
import { exec } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);

export async function runStatus(): Promise<void> {
  const config = await readConfig();
  if (!config) {
    process.stdout.write("No config found. Run `figbits init`.\n");
    return;
  }
  const state = await readState();

  const loaded = await isLaunchAgentLoaded();

  const lines: string[] = [
    `${ICON.gear} figbits status`,
    ``,
    `Config:      ${CONFIG_PATH}`,
    `Team id:     ${config.teamId}`,
    `Watching:    ${config.files.length} file(s)`,
    `Slack:       ${maskWebhook(config.slackWebhook)}`,
    `Schedule:    ${PRESET_LABELS[config.schedule]}`,
    `launchd:     ${loaded ? "loaded" : "not loaded"}  (${LAUNCH_AGENT_PATH})`,
    ``,
    `Last runs:`,
  ];

  if (config.files.length === 0) {
    lines.push(`  (none — pick files with \`figbits files\`)`);
  } else {
    for (const f of config.files) {
      const last = state.lastRun[f.key];
      const when = last ? new Date(last).toLocaleString() : "never";
      lines.push(`  ${ICON.file} ${f.name}  ·  ${when}`);
    }
  }

  process.stdout.write(`${lines.join("\n")}\n`);
}

async function isLaunchAgentLoaded(): Promise<boolean> {
  try {
    const { stdout } = await execAsync(`launchctl list | grep ${LAUNCH_AGENT_LABEL}`);
    return stdout.trim().length > 0;
  } catch {
    return false;
  }
}

function maskWebhook(url: string): string {
  const tail = url.slice(-6);
  return `https://hooks.slack.com/…${tail}`;
}
