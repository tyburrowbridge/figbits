#!/usr/bin/env npx tsx
import { writeConfig } from "../src/config/write.js";
import type { Config } from "../src/config/types.js";

const chunks: Buffer[] = [];
for await (const chunk of process.stdin) chunks.push(chunk as Buffer);
const raw = Buffer.concat(chunks).toString("utf8");
const config: Config = JSON.parse(raw) as Config;
await writeConfig(config);
process.stdout.write("ok\n");
