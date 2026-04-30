import {
  deleteMemoryCache,
  getMemoryCache,
  setMemoryCache,
} from "@/lib/cache/memory-cache";
import {
  deleteRedisCache,
  getRedisCache,
  redisAvailable,
  setRedisCache,
} from "@/lib/cache/redis-cache";

export type CacheStatus = "hit" | "miss" | "bypass" | "unavailable";

export type CacheMetadata = {
  cacheStatus: CacheStatus;
  cachedAt?: string;
  expiresAt?: string;
};

type CachedValue<T> = {
  value: T;
  cachedAt: string;
  expiresAt: string;
};

type WithCacheOptions = {
  forceRefresh?: boolean;
  shouldCache?: (data: unknown) => boolean;
};

const useMemoryFallback = process.env.NODE_ENV !== "production";
let warnedUnavailable = false;
let warnedMemoryFallback = false;

export function cacheAvailable() {
  return redisAvailable() || useMemoryFallback;
}

export async function getCache<T>(key: string): Promise<T | null> {
  const entry = await getCacheEntry<T>(key);
  return entry?.value ?? null;
}

export async function setCache<T>(
  key: string,
  value: T,
  ttlSeconds: number
): Promise<void> {
  const entry: CachedValue<T> = {
    value,
    cachedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + ttlSeconds * 1000).toISOString(),
  };

  try {
    if (redisAvailable()) {
      await setRedisCache(key, entry, ttlSeconds);
      return;
    }

    if (useMemoryFallback) {
      warnMemoryFallback();
      setMemoryCache(key, entry, ttlSeconds);
      return;
    }

    warnCacheUnavailable();
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[ALQIS cache] Cache write failed", { key, error });
    }
  }
}

export async function deleteCache(key: string): Promise<void> {
  try {
    if (redisAvailable()) {
      await deleteRedisCache(key);
      return;
    }

    if (useMemoryFallback) {
      warnMemoryFallback();
      deleteMemoryCache(key);
    }
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[ALQIS cache] Cache delete failed", { key, error });
    }
  }
}

export async function withCache<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>,
  options: WithCacheOptions = {}
): Promise<{ data: T; meta: CacheMetadata }> {
  if (options.forceRefresh) {
    logCache("bypass", key);
    const data = await fetcher();
    if (shouldWriteCache(data, options)) {
      await setCache(key, data, ttlSeconds);
    }
    return {
      data,
      meta: createMetadata("bypass", ttlSeconds),
    };
  }

  const cached = await getCacheEntry<T>(key);

  if (cached) {
    logCache("hit", key);
    return {
      data: cached.value,
      meta: {
        cacheStatus: "hit",
        cachedAt: cached.cachedAt,
        expiresAt: cached.expiresAt,
      },
    };
  }

  if (!cacheAvailable()) {
    warnCacheUnavailable();
    const data = await fetcher();
    return {
      data,
      meta: { cacheStatus: "unavailable" },
    };
  }

  logCache("miss", key);
  const data = await fetcher();
  if (shouldWriteCache(data, options)) {
    await setCache(key, data, ttlSeconds);
  }

  return {
    data,
    meta: createMetadata("miss", ttlSeconds),
  };
}

function shouldWriteCache<T>(data: T, options: WithCacheOptions) {
  return options.shouldCache ? options.shouldCache(data) : true;
}

async function getCacheEntry<T>(key: string): Promise<CachedValue<T> | null> {
  try {
    if (redisAvailable()) {
      return await getRedisCache<CachedValue<T>>(key);
    }

    if (useMemoryFallback) {
      warnMemoryFallback();
      return getMemoryCache<CachedValue<T>>(key);
    }

    warnCacheUnavailable();
    return null;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[ALQIS cache] Cache read failed", { key, error });
    }

    return null;
  }
}

function createMetadata(status: CacheStatus, ttlSeconds: number): CacheMetadata {
  const cachedAt = new Date();

  return {
    cacheStatus: status,
    cachedAt: cachedAt.toISOString(),
    expiresAt: new Date(cachedAt.getTime() + ttlSeconds * 1000).toISOString(),
  };
}

function logCache(status: CacheStatus, key: string) {
  if (process.env.NODE_ENV === "development") {
    console.error("[ALQIS cache]", { status, key });
  }
}

function warnMemoryFallback() {
  if (warnedMemoryFallback || process.env.NODE_ENV !== "development") {
    return;
  }

  warnedMemoryFallback = true;
  console.error("[ALQIS cache] Redis unavailable; using development memory cache.");
}

function warnCacheUnavailable() {
  if (warnedUnavailable || process.env.NODE_ENV !== "development") {
    return;
  }

  warnedUnavailable = true;
  console.error("[ALQIS cache] Redis unavailable; using no-op cache in production.");
}
