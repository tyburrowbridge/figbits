---
name: figbits-files
description: Re-pick which Figma files figbits watches for comments
user-invocable: false
---

Read `~/.figbits/config.json`. If it does not exist, tell the user to run `/figbits:init` first. Stop.

Extract `figmaPat`, `teamId`, and `files` (array of currently watched files, collect their `key`s into `currentKeys`).

Fetch the file list:

```bash
npx tsx "${CLAUDE_PLUGIN_ROOT}/scripts/discover-files.ts" "<teamId>" "<figmaPat>"
```

- If exit code 1: show the error and stop.
- If exit code 0: parse stdout as JSON array of `{key, name, projectName, last_modified}`.

Format as a numbered list. Mark currently-watched files with `[✓]`:

```
  1. [✓] Design System  ·  Mobile  ·  2 days ago
  2. [ ] Onboarding Flow  ·  Growth  ·  today
  3. ...
```

Ask the user to type the numbers of files to watch (comma or space separated). An empty response keeps the current selection.

Build `selectedFiles` array from chosen entries.

Read the full existing config JSON from `~/.figbits/config.json`. Merge in the new `files` value. Pipe to write-config:

```bash
echo '<updated config json>' | npx tsx "${CLAUDE_PLUGIN_ROOT}/scripts/write-config.ts"
```

Tell the user: `Watching <N> file(s).`
