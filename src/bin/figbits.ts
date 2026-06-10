#!/usr/bin/env node
import { Command } from "commander";
import { runInit } from "../commands/init.js";
import { runDigest } from "../commands/run.js";
import { runFiles } from "../commands/files.js";
import { runSchedule } from "../commands/schedule.js";
import { runStatus } from "../commands/status.js";
import { runUninstall } from "../commands/uninstall.js";

const program = new Command();

program
  .name("figbits")
  .description("Figma comment digest to Slack")
  .version("0.1.0");

program
  .command("init")
  .description("Run setup wizard")
  .action(async () => {
    await runInit();
  });

program
  .command("run")
  .description("Send one digest to Slack now")
  .action(async () => {
    await runDigest();
  });

program
  .command("files")
  .description("Re-open file picker to add/remove watched files")
  .action(async () => {
    await runFiles();
  });

program
  .command("schedule")
  .description("Change the digest schedule")
  .action(async () => {
    await runSchedule();
  });

program
  .command("status")
  .description("Show current config, last runs, scheduler state")
  .action(async () => {
    await runStatus();
  });

program
  .command("uninstall")
  .description("Remove launchd job (and optionally config)")
  .action(async () => {
    await runUninstall();
  });

program.parseAsync(process.argv).catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  process.stderr.write(`\nerror: ${message}\n`);
  process.exit(1);
});
