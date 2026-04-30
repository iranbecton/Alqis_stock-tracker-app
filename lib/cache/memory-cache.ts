type MemoryEntry = {
  value: unknown;
  expiresAt: number;
  cachedAt: string;
};

const store = new Map<string, MemoryEntry>();

export function getMemoryCache<T>(key: string): T | null {
  const entry = store.get(key);

  if (!entry) {
    return null;
  }

  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }

  return entry.value as T;
}

export function setMemoryCache<T>(key: string, value: T, ttlSeconds: number) {
  store.set(key, {
    value,
    expiresAt: Date.now() + ttlSeconds * 1000,
    cachedAt: new Date().toISOString(),
  });
}

export function deleteMemoryCache(key: string) {
  store.delete(key);
}
