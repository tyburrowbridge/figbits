---
name: figbits-status
description: Display current config, last-run timestamps, and launchd scheduler state
user-invocable: false
---

Run:

```bash
npx tsx "${CLAUDE_PLUGIN_ROOT}/src/bin/figbits.ts" status
```

Report the output to the user verbatim.

If the output contains "No config found", tell the user to run `/figbits:init` first.
