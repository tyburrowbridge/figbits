#!/usr/bin/env npx tsx
import { installLaunchAgent } from "../src/schedule/launchd.js";
import type { SchedulePreset } from "../src/config/types.js";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const preset = process.argv[2] as SchedulePreset;
if (!preset) {
  process.stderr.write("Usage: install-scheduler.ts <preset>\n");
  process.exit(1);
}

const pluginRoot =
  process.env["CLAUDE_PLUGIN_ROOT"] ??
  resolve(fileURLToPath(import.meta.url), "..", "..");

await installLaunchAgent(preset, {
  nodePath: process.execPath,
  scriptPath: resolve(pluginRoot, "dist", "bin", "figbits.js"),
});
process.stdout.write("ok\n");
