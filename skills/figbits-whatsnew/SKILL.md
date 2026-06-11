---
name: figbits-whatsnew
description: Show release notes from CHANGELOG.md and check remote version
user-invocable: false
---

## 1. Read installed version

Read `${CLAUDE_PLUGIN_ROOT}/.claude-plugin/plugin.json`. Extract `version` field as `installedVersion`.

## 2. Parse CHANGELOG

Read `${CLAUDE_PLUGIN_ROOT}/CHANGELOG.md`.

Split into version sections using this pattern: lines matching `^## v(\d+\.\d+\.\d+\S*) — (\d{4}-\d{2}-\d{2})$`.

For each match, parse:
- `version`: the capture group (e.g. `0.1.0`)
- `isoDate`: the date (format as `Mon DD YYYY`, e.g. `Jun 11 2026`)
- `body`: all lines until the next `## v` header

Parse `body` into categories. Lines matching `^### (.+)$` are category headers. Lines matching `^- (.+)$` are items under the most recent category header.

Keep the 3 most recent version sections.

## 3. Check remote version

Fetch: `https://raw.githubusercontent.com/tyburrowbridge/figbits/main/.claude-plugin/plugin.json`

Extract `version` as `remoteVersion`. If the fetch fails for any reason, set `remoteAvailable = false` and continue.

## 4. Build header

Compare `installedVersion` to `remoteVersion` using semver (strip pre-release suffixes for ordering):

- Equal: `figbits v<installedVersion> · ✓ up to date`
- Remote is newer: `figbits v<installedVersion> · ⬆ v<remoteVersion> available · run /plugin update figbits`
- Local is newer: `figbits v<installedVersion> · ⬆ local build ahead of main (v<remoteVersion>)`
- `remoteAvailable = false`: `figbits v<installedVersion> · ? remote check failed`

## 5. Category icon map

| Category header | Icon |
|---|---|
| Features | ✨ |
| Performance | ⚡ |
| Fixes | 🔧 |
| Polish | 🎨 |
| Breaking | ⚠️ |
| Security | 🔒 |
| Notes (any other) | 📝 |

## 6. Render

Output the header line, then for each of the 3 most recent versions:

```
━━━ v<version> · <date> ━━━

  <icon>  <item text>
  <icon>  <item text>

```

Wrap item text at 80 characters with a 6-space hanging indent on continuation lines. Preserve inline backticks, bold, and italics from the CHANGELOG markdown. Each item inherits the icon of its category — if a version has multiple categories, items from each category use the matching icon.
