import IORedis from "ioredis";
import { env } from "./env.config.js";

// BullMQ requires maxRetriesPerRequest: null
const connection = new IORedis(env.redisUrl, {
  maxRetriesPerRequest: null,
});

// General-purpose cache client for Redis commands
const cache = new IORedis(env.redisUrl, {
  tls: env.redisUrl?.startsWith("rediss://") ? {} : undefined,
});

connection.on("error", (err) =>
  console.error("[Redis/connection] Error:", err.message),
);
connection.on("connect", () => console.log("[Redis/connection] Connected "));

cache.on("error", (err) => console.error("[Redis/cache] Error:", err.message));
cache.on("connect", () => console.log("[Redis/cache] Connected "));

export { connection, cache };
