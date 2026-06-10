import { resolve } from "node:path";
import { readConfig } from "../config/read.js";
import { writeConfig } from "../config/write.js";
import { installLaunchAgent } from "../schedule/launchd.js";
import { PRESET_LABELS } from "../schedule/presets.js";
import { askSelect, success } from "../ui/prompts.js";
import type { SchedulePreset } from "../config/types.js";

export async function runSchedule(): Promise<void> {
  const config = await readConfig();
  if (!config) {
    throw new Error("No config found. Run `figbits init` first.");
  }

  const preset = await askSelect<SchedulePreset>(
    `Current: ${PRESET_LABELS[config.schedule]}. Pick a new schedule:`,
    [
      { name: PRESET_LABELS["daily-9"], value: "daily-9" },
      { name: PRESET_LABELS["twice-9-13"], value: "twice-9-13" },
      { name: PRESET_LABELS["hourly-workday"], value: "hourly-workday" },
      { name: PRESET_LABELS["weekly-mon"], value: "weekly-mon" },
    ],
  );

  await writeConfig({ ...config, schedule: preset });
  await installLaunchAgent(preset, {
    nodePath: process.execPath,
    scriptPath: resolve(process.argv[1] ?? ""),
  });
  success(`Schedule updated: ${PRESET_LABELS[preset]}`);
}
