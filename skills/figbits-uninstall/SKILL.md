---
name: figbits-uninstall
description: Remove the figbits launchd job and optionally wipe all local data
user-invocable: false
---

Ask the user what they want to remove:

```
  1. Scheduled job only (keep config and state)
  2. Everything (scheduled job + ~/.figbits/ config and state)
  3. Cancel
```

If they choose 3 (Cancel), stop.

For options 1 and 2, remove the launchd job:

```bash
npx tsx "${CLAUDE_PLUGIN_ROOT}/scripts/uninstall-scheduler.ts"
```

Tell the user: `Scheduled job removed.`

If they chose 2 (Everything):

```bash
rm -rf ~/.figbits
```

Tell the user: `Removed ~/.figbits`

Then tell the user to remove the plugin itself from Claude Code:

```
/plugin uninstall figbits@figbits
/plugin marketplace remove figbits
```
