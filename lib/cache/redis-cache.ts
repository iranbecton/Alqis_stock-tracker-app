type RedisCommandResponse<T> = {
  result?: T;
  error?: string;
};

function getRedisConfig() {
  const url = process.env.REDIS_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.REDIS_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    return null;
  }

  return {
    url: url.replace(/\/$/, ""),
    token,
  };
}

export function redisAvailable() {
  return Boolean(getRedisConfig());
}

export async function getRedisCache<T>(key: string): Promise<T | null> {
  const result = await runRedisCommand<string | null>(["GET", key]);

  if (!result) {
    return null;
  }

  return JSON.parse(result) as T;
}

export async function setRedisCache<T>(
  key: string,
  value: T,
  ttlSeconds: number
) {
  await runRedisCommand(["SET", key, JSON.stringify(value), "EX", ttlSeconds]);
}

export async function deleteRedisCache(key: string) {
  await runRedisCommand(["DEL", key]);
}

async function runRedisCommand<T>(command: Array<string | number>) {
  const config = getRedisConfig();

  if (!config) {
    return null;
  }

  const response = await fetch(config.url, {
    method: "POST",
    headers: {
      authorization: `Bearer ${config.token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(command),
    cache: "no-store",
  });
  const json = (await response.json()) as RedisCommandResponse<T>;

  if (!response.ok || json.error) {
    throw new Error(json.error ?? `Redis request failed with ${response.status}.`);
  }

  return json.result ?? null;
}
