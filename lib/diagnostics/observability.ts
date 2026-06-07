import type { CacheMetadata } from "@/lib/cache";
import { stableHash } from "@/lib/cache/keys";

export type ObservabilityEventCategory =
  | "route_request"
  | "cache_hit"
  | "cache_miss"
  | "cache_bypass"
  | "refresh_cooldown"
  | "provider_fallback"
  | "provider_error_sanitized"
  | "rate_limit_allowed"
  | "rate_limit_blocked"
  | "validation_failed"
  | "auth_required_failed"
  | "normalized_error_returned";

export type ObservabilityEvent = {
  category: ObservabilityEventCategory;
  route: string;
  method?: string;
  ticker?: string | null;
  range?: string | null;
  provider?: string | null;
  cacheStatus?: CacheMetadata["cacheStatus"] | null;
  status?: string | number | boolean | null;
  reason?: string | null;
  refreshRequested?: boolean;
  refreshAllowed?: boolean;
  userId?: string | null;
};

type ObservabilityCounter = {
  count: number;
  lastSeenAt: string;
};

const counters = new Map<string, ObservabilityCounter>();
const MAX_COUNTERS = 250;
const PUBLIC_TICKER_PATTERN = /^[A-Z][A-Z0-9.-]{0,9}$/;
const WARNING_CATEGORIES = new Set<ObservabilityEventCategory>([
  "provider_fallback",
  "provider_error_sanitized",
  "rate_limit_blocked",
  "validation_failed",
  "auth_required_failed",
  "normalized_error_returned",
]);

export function recordRouteEvent(event: ObservabilityEvent) {
  const safeEvent = sanitizeEvent(event);
  const key = createCounterKey(safeEvent);
  const existing = counters.get(key);

  counters.set(key, {
    count: (existing?.count ?? 0) + 1,
    lastSeenAt: new Date().toISOString(),
  });

  trimCounters();
  logEvent(safeEvent);
}

export function recordCacheOutcome(
  route: string,
  meta: CacheMetadata,
  context: Omit<ObservabilityEvent, "category" | "route" | "cacheStatus"> = {}
) {
  const category =
    meta.cacheStatus === "hit"
      ? "cache_hit"
      : meta.cacheStatus === "miss"
        ? "cache_miss"
        : meta.cacheStatus === "bypass"
          ? "cache_bypass"
          : "cache_miss";

  recordRouteEvent({
    ...context,
    category,
    route,
    cacheStatus: meta.cacheStatus,
  });
}

export function recordRefreshCooldown({
  route,
  requested,
  allowed,
  ...context
}: {
  route: string;
  requested: boolean;
  allowed: boolean;
} & Omit<ObservabilityEvent, "category" | "route" | "refreshRequested" | "refreshAllowed">) {
  if (!requested) {
    return;
  }

  recordRouteEvent({
    ...context,
    category: "refresh_cooldown",
    route,
    refreshRequested: requested,
    refreshAllowed: allowed,
    status: allowed ? "allowed" : "cooled_down",
  });
}

export function observabilityAvailable() {
  return true;
}

export function getObservabilityCounterCount() {
  return counters.size;
}

function sanitizeEvent(event: ObservabilityEvent): ObservabilityEvent {
  return {
    category: event.category,
    route: sanitizeText(event.route, 80) ?? "unknown",
    method: sanitizeText(event.method, 12),
    ticker: sanitizeTicker(event.ticker),
    range: sanitizeText(event.range, 8),
    provider: sanitizeText(event.provider, 32),
    cacheStatus: event.cacheStatus ?? undefined,
    status: sanitizeStatus(event.status),
    reason: sanitizeText(event.reason, 64),
    refreshRequested: event.refreshRequested,
    refreshAllowed: event.refreshAllowed,
    userId: event.userId ? `hash:${stableHash(event.userId)}` : undefined,
  };
}

function sanitizeTicker(value?: string | null) {
  if (!value) {
    return undefined;
  }

  const ticker = value.trim().toUpperCase();
  return PUBLIC_TICKER_PATTERN.test(ticker) ? ticker : undefined;
}

function sanitizeStatus(value?: string | number | boolean | null) {
  if (typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  return sanitizeText(value, 40);
}

function sanitizeText(value?: string | null, maxLength = 64) {
  if (!value) {
    return undefined;
  }

  return value.replace(/[\u0000-\u001F<>]/g, "").slice(0, maxLength);
}

function createCounterKey(event: ObservabilityEvent) {
  return [
    event.category,
    event.route,
    event.method,
    event.ticker,
    event.range,
    event.provider,
    event.cacheStatus,
    event.status,
  ]
    .filter(Boolean)
    .join(":");
}

function trimCounters() {
  if (counters.size <= MAX_COUNTERS) {
    return;
  }

  const oldestKey = counters.keys().next().value as string | undefined;

  if (oldestKey) {
    counters.delete(oldestKey);
  }
}

function logEvent(event: ObservabilityEvent) {
  const shouldWarn = WARNING_CATEGORIES.has(event.category);

  if (process.env.NODE_ENV === "production" && !shouldWarn) {
    return;
  }

  const logger = shouldWarn ? console.warn : console.info;
  logger("[ALQIS observability]", event);
}
