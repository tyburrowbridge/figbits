import { readConfig } from "../config/read.js";
import { writeConfig } from "../config/write.js";
import { createClient, FigmaError } from "../figma/client.js";
import { discoverFiles, type DiscoveredFile } from "../figma/files.js";
import { askCheckbox, success, warn } from "../ui/prompts.js";
import type { WatchedFile } from "../config/types.js";

export async function runFiles(): Promise<void> {
  const config = await readConfig();
  if (!config) {
    throw new Error("No config found. Run `figbits init` first.");
  }

  process.stdout.write("Loading projects and files (recent first)…\n");
  let discovered: DiscoveredFile[];
  try {
    discovered = await discoverFiles(createClient(config.figmaPat), config.teamId);
  } catch (err) {
    if (err instanceof FigmaError) {
      throw new Error(
        `Could not list team files (${err.status}). Re-run \`figbits init\` if your PAT or team changed.`,
      );
    }
    throw err;
  }

  if (discovered.length === 0) {
    warn("No files found in this team.");
    return;
  }

  const currentKeys = new Set(config.files.map((f) => f.key));
  const choices = discovered.map((f) => ({
    name: `${f.name}  ·  ${f.projectName}  ·  ${formatAge(f.last_modified)}`,
    value: { key: f.key, name: f.name, projectName: f.projectName },
    checked: currentKeys.has(f.key),
  }));

  const selected = await askCheckbox<WatchedFile>(
    "Select files to digest (space to toggle, enter to confirm):",
    choices,
  );

  await writeConfig({ ...config, files: selected });
  success(`Watching ${selected.length} file(s).`);
}

function formatAge(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diffMs / 86_400_000);
  if (days < 1) return "today";
  if (days === 1) return "1 day ago";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return months === 1 ? "1 month ago" : `${months} months ago`;
}
