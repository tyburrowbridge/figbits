import { rm } from "node:fs/promises";
import { CONFIG_DIR } from "../config/paths.js";
import { uninstallLaunchAgent } from "../schedule/launchd.js";
import { askSelect, success } from "../ui/prompts.js";

export async function runUninstall(): Promise<void> {
  const choice = await askSelect<"agent" | "all" | "cancel">(
    "What do you want to remove?",
    [
      { name: "Scheduled job only (keep config)", value: "agent" },
      { name: "Everything (scheduled job + config + state)", value: "all" },
      { name: "Cancel", value: "cancel" },
    ],
  );

  if (choice === "cancel") return;

  await uninstallLaunchAgent();
  success("Scheduled job removed.");

  if (choice === "all") {
    await rm(CONFIG_DIR, { recursive: true, force: true });
    success(`Removed ${CONFIG_DIR}`);
  }
}
