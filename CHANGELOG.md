# Changelog

All notable changes to figbits are documented here.

## v0.1.0 — 2026-06-11

### Features
- Initial release as Claude Code plugin
- `/figbits:init` — five-step setup wizard: PAT validation, team discovery, file picker, webhook test, schedule selection
- `/figbits:run` — on-demand digest: fetch, filter, resolve frame names, post to Slack
- `/figbits:files` — re-open file picker to add or remove watched files
- `/figbits:schedule` — change schedule preset and reinstall launchd job
- `/figbits:status` — display config, last-run timestamps, and scheduler state
- `/figbits:uninstall` — remove launchd job and optionally wipe local data
- `/figbits:whatsnew` — release notes viewer with remote version check
- Automated patch version bumping via GitHub Actions on push to main
