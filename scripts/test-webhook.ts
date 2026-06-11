#!/usr/bin/env npx tsx
import { postConnectionTest, SlackError } from "../src/slack/webhook.js";

const url = process.argv[2];
if (!url) {
  process.stderr.write("Usage: test-webhook.ts <url>\n");
  process.exit(1);
}

try {
  await postConnectionTest(url);
  process.stdout.write("ok\n");
} catch (err) {
  if (err instanceof SlackError) {
    process.stderr.write(`Slack rejected (${err.status})\n`);
    process.exit(1);
  }
  throw err;
}
