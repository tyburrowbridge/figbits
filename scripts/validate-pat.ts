#!/usr/bin/env npx tsx
import { createClient, FigmaError } from "../src/figma/client.js";
import { validatePat } from "../src/figma/files.js";

const pat = process.argv[2];
if (!pat) {
  process.stderr.write("Usage: validate-pat.ts <pat>\n");
  process.exit(1);
}

try {
  const user = await validatePat(createClient(pat));
  process.stdout.write(JSON.stringify(user) + "\n");
} catch (err) {
  if (err instanceof FigmaError) {
    process.stderr.write(`Token rejected (${err.status})\n`);
    process.exit(1);
  }
  throw err;
}
