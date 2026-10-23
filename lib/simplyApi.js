import axios from "axios";

import getConfig from "./getConfig.js";
import { log, logError } from "./logger.js";

const maxHostnamesPerRequest = 20;

let _instance;

async function getAxiosInstance() {
  if (_instance) {
    return _instance;
  }

  const config = await getConfig();

  _instance = axios.create({
    baseURL: "https://ddns.simply.com",
    timeout: 10000,
    responseType: "text",
    auth: {
      username: config.account,
      password: config.apikey,
    },
  });

  return _instance;
}

function reportResult(domain, hostname, line) {
  const [ code ] = line.trim().split(" ");

  switch (code) {
    case "good":
      log(`Successfully updated hostname ${hostname}`);
      break;
    case "nochg":
      log(`Hostname ${hostname} is already up to date`);
      break;
    case "nohost":
      logError(`Failed to update hostname ${hostname}: no A/AAAA record with that name exists in the DNS zone for ${domain}. Create the record first, in the Simply.com control panel or with the DNS records API.`);
      break;
    case "notfqdn":
      logError(`Failed to update hostname ${hostname}: the hostname, domain or IP address is not valid`);
      break;
    case "abuse":
      logError(`Failed to update hostname ${hostname}: too many updates, try again later`);
      break;
    default:
      logError(`Failed to update hostname ${hostname}: ${line}`);
  }
}

async function updateHostnames(domain, hostnames, ip) {
  const instance = await getAxiosInstance();

  for (let start = 0; start < hostnames.length; start += maxHostnamesPerRequest) {
    const batch = hostnames.slice(start, start + maxHostnamesPerRequest);

    try {
      const response = await instance.get("/nic/update", {
        params: {
          hostname: batch.join(","),
          domain,
          myip: ip,
        },
      });
      const lines = String(response.data).trim().split("\n");

      batch.forEach((hostname, index) => {
        reportResult(domain, hostname, lines[index] ?? lines[0]);
      });
    } catch (error) {
      if (error.response && error.response.status === 401) {
        logError(`Failed to update hostnames ${batch.join(", ")}: authentication failed, check the apikey in config.json`);
      } else {
        logError(`Failed to update hostnames ${batch.join(", ")}`, error);
      }
    }
  }
}

export { updateHostnames };
