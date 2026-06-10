import { resolve } from "node:path";
import { createClient, FigmaError } from "../figma/client.js";
import {
  discoverFiles,
  parseTeamId,
  validatePat,
  type DiscoveredFile,
} from "../figma/files.js";
import { postConnectionTest, SlackError } from "../slack/webhook.js";
import { installLaunchAgent } from "../schedule/launchd.js";
import { PRESET_LABELS } from "../schedule/presets.js";
import type { Config, SchedulePreset, WatchedFile } from "../config/types.js";
import { writeConfig } from "../config/write.js";
import { CONFIG_PATH, LAUNCH_AGENT_PATH } from "../config/paths.js";
import {
  askCheckbox,
  askInput,
  askSecret,
  askSelect,
  header,
  note,
  success,
  warn,
} from "../ui/prompts.js";
import { ICON } from "../ui/icons.js";

const TOTAL_STEPS = 5;

export async function runInit(): Promise<void> {
  process.stdout.write(
    `\n${ICON.art} figbits setup — Figma comment digest to Slack\n`,
  );
  note("5 steps. Press Ctrl+C any time to abort.");

  const pat = await stepPat();
  const client = createClient(pat);

  const teamId = await stepTeam();
  const files = await stepFiles(client, teamId);
  const webhook = await stepWebhook();
  const schedule = await stepSchedule();

  const config: Config = {
    figmaPat: pat,
    teamId,
    files,
    slackWebhook: webhook,
    schedule,
  };

  await writeConfig(config);
  success(`Config saved to ${CONFIG_PATH} (chmod 600)`);

  await installLaunchAgent(schedule, {
    nodePath: process.execPath,
    scriptPath: resolve(process.argv[1] ?? ""),
  });
  success(`Scheduled job installed: ${LAUNCH_AGENT_PATH}`);

  process.stdout.write(
    `\n${ICON.spark} Done. Schedule: ${PRESET_LABELS[schedule]}\n`,
  );
  note("Run `figbits run` to send a digest right now.");
}

async function stepPat(): Promise<string> {
  header(1, TOTAL_STEPS, "Figma personal access token");
  note(
    "Create one at https://www.figma.com/settings → Personal access tokens.",
  );
  note("Required scopes: file_read, file_comments:read.");

  while (true) {
    const pat = await askSecret("Paste your Figma PAT:");
    try {
      const me = await validatePat(createClient(pat));
      success(`Authenticated as ${me.handle} (${me.email})`);
      return pat;
    } catch (err) {
      if (err instanceof FigmaError) {
        warn(`Token rejected (${err.status}). Try again.`);
        continue;
      }
      throw err;
    }
  }
}

async function stepTeam(): Promise<string> {
  header(2, TOTAL_STEPS, "Figma team");
  note(
    "Open your team in Figma → copy the URL (e.g. figma.com/files/team/1234567890).",
  );

  while (true) {
    const raw = await askInput("Paste your team URL or team id:");
    try {
      const id = parseTeamId(raw);
      success(`Team id: ${id}`);
      return id;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      warn(message);
    }
  }
}

async function stepFiles(
  client: ReturnType<typeof createClient>,
  teamId: string,
): Promise<WatchedFile[]> {
  header(3, TOTAL_STEPS, "Pick files to watch");
  note("Loading projects and files (recent first)…");

  let discovered: DiscoveredFile[];
  try {
    discovered = await discoverFiles(client, teamId);
  } catch (err) {
    if (err instanceof FigmaError) {
      throw new Error(
        `Could not list team files (${err.status}). Confirm the team id and that your PAT has access.`,
      );
    }
    throw err;
  }

  if (discovered.length === 0) {
    warn("No files found in this team.");
    return [];
  }

  success(`Found ${discovered.length} files across the team.`);

  const choices = buildFileChoices(discovered);
  const selected = await askCheckbox<WatchedFile>(
    `Select files to digest (space to toggle, enter to confirm):`,
    choices,
  );

  if (selected.length === 0) {
    warn("No files selected — digest will be empty until you run `figbits files`.");
  } else {
    success(`Watching ${selected.length} file(s).`);
  }
  return selected;
}

function buildFileChoices(
  discovered: DiscoveredFile[],
): { name: string; value: WatchedFile }[] {
  return discovered.map((f) => ({
    name: `${f.name}  ·  ${f.projectName}  ·  ${formatAge(f.last_modified)}`,
    value: { key: f.key, name: f.name, projectName: f.projectName },
  }));
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

async function stepWebhook(): Promise<string> {
  header(4, TOTAL_STEPS, "Slack incoming webhook");
  note(
    "Create one at https://api.slack.com/messaging/webhooks → choose a channel → copy the URL.",
  );

  while (true) {
    const url = await askInput("Paste webhook URL:", (v) =>
      v.startsWith("https://hooks.slack.com/")
        ? true
        : "Must be a https://hooks.slack.com/... URL",
    );
    try {
      await postConnectionTest(url);
      success("Test message posted — check the channel.");
      return url;
    } catch (err) {
      if (err instanceof SlackError) {
        warn(`Slack rejected the webhook (${err.status}). Try again.`);
        continue;
      }
      throw err;
    }
  }
}

async function stepSchedule(): Promise<SchedulePreset> {
  header(5, TOTAL_STEPS, "Digest schedule");
  return askSelect<SchedulePreset>("How often should figbits run?", [
    { name: PRESET_LABELS["daily-9"], value: "daily-9" },
    { name: PRESET_LABELS["twice-9-13"], value: "twice-9-13" },
    { name: PRESET_LABELS["hourly-workday"], value: "hourly-workday" },
    { name: PRESET_LABELS["weekly-mon"], value: "weekly-mon" },
  ]);
}

