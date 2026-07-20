import Redis from "iovalkey";
import { logger } from "../logger/factory";

const parseValkeyUrl = () => {
  const url = process.env.VALKEY_URL ?? "valkey://localhost:6379";
  try {
    const parsed = new URL(url);
    return {
      host: parsed.hostname,
      port: parseInt(parsed.port || "6379", 10),
      password: parsed.password || process.env.VALKEY_PASSWORD,
    };
  } catch {
    return {
      host: "localhost",
      port: 6379,
      password: process.env.VALKEY_PASSWORD,
    };
  }
};

const valkeyConfig = parseValkeyUrl();

export const valkey = new Redis({
  host: valkeyConfig.host,
  port: valkeyConfig.port,
  password: valkeyConfig.password,
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => Math.min(times * 200, 2000),
});

valkey.on("connect", () => {
  logger.info({ component: "valkey" }, "Connected to Valkey");
});

valkey.on("error", (err: Error) => {
  logger.error({ component: "valkey", error: err.message }, "Valkey error");
});

valkey.on("ready", () => {
  logger.info({ component: "valkey" }, "Valkey ready");
});

if (process.env.NODE_ENV !== "test") {
  if (process.env.VERCEL || process.env.NODE_ENV === "production") {
    // On serverless platforms (e.g. Vercel) connections are established lazily
    // on first use inside a request so the build step never hangs or fails
    // trying to reach Valkey.
  } else {
    valkey.connect().catch((err: Error) => {
      logger.fatal({ component: "valkey", error: err }, "Failed to connect to Valkey");
    });
  }
}

export type ValkeyClient = typeof valkey;

export function getValkeyClient() {
  return valkey;
}
