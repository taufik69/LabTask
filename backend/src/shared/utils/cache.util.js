import { cache } from "../../config/redis.config.js";

const safeJsonParse = (value) => {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const getCache = async (key) => {
  const data = await cache.get(key);
  return data ? safeJsonParse(data) : null;
};

const setCache = async (key, value, ttl = 60) => {
  await cache.set(key, JSON.stringify(value), "EX", ttl);
};

const deleteCache = async (key) => {
  await cache.del(key);
};

// ---- namespace versioning helpers ----

const getNsVersion = async (ns) => {
  const v = await cache.get(`${ns}:v`);
  return v ? Number(v) : 1;
};

const bumpNsVersion = async (ns) => {
  // atomic increment — all old versioned keys become unreachable
  const v = await cache.incr(`${ns}:v`);
  if (v === 1) {
    await cache.set(`${ns}:v`, 2);
    return 2;
  }
  return v;
};

const buildCacheKey = async (ns, suffix) => {
  const v = await getNsVersion(ns);
  return `${ns}:v${v}:${suffix}`;
};

export {
  getCache,
  setCache,
  deleteCache,
  getNsVersion,
  bumpNsVersion,
  buildCacheKey,
};
