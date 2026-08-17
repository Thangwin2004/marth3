/* global console */
import { Buffer } from "node:buffer";
import crypto from "node:crypto";
import fs from "node:fs/promises";

const EXPECTED_SHA256 =
  "089b2d6c2261a7b285fa8acf5ff599e6d2aba9c1366f9def4ae1b1f9fefcfbda";
const EXPECTED_PARENTS = [
  "https://winkgames.papastudio.net",
  "http://localhost:3000",
];
const EXPECTED_GAME_ID = "4bc4b359-7b79-4f0c-b740-74dbfc448906";

const [artifactRaw, lockText, configText, indexHtml] = await Promise.all([
  fs.readFile("public/wink-bridge.js"),
  fs.readFile("public/wink-bridge.lock.json", "utf8"),
  fs.readFile("public/wink-runtime-config.json", "utf8"),
  fs.readFile("index.html", "utf8"),
]);
const lock = JSON.parse(lockText);
const config = JSON.parse(configText);
const artifact = Buffer.from(
  artifactRaw.toString("utf8").replace(/\r\n/g, "\n"),
  "utf8",
);
const sha256 = crypto.createHash("sha256").update(artifact).digest("hex");

if (
  Object.keys(config).sort().join(",") !==
    "allowedParentOrigins,bridgeVersion,environment,gameId,protocolVersion" ||
  config.gameId !== EXPECTED_GAME_ID ||
  config.environment !== "prod" ||
  config.protocolVersion !== 1 ||
  config.bridgeVersion !== "9.0.1" ||
  JSON.stringify(config.allowedParentOrigins) !==
    JSON.stringify(EXPECTED_PARENTS) ||
  lock.bridgeVersion !== "9.0.1" ||
  lock.protocolVersion !== 1 ||
  lock.sha256 !== EXPECTED_SHA256 ||
  lock.bytes !== artifact.byteLength ||
  sha256 !== EXPECTED_SHA256 ||
  indexHtml.indexOf('<script src="/wink-bridge.js"></script>') < 0
) {
  throw new Error("Wink production bridge contract is invalid");
}

console.log(
  `wink bridge verified version=9.0.1 protocol=1 bytes=${artifact.byteLength} sha256=${sha256} environment=prod gameId=${config.gameId}`,
);
