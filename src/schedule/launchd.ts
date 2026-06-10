import { exec } from "node:child_process";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import { dirname } from "node:path";
import { promisify } from "node:util";
import { LAUNCH_AGENT_LABEL, LAUNCH_AGENT_PATH } from "../config/paths.js";
import type { SchedulePreset } from "../config/types.js";
import { presetToCalendarEntries, type CalendarEntry } from "./presets.js";

const execAsync = promisify(exec);

export type LaunchInvocation = {
  nodePath: string;
  scriptPath: string;
};

export async function installLaunchAgent(
  preset: SchedulePreset,
  invocation: LaunchInvocation,
): Promise<void> {
  const entries = presetToCalendarEntries(preset);
  const plist = renderPlist(invocation, entries);
  await mkdir(dirname(LAUNCH_AGENT_PATH), { recursive: true });
  await writeFile(LAUNCH_AGENT_PATH, plist, "utf8");
  await safeUnload();
  await execAsync(`launchctl load -w "${LAUNCH_AGENT_PATH}"`);
}

export async function uninstallLaunchAgent(): Promise<void> {
  await safeUnload();
  try {
    await unlink(LAUNCH_AGENT_PATH);
  } catch (err) {
    if (!isNotFound(err)) throw err;
  }
}

async function safeUnload(): Promise<void> {
  try {
    await execAsync(`launchctl unload "${LAUNCH_AGENT_PATH}"`);
  } catch {
    // not loaded — fine
  }
}

export function renderPlist(
  invocation: LaunchInvocation,
  entries: CalendarEntry[],
): string {
  const calendar = entries
    .map((e) => `        <dict>${renderEntry(e)}</dict>`)
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>${LAUNCH_AGENT_LABEL}</string>
    <key>ProgramArguments</key>
    <array>
        <string>${invocation.nodePath}</string>
        <string>${invocation.scriptPath}</string>
        <string>run</string>
    </array>
    <key>RunAtLoad</key>
    <false/>
    <key>StartCalendarInterval</key>
    <array>
${calendar}
    </array>
    <key>StandardOutPath</key>
    <string>/tmp/figbits.out.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/figbits.err.log</string>
</dict>
</plist>
`;
}

function renderEntry(e: CalendarEntry): string {
  const parts: string[] = [];
  parts.push(`<key>Hour</key><integer>${e.Hour}</integer>`);
  parts.push(`<key>Minute</key><integer>${e.Minute}</integer>`);
  if (e.Weekday !== undefined) {
    parts.push(`<key>Weekday</key><integer>${e.Weekday}</integer>`);
  }
  return parts.join("");
}

function isNotFound(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code: string }).code === "ENOENT"
  );
}
