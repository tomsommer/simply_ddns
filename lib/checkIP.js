import axios from "axios";
import { readFile, writeFile } from "fs/promises";

const ipFilePath = "./config/.ip";

async function getCurrentIP() {
  const response = await axios.get("https://api.ipify.org?format=json");

  if (!response.data || !response.data.ip) {
    return false;
  }

  return response.data.ip;
}

async function getPreviousIP() {
  try {
    return await readFile(ipFilePath, { encoding: "utf8" });
  } catch {
    return false;
  }
}

async function checkIP() {
  const previousIP = await getPreviousIP();
  const currentIP = await getCurrentIP();

  if (currentIP === false) {
    return false;
  }

  writeFile(ipFilePath, currentIP);

  if (currentIP === previousIP) {
    return false;
  }

  return currentIP;
}

export default checkIP;
