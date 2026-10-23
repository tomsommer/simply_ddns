import { fileURLToPath } from "url";

import checkIP from "./lib/checkIP.js";
import getConfig from "./lib/getConfig.js";
import { log, disableLog } from "./lib/logger.js";
import { updateHostnames } from "./lib/simplyApi.js";

const isImported = process.argv[1] !== fileURLToPath(import.meta.url);
if (isImported) {
  disableLog();
}

async function updateDomains(ip) {
  const config = await getConfig();

  for (const [ domain, hostnames ] of Object.entries(config.domains)) {
    await updateHostnames(domain, hostnames, ip);
  }
}

async function app() {
  const newIP = await checkIP();
  if (!newIP) {
    log("IP has not changed, aborting...");
    return;
  }
  await updateDomains(newIP);
}

// Only run if called from terminal, not if imported
if (!isImported) {
  await app();
}

export default app;
