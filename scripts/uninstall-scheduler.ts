#!/usr/bin/env npx tsx
import { uninstallLaunchAgent } from "../src/schedule/launchd.js";

await uninstallLaunchAgent();
process.stdout.write("ok\n");
