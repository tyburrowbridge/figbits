#!/usr/bin/env npx tsx
import { createClient, FigmaError } from "../src/figma/client.js";
import { discoverFiles } from "../src/figma/files.js";

const [, , teamId, pat] = process.argv;
if (!teamId || !pat) {
  process.stderr.write("Usage: discover-files.ts <teamId> <pat>\n");
  process.exit(1);
}

try {
  const files = await discoverFiles(createClient(pat), teamId);
  process.stdout.write(JSON.stringify(files) + "\n");
} catch (err) {
  if (err instanceof FigmaError) {
    process.stderr.write(`Figma API error (${err.status})\n`);
    process.exit(1);
  }
  throw err;
}
