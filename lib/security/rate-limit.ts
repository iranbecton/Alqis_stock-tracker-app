import { getCache, setCache } from "@/lib/cache";
import { stableHash } from "@/lib/cache/keys";

export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: string;
};

export type RateLimitOptions = {
  limit: number;
  windowSeconds: number;
};

export type RefreshCooldownResult = {
  allowed: boolean;
  resetAt?: string;
};

type RateLimitEntry = {
  count: number;
  resetAt: string;
};

type RefreshCooldownEntry = {
  resetAt: string;
};

export const RATE_LIMITS = {
  marketData: { limit: 90, windowSeconds: 60 },
  marketDataRefresh: { limit: 20, windowSeconds: 60 },
  search: { limit: 120, windowSeconds: 60 },
  searchRefresh: { limit: 30, windowSeconds: 60 },
  explain: { limit: 30, windowSeconds: 60 },
  explainRefresh: { limit: 10, windowSeconds: 60 },
  marketBrief: { limit: 20, windowSeconds: 60 },
  diagnostics: { limit: 8, windowSeconds: 60 },
  userMutation: { limit: 60, windowSeconds: 60 },
} as const;

export const REFRESH_COOLDOWNS = {
  marketData: 12,
  search: 8,
  explain: 20,
  marketBrief: 30,
  watchlistIntelligence: 20,
} as const;

export async function rateLimit(
  key: string,
  options: RateLimitOptions
): Promise<RateLimitResult> {
  const now = Date.now();
  const cacheKey = `rate-limit:${stableHash(key)}`;
  const existing = await getCache<RateLimitEntry>(cacheKey);
  const existingReset = existing ? new Date(existing.resetAt).getTime() : 0;
  const isActiveWindow = existing && existingReset > now;
  const resetAt = isActiveWindow
    ? existing.resetAt
    : new Date(now + options.windowSeconds * 1000).toISOString();
  const count = isActiveWindow ? existing.count + 1 : 1;
  const remaining = Math.max(options.limit - count, 0);
  const result: RateLimitResult = {
    allowed: count <= options.limit,
    limit: options.limit,
    remaining,
    resetAt,
  };

  await setCache(
    cacheKey,
    {
      count,
      resetAt,
    },
    Math.max(Math.ceil((new Date(resetAt).getTime() - now) / 1000), 1)
  );

  return result;
}

export function hashId(value: string) {
  return stableHash(value).slice(0, 8);
}

export async function refreshCooldown(
  key: string,
  cooldownSeconds: number
): Promise<RefreshCooldownResult> {
  const now = Date.now();
  const cacheKey = `refresh-cooldown:${stableHash(key)}`;
  const existing = await getCache<RefreshCooldownEntry>(cacheKey);
  const existingReset = existing ? new Date(existing.resetAt).getTime() : 0;

  if (existing && existingReset > now) {
    logRefreshCooldown("blocked", key, existing.resetAt);

    return {
      allowed: false,
      resetAt: existing.resetAt,
    };
  }

  const resetAt = new Date(now + cooldownSeconds * 1000).toISOString();
  await setCache(cacheKey, { resetAt }, cooldownSeconds);
  logRefreshCooldown("allowed", key, resetAt);

  return {
    allowed: true,
    resetAt,
  };
}

export function getRateLimitKey(
  request: Request,
  userId?: string | null,
  routeName = "api"
) {
  const identity = userId ? `user:${userId}` : `ip:${getClientIp(request)}`;
  return `${routeName}:${identity}`;
}

export function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  return (
    request.headers.get("x-real-ip") ??
    request.headers.get("cf-connecting-ip") ??
    "unknown"
  );
}

export function isRefreshRequest(request: Request) {
  const { searchParams } = new URL(request.url);
  const refresh = searchParams.get("refresh");
  return refresh === "true" || refresh === "1";
}

function logRefreshCooldown(
  status: "allowed" | "blocked",
  key: string,
  resetAt: string
) {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  console.error("[ALQIS security] refresh cooldown", {
    status,
    route: getRouteIdentifier(key),
    identityHash: getIdentityHash(key),
    resetAt,
  });
}

function getRouteIdentifier(key: string) {
  return key.split(":")[0] || "api";
}

function getIdentityHash(key: string) {
  const marker = key.includes(":user:") ? ":user:" : ":ip:";
  const markerIndex = key.indexOf(marker);

  if (markerIndex === -1) {
    return hashId(key);
  }

  return hashId(key.slice(markerIndex + marker.length));
}
