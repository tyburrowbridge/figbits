---
name: figbits-run
description: Fetch new Figma comments and post digest to Slack immediately
user-invocable: false
---

## Build check

Before running, ensure the dist output is current. If `dist/bin/figbits.js` does not exist or `src/` is newer, build first:

```bash
cd "${CLAUDE_PLUGIN_ROOT}" && npm run build
```

## Run the digest

```bash
npx tsx "${CLAUDE_PLUGIN_ROOT}/src/bin/figbits.ts" run
```

Report the output to the user verbatim.

If the output contains "No config found", tell the user to run `/figbits:init` first.
