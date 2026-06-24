---
name: figbits-schedule
description: Change the digest schedule preset and reinstall the launchd job
user-invocable: false
---

Read `~/.figbits/config.json`. If it does not exist, tell the user to run `/figbits:init` first. Stop.

Extract `schedule` (current preset). Display the menu, marking the current selection with `[current]`:

```
  1. Daily at 9:00 AM
  2. Twice daily — 9:00 AM and 1:00 PM
  3. Hourly, 9 AM – 5 PM, Mon–Fri
  4. Weekly — Monday 9:00 AM
```

Map: 1→`daily-9`, 2→`twice-9-13`, 3→`hourly-workday`, 4→`weekly-mon`.

Ask for a number 1–4. Repeat until valid. Store as `newSchedule`.

Merge into config and write:

```bash
echo '<updated config json>' | npx tsx "${CLAUDE_PLUGIN_ROOT}/scripts/write-config.ts"
```

Reinstall the scheduler:

```bash
npx tsx "${CLAUDE_PLUGIN_ROOT}/scripts/install-scheduler.ts" "<newSchedule>"
```

Tell the user: `Schedule updated: <preset label>. Launchd job reinstalled.`
