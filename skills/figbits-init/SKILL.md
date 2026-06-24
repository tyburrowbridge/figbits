---
name: figbits-init
description: Interactive 5-step setup wizard for figbits
user-invocable: false
---

Print a header:

```
figbits setup — Figma comment digest to Slack
5 steps. Press Ctrl+C any time to abort.
```

---

## Step 1 of 5 — Figma personal access token

Tell the user:
> Create one at https://www.figma.com/settings → Personal access tokens.
> Required scopes: `file_read`, `file_comments:read`.

Ask the user to paste their Figma PAT. Store it in a variable `pat`.

Validate it:

```bash
npx tsx "${CLAUDE_PLUGIN_ROOT}/scripts/validate-pat.ts" "<pat>"
```

- If exit code 0: parse stdout as JSON `{handle, email}`. Tell the user: `Authenticated as <handle> (<email>).`
- If exit code 1: show the stderr, ask the user to try a different token. Repeat this step.

---

## Step 2 of 5 — Figma team

Tell the user:
> Open your team in Figma → copy the URL (e.g. `figma.com/files/team/1234567890`).

Ask the user to paste their team URL or team ID. Store raw input in `rawTeam`.

Parse the team ID: if the input is all digits, use it as-is. Otherwise extract the numeric segment after `/team/` in the URL. If no numeric segment found, tell the user the format is invalid and repeat this step.

Store the parsed ID in `teamId`.

---

## Step 3 of 5 — Pick files to watch

Tell the user: `Loading projects and files…`

```bash
npx tsx "${CLAUDE_PLUGIN_ROOT}/scripts/discover-files.ts" "<teamId>" "<pat>"
```

- If exit code 1: show the error, tell the user to check the team ID and PAT scopes. Abort.
- If exit code 0: parse stdout as JSON array of `{key, name, projectName, last_modified}`.

Format as a numbered list. For each file, compute age from `last_modified` (today / N days ago / N months ago):

```
  1. Design System  ·  Mobile  ·  2 days ago
  2. Onboarding Flow  ·  Growth  ·  today
  3. ...
```

Ask the user to type the numbers of files to watch (comma or space separated). Repeat until at least one selection is made (warn if they submit nothing, but allow it).

Build `selectedFiles` array: `[{key, name, projectName}]` for the chosen entries.

---

## Step 4 of 5 — Slack incoming webhook

Tell the user:
> Create one at https://api.slack.com/messaging/webhooks → choose a channel → copy the URL.

Ask the user to paste their Slack webhook URL. Validate it starts with `https://hooks.slack.com/`. If not, tell them the format is wrong and repeat.

Store as `webhook`.

Test it:

```bash
npx tsx "${CLAUDE_PLUGIN_ROOT}/scripts/test-webhook.ts" "<webhook>"
```

- If exit code 0: tell the user `Test message posted — check the channel.`
- If exit code 1: show the error, ask for a different URL. Repeat this step.

---

## Step 5 of 5 — Schedule

Tell the user to pick a schedule:

```
  1. Daily at 9:00 AM
  2. Twice daily — 9:00 AM and 1:00 PM
  3. Hourly, 9 AM – 5 PM, Mon–Fri
  4. Weekly — Monday 9:00 AM
```

Ask for a number 1–4. Map to preset: 1→`daily-9`, 2→`twice-9-13`, 3→`hourly-workday`, 4→`weekly-mon`. Repeat until valid.

Store as `schedule`.

---

## Write config

Build the config JSON:

```json
{
  "figmaPat": "<pat>",
  "teamId": "<teamId>",
  "files": <selectedFiles as JSON array>,
  "slackWebhook": "<webhook>",
  "schedule": "<schedule>"
}
```

Pipe it to write-config:

```bash
echo '<config json>' | npx tsx "${CLAUDE_PLUGIN_ROOT}/scripts/write-config.ts"
```

Tell the user: `Config saved to ~/.figbits/config.json`

---

## Build

```bash
cd "${CLAUDE_PLUGIN_ROOT}" && npm run build
```

---

## Install scheduler

```bash
npx tsx "${CLAUDE_PLUGIN_ROOT}/scripts/install-scheduler.ts" "<schedule>"
```

Tell the user: `Scheduled job installed.`

---

## Done

Tell the user:

> Setup complete. Schedule: `<preset label>`.
> Run `/figbits:run` to send a digest right now.
