<p align="center">
  <strong>figbits</strong>
</p>

<p align="center">
  A CLI tool that delivers a scheduled <strong>Figma comment digest to Slack</strong>. Watches one or more Figma files, filters to new threads and replies since the last run, resolves frame names, and posts a linked summary — automatically, on your schedule.
</p>

---

## Features

| | |
|---|---|
| **Multi-file watching** | Track comments across any number of Figma files in one team. |
| **Smart deduplication** | Surfaces new top-level threads and unseen replies only — no repeat noise. |
| **Frame-level context** | Resolves node IDs to frame names so reviewers know exactly where feedback landed. |
| **Deep links** | Every comment line links directly to that comment in the Figma file. |
| **Flexible schedule** | Four presets (daily, twice-daily, hourly, weekly) installed as a macOS launchd job. |
| **Interactive setup** | Five-step wizard: PAT validation → team discovery → file picker → webhook test → schedule. |

---

## Requirements

- [ ] **Node.js 20+** — [nodejs.org](https://nodejs.org)
- [ ] **Figma account** with access to the target team
- [ ] **Figma Personal Access Token** with `file_read` and `file_comments:read` scopes — [generate one](https://www.figma.com/settings)
- [ ] **Slack incoming webhook** — [create one](https://api.slack.com/messaging/webhooks)
- [ ] **macOS** — scheduler uses launchd (Linux/Windows: use `figbits run` with your own cron)

`figbits init` validates credentials and tells you what's missing.

---

## Install

In Claude Code, run these **one at a time**:

```
/plugin marketplace add tyburrowbridge/figbits
```

```
/plugin install figbits@figbits
```

```
/reload-plugins
```

To pin to a specific release: `tyburrowbridge/figbits@v0.1.0`.

**npm alternative** (for use outside Claude Code):

```bash
npm install -g figbits
figbits init
```

---

## Use it

| Step | Command | What it does |
|---|---|---|
| 1 | `/figbits:init` | One-time setup — validates credentials, picks files, installs scheduler. |
| 2 | *(wait for schedule)* | launchd fires automatically on your chosen preset. |
| 3 | `/figbits:run` | Send a digest right now without waiting for the schedule. |

---

## Commands

| Command | What it does |
|---|---|
| `/figbits:init` | One-time setup wizard — PAT, team, files, webhook, schedule. |
| `/figbits:run` | Fetch new comments and post a digest to Slack immediately. |
| `/figbits:files` | Re-open the file picker to add or remove watched files. |
| `/figbits:schedule` | Change the digest schedule and reinstall the launchd job. |
| `/figbits:status` | Show current config, last-run timestamps, and scheduler state. |
| `/figbits:uninstall` | Remove the launchd job (prompts whether to also delete config). |
| `/figbits:whatsnew` | Release notes + check if a newer version is available. |

---

## Project files

- `~/.figbits/config.json` — Figma PAT, team ID, watched files, webhook URL, schedule (chmod 600)
- `~/.figbits/state.json` — `lastRun` timestamps and `surfacedThreads` per file
- `~/Library/LaunchAgents/com.figbits.digest.plist` — macOS scheduler entry

---

## Schedule presets

| Preset | When it runs |
|---|---|
| `daily-9` | Weekdays at 9 am |
| `twice-9-13` | Weekdays at 9 am and 1 pm |
| `hourly-workday` | Every hour, Mon–Fri 8 am–6 pm |
| `weekly-mon` | Monday at 9 am |

Change at any time with `figbits schedule`.

---

## Upgrading

Upgrades go through Claude Code's plugin manager:

```
/plugin update figbits
/reload-plugins
```

After upgrading, run `/figbits:whatsnew` to see what changed.

---

## Uninstall

Remove the scheduler and optionally wipe config:

```
/figbits:uninstall
```

Then remove the plugin from Claude Code:

```
/plugin uninstall figbits@figbits
/plugin marketplace remove figbits
```

**Manual fallback:**

```bash
launchctl unload ~/Library/LaunchAgents/com.figbits.digest.plist
rm ~/Library/LaunchAgents/com.figbits.digest.plist
rm -rf ~/.figbits
```

---

## Known limits (v0.1.0)

- Scheduler requires macOS (launchd) — use `figbits run` + system cron on other platforms
- One Slack channel per installation
- Resolved comments are not filtered — only unresolved threads surface
- No retry on transient Figma or Slack API errors
